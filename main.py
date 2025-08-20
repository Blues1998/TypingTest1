"""
Typing Test Application
-----------------------
A Tkinter-based typing test application with multiple modes (stopwatch, countdown),
custom text entry, score tracking, and history visualization using Matplotlib.

Features:
- Stopwatch and countdown typing modes
- Random or user-selected passages
- Accuracy, WPM, and time calculations
- Persistent score saving (top 5 scores)
- Graphical history view with WPM trend visualization
"""

import csv
import os
import random
import time
import logging
import tkinter as tk
from tkinter import simpledialog, ttk, messagebox

import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg

# Suppress noisy third-party libs
logging.getLogger("matplotlib").setLevel(logging.WARNING)
logging.getLogger("PIL").setLevel(logging.WARNING)
# --------------------------
# Configuration & Constants
# --------------------------
SENTENCE_FILE = "sentences.txt"
LONG_TEXT_FILE = "long_texts.txt"
WORDS_FILE = "words.txt"
SCORES_FILE = "scores.csv"

# Logging setup
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.FileHandler("typing_app.log"), logging.StreamHandler()]
)
logger = logging.getLogger(__name__)


class TypingApp(tk.Tk):
    """Main application class for the Typing Test."""

    def __init__(self):
        super().__init__()
        self.title("Typing Test")
        self.geometry("1100x800")
        self.configure(bg="#121212")

        # ttk styling for dark mode
        style = ttk.Style(self)
        style.theme_use("clam")
        style.configure("TButton", font=("Helvetica", 14), padding=10,
                        background="#333333", foreground="white")
        style.map("TButton", background=[("active", "#444444")])
        style.configure("TLabel", background="#121212", foreground="white", font=("Helvetica", 14))
        style.configure("TEntry", fieldbackground="#1e1e1e", foreground="white", insertcolor="white")

        # Load resources
        self.sentences = self.load_sentences(SENTENCE_FILE)
        self.long_texts = self.load_sentences(LONG_TEXT_FILE)
        self.words = self.load_sentences(WORDS_FILE)
        self.current_frame = None

        logger.info("Application started.")
        self.show_main_menu()

    def load_sentences(self, filename):
        """Load sentences or long texts from a file into a list."""
        if not os.path.exists(filename):
            logger.warning(f"File not found: {filename}. Returning empty list.")
            return []
        with open(filename, "r") as f:
            lines = [line.strip() for line in f if line.strip()]
        logger.debug(f"Loaded {len(lines)} entries from {filename}.")
        return lines

    def switch_frame(self, frame_class, **kwargs):
        """Switch between different UI frames."""
        if self.current_frame:
            self.current_frame.destroy()
        self.current_frame = frame_class(self, **kwargs)
        self.current_frame.pack(fill="both", expand=True, padx=20, pady=20)
        logger.debug(f"Switched to frame: {frame_class.__name__}")

    def get_high_score(self):
        """Retrieve the highest WPM score from saved scores."""
        if not os.path.exists(SCORES_FILE):
            return 0
        with open(SCORES_FILE, "r") as f:
            reader = csv.DictReader(f)
            wpms = [float(row["WPM"]) for row in reader]
            return max(wpms) if wpms else 0

    def show_main_menu(self):
        """Display the main menu screen."""
        self.switch_frame(MainMenuFrame)


class MainMenuFrame(tk.Frame):
    """Main menu where the user selects typing mode and text."""

    def __init__(self, master):
        super().__init__(master, bg="#121212")

        high_score = master.get_high_score()
        logger.info(f"Displaying main menu. Current high score: {high_score:.2f} WPM")

        tk.Label(self, text="Typing Test", font=("Helvetica", 36, "bold"),
                 bg="#121212", fg="white").pack(pady=20)
        tk.Label(self, text=f"High Score: {high_score:.2f} WPM",
                 font=("Helvetica", 18), bg="#121212", fg="white").pack(pady=10)

        # Mode selection
        tk.Label(self, text="Choose Mode:", font=("Helvetica", 20, "bold"),
                 bg="#121212", fg="white").pack(pady=10)

        ttk.Button(self, text="Stopwatch Mode",
                   command=lambda: master.switch_frame(TypingFrame, mode="stopwatch")).pack(pady=8)
        ttk.Button(self, text="Countdown Mode (60s)",
                   command=lambda: master.switch_frame(TypingFrame, mode="countdown")).pack(pady=8)
        ttk.Button(self, text="Word Bubble Mode",
                   command=lambda: master.switch_frame(BubbleFrame)).pack(pady=8)

        # Text selection
        tk.Label(self, text="Choose Text:", font=("Helvetica", 20, "bold"),
                 bg="#121212", fg="white").pack(pady=15)
        self.selected_text = tk.StringVar(value="Random")
        texts = ["Random"] + master.sentences
        dropdown = ttk.Combobox(self, textvariable=self.selected_text, values=texts, width=80)
        dropdown.pack(pady=5)

        ttk.Button(self, text="Start with Selected Text", command=self.start_with_selected).pack(pady=10)
        ttk.Button(self, text="+ Add Custom Text", command=self.add_custom_text).pack(pady=10)
        ttk.Button(self, text="View History",
                   command=lambda: master.switch_frame(HistoryFrame)).pack(pady=20)

    def start_with_selected(self):
        """Start typing with the chosen text."""
        text = self.selected_text.get()
        logger.debug(f"Selected text for typing: {text}")
        if text == "Random":
            self.master.switch_frame(TypingFrame, mode="stopwatch")
        else:
            self.master.switch_frame(TypingFrame, mode="stopwatch", text=text)

    def add_custom_text(self):
        """Prompt user to add a custom text to the sentence file."""
        custom_text = simpledialog.askstring("Add Custom Text", "Enter your custom passage:")
        if custom_text:
            custom_text = custom_text.strip()
            if custom_text in self.master.sentences:
                messagebox.showinfo("Duplicate Text", "This text already exists!")
                logger.warning("Duplicate custom text attempted.")
                return
            with open(SENTENCE_FILE, "a") as f:
                f.write(custom_text + "\n")
            self.master.sentences.append(custom_text)
            logger.info("Custom text added successfully.")


class TypingFrame(tk.Frame):
    """Frame for the typing test itself."""

    def __init__(self, master, mode="stopwatch", text=None):
        super().__init__(master, bg="#121212")
        self.master = master
        self.mode = mode

        # Determine passage to type
        if text:
            self.text_to_type = text
        elif mode == "countdown" and master.long_texts:
            self.text_to_type = random.choice(master.long_texts)
        else:
            self.text_to_type = random.choice(master.sentences or ["Default text."])

        logger.debug(f"Typing test started. Mode: {mode}, Passage length: {len(self.text_to_type)}")

        # State
        self.start_time = None
        self.running = False
        self.time_limit = 60 if mode == "countdown" else None

        # UI elements
        tk.Label(self, text="Type the text below:", font=("Helvetica", 18, "bold"),
                 bg="#121212", fg="white").pack(pady=10)

        # Display passage
        self.text_display = tk.Text(
            self, font=("Helvetica", 16), wrap="word", height=6, width=90,
            bg="#1e1e1e", fg="white", padx=10, pady=10, relief="solid", bd=1
        )
        self.text_display.pack(pady=20)
        self.text_display.insert("1.0", self.text_to_type)
        self.text_display.config(state="disabled")

        # Typing input
        self.entry = tk.Text(self, font=("Helvetica", 14), height=5, width=90,
                             bg="#1e1e1e", fg="white", insertbackground="white", wrap="word")
        self.entry.pack(pady=10, ipady=6)
        self.entry.bind("<KeyRelease>", self.check_typing)
        self.entry.bind("<Return>", self.calculate_results)

        self.timer_label = tk.Label(self, text="Time: 0.00s", font=("Helvetica", 16),
                                    bg="#121212", fg="white")
        self.timer_label.pack(pady=10)
        self.result_label = tk.Label(self, text="", font=("Helvetica", 16),
                                     bg="#121212", fg="white", pady=10)
        self.result_label.pack(pady=15)

        # Back button
        bottom_frame = tk.Frame(self, bg="#121212")
        bottom_frame.pack(side="bottom", pady=15, fill="x")
        ttk.Button(bottom_frame, text="Back to Menu",
                   command=lambda: master.show_main_menu()).pack()

    def start_timer(self):
        """Start the typing timer."""
        if not self.running:
            self.start_time = time.time()
            self.running = True
            self.update_timer()
            logger.debug("Timer started.")

    def update_timer(self):
        """Update the timer display depending on mode."""
        if self.running:
            elapsed = time.time() - self.start_time
            if self.mode == "countdown":
                remaining = max(0, self.time_limit - elapsed)
                self.timer_label.config(text=f"Time Left: {remaining:.2f}s")
                if remaining <= 0:
                    logger.info("Countdown finished.")
                    self.calculate_results(None)
                    return
            else:
                self.timer_label.config(text=f"Time: {elapsed:.2f}s")
            self.after(100, self.update_timer)

    def check_typing(self, event):
        """Highlight correct and incorrect characters as user types."""
        if self.start_time is None and self.entry.get("1.0", "end-1c").strip():
            self.start_timer()

        typed_text = self.entry.get("1.0", "end-1c")
        self.text_display.config(state="normal")
        self.text_display.delete("1.0", "end")

        for i, char in enumerate(self.text_to_type):
            if i < len(typed_text):
                tag = "correct" if typed_text[i] == char else "wrong"
                self.text_display.insert("end", char, tag)
            else:
                self.text_display.insert("end", char)
        self.text_display.tag_config("correct", foreground="lightgreen")
        self.text_display.tag_config("wrong", foreground="red")
        self.text_display.config(state="disabled")

    def calculate_results(self, event):
        """Stop test and calculate WPM, accuracy, and time."""
        if not self.running:
            return
        self.running = False

        elapsed = time.time() - self.start_time if self.start_time else 0
        typed_text = self.entry.get("1.0", "end-1c")

        correct_chars = sum(1 for a, b in zip(typed_text, self.text_to_type) if a == b)
        accuracy = (correct_chars / len(typed_text)) * 100 if self.text_to_type else 0
        words = len(typed_text) / 5
        minutes = elapsed / 60 if elapsed > 0 else 1
        wpm = words / minutes

        logger.info(f"Results - Time: {elapsed:.2f}s, WPM: {wpm:.2f}, Accuracy: {accuracy:.2f}%")

        self.result_label.config(
            text=f"Final Time: {elapsed:.2f}s\nWPM: {wpm:.2f}\nAccuracy: {accuracy:.2f}%"
        )
        self.entry.config(state="disabled")
        self.save_score(elapsed, wpm, accuracy)

    def save_score(self, time_taken, wpm, accuracy):
        """Save the new score to CSV, keeping only top 5 by WPM."""
        new_entry = {"Time": f"{time_taken:.2f}", "WPM": f"{wpm:.2f}", "Accuracy": f"{accuracy:.2f}"}
        scores = []

        if os.path.exists(SCORES_FILE):
            with open(SCORES_FILE, "r") as f:
                reader = csv.DictReader(f)
                scores = list(reader)

        scores.append(new_entry)
        scores = sorted(scores, key=lambda x: float(x["WPM"]), reverse=True)[:5]

        with open(SCORES_FILE, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=["Time", "WPM", "Accuracy"])
            writer.writeheader()
            writer.writerows(scores)

        logger.debug(f"Score saved: {new_entry}")


class HistoryFrame(tk.Frame):
    """Frame for displaying typing history and WPM trends."""

    def __init__(self, master):
        super().__init__(master, bg="#121212")

        tk.Label(self, text="Top 5 Scores", font=("Helvetica", 24, "bold"),
                 bg="#121212", fg="white").pack(pady=10)

        if os.path.exists(SCORES_FILE):
            with open(SCORES_FILE, "r") as f:
                reader = csv.DictReader(f)
                rows = list(reader)

            if rows:
                self.display_graph(rows)
                self.display_table(rows)
        else:
            tk.Label(self, text="No history yet.", font=("Helvetica", 16),
                     bg="#121212", fg="white").pack(pady=20)

        # Back button
        bottom_frame = tk.Frame(self, bg="#121212")
        bottom_frame.pack(side="bottom", pady=15, fill="x")
        ttk.Button(bottom_frame, text="Back to Menu",
                   command=lambda: master.show_main_menu()).pack()

    def display_graph(self, rows):
        """Render line graph of WPM progression."""
        times = list(range(1, len(rows) + 1))
        wpms = [float(row["WPM"]) for row in rows]

        fig, ax = plt.subplots(figsize=(6, 3), dpi=100)
        ax.plot(times, wpms, marker="o", color="cyan", label="WPM")
        ax.set_facecolor("#1e1e1e")
        fig.patch.set_facecolor("#121212")
        ax.set_title("Progress Over Time", color="white")
        ax.set_xlabel("Test Rank", color="white")
        ax.set_ylabel("Words per Minute", color="white")
        ax.tick_params(colors="white")
        for spine in ax.spines.values():
            spine.set_color("white")
        ax.grid(True, color="#333333")
        ax.legend(facecolor="#121212", edgecolor="white", labelcolor="white")
        fig.tight_layout(pad=2, rect=[0, 0.05, 1, 1])

        graph_frame = tk.Frame(self, bg="#121212")
        graph_frame.pack(pady=(10, 5), fill="x")
        canvas = FigureCanvasTkAgg(fig, master=graph_frame)
        canvas.draw()
        canvas.get_tk_widget().pack()

    def display_table(self, rows):
        """Display results in a styled treeview table."""
        columns = ("time", "wpm", "accuracy")
        tree = ttk.Treeview(self, columns=columns, show="headings", height=5)
        tree.pack(pady=10, padx=20, fill="both", expand=True)

        style = ttk.Style(self)
        style.configure("Treeview",
                        background="#1e1e1e",
                        foreground="white",
                        fieldbackground="#1e1e1e",
                        rowheight=25,
                        font=("Helvetica", 12))
        style.configure("Treeview.Heading",
                        background="#333333",
                        foreground="white",
                        font=("Helvetica", 13, "bold"))

        tree.heading("time", text="Time Taken (s)")
        tree.heading("wpm", text="WPM")
        tree.heading("accuracy", text="Accuracy (%)")

        for row in rows:
            tree.insert("", "end", values=(row["Time"], row["WPM"], row["Accuracy"]))


class BubbleFrame(tk.Frame):
    """Typing game with falling word bubbles."""

    def __init__(self, master):
        super().__init__(master, bg="#121212")
        self.master = master
        self.running = True
        self.strikes = 0
        self.bubbles = []
        self.score = 0
        self.speed = 2  # fall speed (pixels per frame)
        self.max_speed = 25
        self.spawn_interval = 2500  # initial bubble spawn interval (ms)
        self.min_spawn_interval = 1200  # minimum interval cap
        self.words_pool = list(set(self.master.words))
        self.used_words = set()

        # Canvas for bubbles
        self.canvas = tk.Canvas(self, bg="#121212", width=1000, height=600, highlightthickness=0)
        self.canvas.pack(pady=20)

        # Score + Strikes + Speed display
        top_frame = tk.Frame(self, bg="#121212")
        top_frame.pack()
        self.score_label = tk.Label(top_frame, text="Score: 0", font=("Helvetica", 16),
                                    bg="#121212", fg="cyan")
        self.score_label.pack(side="left", padx=20)
        self.strike_label = tk.Label(top_frame, text="Strikes: 0/3", font=("Helvetica", 16),
                                     bg="#121212", fg="red")
        self.strike_label.pack(side="left", padx=20)
        self.speed_label = tk.Label(top_frame, text=f"Speed: {self.speed:.1f}", font=("Helvetica", 16),
                                    bg="#121212", fg="orange")
        self.speed_label.pack(side="left", padx=20)

        # Entry for typing
        self.entry = tk.Entry(self, font=("Helvetica", 16), bg="#1e1e1e", fg="white",
                              insertbackground="white")
        self.entry.pack(pady=10)
        self.entry.bind("<KeyRelease>", self.check_word)   # instant check, no Return needed
        self.entry.bind("<Return>", self.clear_entry)      # pressing Enter clears text
        self.entry.focus_set()  # auto-focus input box at start

        # Back button
        ttk.Button(self, text="Back to Menu", command=self.stop_game).pack(pady=10)

        # Start loop
        self.spawn_bubble()
        self.update_bubbles()

    def stop_game(self):
        """Exit to menu."""
        self.running = False
        self.master.show_main_menu()

    def get_next_word(self):
        """Pick a non-repeated word, reset pool if exhausted."""
        if not self.words_pool:  # refill when exhausted
            self.words_pool = list(set(self.master.words))
            self.used_words.clear()
        word = random.choice(self.words_pool)
        self.words_pool.remove(word)
        self.used_words.add(word)
        return word

    def spawn_bubble(self):
        """Spawn a new word bubble at top."""
        if not self.running:
            return

        word = self.get_next_word()
        x = random.randint(100, 900)
        y = -30

        r = 40
        circle = self.canvas.create_oval(x-r, y-r, x+r, y+r, fill="#3333aa", outline="white")
        text = self.canvas.create_text(x, y, text=word, fill="white", font=("Helvetica", 14, "bold"))

        self.bubbles.append({"word": word, "x": x, "y": y, "circle": circle, "text": text})

        # Schedule next bubble using dynamic interval
        self.after(self.spawn_interval, self.spawn_bubble)

    def update_bubbles(self):
        """Move bubbles down and check for misses."""
        if not self.running:
            return

        to_remove = []
        for bubble in self.bubbles:
            bubble["y"] += self.speed
            self.canvas.coords(bubble["circle"], bubble["x"]-40, bubble["y"]-40,
                               bubble["x"]+40, bubble["y"]+40)
            self.canvas.coords(bubble["text"], bubble["x"], bubble["y"])

            if bubble["y"] >= 600:  # reached bottom
                to_remove.append(bubble)
                self.strikes += 1
                self.strike_label.config(text=f"Strikes: {self.strikes}/3")

                # Penalty: clear all bubbles on strike
                self.clear_all_bubbles()

                if self.strikes >= 3:
                    self.game_over()

        for b in to_remove:
            self.canvas.delete(b["circle"])
            self.canvas.delete(b["text"])
            if b in self.bubbles:
                self.bubbles.remove(b)

        self.after(50, self.update_bubbles)  # update ~20 fps

    def clear_all_bubbles(self):
        """Remove all bubbles from the screen."""
        for b in self.bubbles:
            self.canvas.delete(b["circle"])
            self.canvas.delete(b["text"])
        self.bubbles.clear()

    def check_word(self, event):
        """Check if typed word matches a bubble instantly."""
        typed = self.entry.get().strip()
        if not typed:
            return

        for bubble in self.bubbles:
            if bubble["word"] == typed:
                self.canvas.delete(bubble["circle"])
                self.canvas.delete(bubble["text"])
                self.bubbles.remove(bubble)

                # Update score
                self.score += 1
                self.score_label.config(text=f"Score: {self.score}")

                # Increase fall speed (max capped)
                if self.score % 5 == 0 and self.speed < self.max_speed:
                    self.speed += 1
                    self.speed_label.config(text=f"Speed: {self.speed}")

                # Decrease spawn interval gradually (spawn faster)
                if self.score % 3 == 0 and self.spawn_interval > self.min_spawn_interval:
                    self.spawn_interval -= 100  # decrease by 100ms
                    if self.spawn_interval < self.min_spawn_interval:
                        self.spawn_interval = self.min_spawn_interval

                # Clear entry after hit
                self.entry.delete(0, "end")
                break

    def clear_entry(self, event):
        """Clear input when Enter is pressed (even if no bubble matched)."""
        self.entry.delete(0, "end")
        return "break"  # prevent newline beep

    def game_over(self):
        """End the game after 3 strikes."""
        self.running = False
        self.canvas.create_text(500, 300, text=f"GAME OVER\nScore: {self.score}",
                                fill="red", font=("Helvetica", 36, "bold"))


if __name__ == "__main__":
    app = TypingApp()
    app.mainloop()
