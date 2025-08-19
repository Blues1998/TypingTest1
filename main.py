import csv
import os
import random
import time
import tkinter as tk
from tkinter import simpledialog, ttk, messagebox

import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg

SENTENCE_FILE = "sentences.txt"
LONG_TEXT_FILE = "long_texts.txt"
SCORES_FILE = "scores.csv"


class TypingApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Typing Test")
        self.geometry("1100x800")
        self.configure(bg="#121212")  # dark mode background

        # ttk styling for dark mode
        style = ttk.Style(self)
        style.theme_use("clam")
        style.configure("TButton", font=("Helvetica", 14), padding=10,
                        background="#333333", foreground="white")
        style.map("TButton", background=[("active", "#444444")])
        style.configure("TLabel", background="#121212", foreground="white", font=("Helvetica", 14))
        style.configure("TEntry", fieldbackground="#1e1e1e", foreground="white", insertcolor="white")

        self.sentences = self.load_sentences(SENTENCE_FILE)
        self.long_texts = self.load_sentences(LONG_TEXT_FILE)
        self.current_frame = None

        self.show_main_menu()

    def load_sentences(self, filename):
        if not os.path.exists(filename):
            return []
        with open(filename, "r") as f:
            return [line.strip() for line in f if line.strip()]

    def switch_frame(self, frame_class, **kwargs):
        if self.current_frame:
            self.current_frame.destroy()
        self.current_frame = frame_class(self, **kwargs)
        self.current_frame.pack(fill="both", expand=True, padx=20, pady=20)

    def get_high_score(self):
        if not os.path.exists(SCORES_FILE):
            return 0
        with open(SCORES_FILE, "r") as f:
            reader = csv.DictReader(f)
            wpms = [float(row["WPM"]) for row in reader]
            return max(wpms) if wpms else 0

    def show_main_menu(self):
        self.switch_frame(MainMenuFrame)


class MainMenuFrame(tk.Frame):
    def __init__(self, master):
        super().__init__(master, bg="#121212")

        high_score = master.get_high_score()

        tk.Label(self, text="⌨ Typing Test", font=("Helvetica", 36, "bold"),
                 bg="#121212", fg="white").pack(pady=20)
        tk.Label(self, text=f"🏆 High Score: {high_score:.2f} WPM",
                 font=("Helvetica", 18), bg="#121212", fg="white").pack(pady=10)

        tk.Label(self, text="Choose Mode:", font=("Helvetica", 20, "bold"),
                 bg="#121212", fg="white").pack(pady=10)

        ttk.Button(self, text="Stopwatch Mode",
                   command=lambda: master.switch_frame(TypingFrame, mode="stopwatch")).pack(pady=8)

        ttk.Button(self, text="Countdown Mode (60s)",
                   command=lambda: master.switch_frame(TypingFrame, mode="countdown")).pack(pady=8)

        tk.Label(self, text="Choose Text:", font=("Helvetica", 20, "bold"),
                 bg="#121212", fg="white").pack(pady=15)

        # Dropdown for text selection
        self.selected_text = tk.StringVar(value="Random")
        texts = ["Random"] + master.sentences
        dropdown = ttk.Combobox(self, textvariable=self.selected_text, values=texts, width=80)
        dropdown.pack(pady=5)

        ttk.Button(self, text="Start with Selected Text",
                   command=self.start_with_selected).pack(pady=10)

        ttk.Button(self, text="+ Add Custom Text",
                   command=self.add_custom_text).pack(pady=10)

        ttk.Button(self, text="📊 View History",
                   command=lambda: master.switch_frame(HistoryFrame)).pack(pady=20)

        tk.Label(self, text="ℹ Pick a mode & passage, then type away!\n"
                            "Your score will be saved automatically.",
                 font=("Helvetica", 12), bg="#121212", fg="gray").pack(pady=10)

    def start_with_selected(self):
        text = self.selected_text.get()
        if text == "Random":
            self.master.switch_frame(TypingFrame, mode="stopwatch")
        else:
            self.master.switch_frame(TypingFrame, mode="stopwatch", text=text)

    def add_custom_text(self):
        custom_text = simpledialog.askstring("Add Custom Text", "Enter your custom passage:")
        if custom_text:
            custom_text = custom_text.strip()
            if custom_text in self.master.sentences:
                messagebox.showinfo("Duplicate Text", "This text already exists!")
                return
            with open(SENTENCE_FILE, "a") as f:
                f.write(custom_text + "\n")
            self.master.sentences.append(custom_text)


class TypingFrame(tk.Frame):
    def __init__(self, master, mode="stopwatch", text=None):
        super().__init__(master, bg="#121212")
        self.master = master
        self.mode = mode

        if text:
            self.text_to_type = text
        elif mode == "countdown" and master.long_texts:
            self.text_to_type = random.choice(master.long_texts)
        else:
            self.text_to_type = random.choice(master.sentences or [
                "Default text because sentences.txt is empty."
            ])

        self.start_time = None
        self.running = False
        self.time_limit = 60 if mode == "countdown" else None

        tk.Label(self, text="Type the text below:", font=("Helvetica", 18, "bold"),
                 bg="#121212", fg="white").pack(pady=10)

        # Sentence display
        self.text_display = tk.Text(
            self, font=("Helvetica", 16), wrap="word", height=6, width=90,
            bg="#1e1e1e", fg="white", padx=10, pady=10, relief="solid", bd=1
        )
        self.text_display.pack(pady=20)
        self.text_display.insert("1.0", self.text_to_type)
        self.text_display.config(state="disabled")

        # Typing field (multiline now)
        self.entry = tk.Text(self, font=("Helvetica", 14), height=5, width=90,
                             bg="#1e1e1e", fg="white", insertbackground="white", wrap="word")
        self.entry.pack(pady=10, ipady=6)
        self.entry.bind("<KeyRelease>", self.check_typing)
        self.entry.bind("<Return>", self.calculate_results)

        # Instruction label
        tk.Label(self, text="↵ Press Enter to submit & finish the test.",
                 font=("Helvetica", 12), bg="#121212", fg="gray").pack(pady=5)

        # Timer
        self.timer_label = tk.Label(self, text="Time: 0.00s", font=("Helvetica", 16),
                                    bg="#121212", fg="white")
        self.timer_label.pack(pady=10)

        # Results
        self.result_label = tk.Label(self, text="", font=("Helvetica", 16),
                                     bg="#121212", fg="white", pady=10)
        self.result_label.pack(pady=15)

        # Bottom frame for menu button (always visible)
        bottom_frame = tk.Frame(self, bg="#121212")
        bottom_frame.pack(side="bottom", pady=15, fill="x")
        ttk.Button(bottom_frame, text="⬅ Back to Menu",
                   command=lambda: master.show_main_menu()).pack()

    def start_timer(self):
        if not self.running:
            self.start_time = time.time()
            self.running = True
            self.update_timer()

    def update_timer(self):
        if self.running:
            elapsed = time.time() - self.start_time
            if self.mode == "countdown":
                remaining = max(0, self.time_limit - elapsed)
                self.timer_label.config(text=f"Time Left: {remaining:.2f}s")
                if remaining <= 0:
                    self.calculate_results(None)
                    return
            else:
                self.timer_label.config(text=f"Time: {elapsed:.2f}s")
            self.after(100, self.update_timer)

    def check_typing(self, event):
        if self.start_time is None and self.entry.get("1.0", "end-1c").strip():
            self.start_timer()

        typed_text = self.entry.get("1.0", "end-1c")
        self.text_display.config(state="normal")
        self.text_display.delete("1.0", "end")

        for i, char in enumerate(self.text_to_type):
            if i < len(typed_text):
                if typed_text[i] == char:
                    self.text_display.insert("end", char, "correct")
                else:
                    self.text_display.insert("end", char, "wrong")
            else:
                self.text_display.insert("end", char)
        self.text_display.tag_config("correct", foreground="lightgreen")
        self.text_display.tag_config("wrong", foreground="red")
        self.text_display.config(state="disabled")

    def calculate_results(self, event):
        if not self.running:
            return
        self.running = False

        elapsed = time.time() - self.start_time if self.start_time else 0
        typed_text = self.entry.get("1.0", "end-1c")

        correct_chars = sum(1 for a, b in zip(typed_text, self.text_to_type) if a == b)
        accuracy = (correct_chars / len(self.text_to_type)) * 100 if self.text_to_type else 0

        words = len(typed_text) / 5
        minutes = elapsed / 60 if elapsed > 0 else 1
        wpm = words / minutes

        self.result_label.config(
            text=f"Final Time: {elapsed:.2f}s\nWPM: {wpm:.2f}\nAccuracy: {accuracy:.2f}%"
        )

        self.entry.config(state="disabled")
        self.save_score(elapsed, wpm, accuracy)

    def save_score(self, time_taken, wpm, accuracy):
        new_entry = {"Time": f"{time_taken:.2f}", "WPM": f"{wpm:.2f}", "Accuracy": f"{accuracy:.2f}"}

        scores = []
        if os.path.exists(SCORES_FILE):
            with open(SCORES_FILE, "r") as f:
                reader = csv.DictReader(f)
                scores = list(reader)

        scores.append(new_entry)
        # Keep only top 5 by WPM
        scores = sorted(scores, key=lambda x: float(x["WPM"]), reverse=True)[:5]

        with open(SCORES_FILE, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=["Time", "WPM", "Accuracy"])
            writer.writeheader()
            writer.writerows(scores)


class HistoryFrame(tk.Frame):
    def __init__(self, master):
        super().__init__(master, bg="#121212")

        tk.Label(self, text="📊 Top 5 Scores", font=("Helvetica", 24, "bold"),
                 bg="#121212", fg="white").pack(pady=10)

        if os.path.exists(SCORES_FILE):
            times, wpms, accuracies = [], [], []
            with open(SCORES_FILE, "r") as f:
                reader = csv.DictReader(f)
                rows = list(reader)
                for i, row in enumerate(rows):
                    times.append(i + 1)
                    wpms.append(float(row["WPM"]))
                    accuracies.append(float(row["Accuracy"]))

            # --- Graph with visible axes ---
            # --- Graph with visible axes ---
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

            fig.tight_layout(pad=2, rect=[0, 0.05, 1, 1])  # 🔧 avoids xlabel clipping

            graph_frame = tk.Frame(self, bg="#121212")
            graph_frame.pack(pady=(10, 5), fill="x")

            canvas = FigureCanvasTkAgg(fig, master=graph_frame)
            canvas.draw()
            canvas.get_tk_widget().pack()

            # --- Pretty Table ---
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

            tree.column("time", anchor="center", width=150)
            tree.column("wpm", anchor="center", width=150)
            tree.column("accuracy", anchor="center", width=150)

            for row in rows:
                tree.insert("", "end", values=(row["Time"], row["WPM"], row["Accuracy"]))
        else:
            tk.Label(self, text="No history yet.", font=("Helvetica", 16),
                     bg="#121212", fg="white").pack(pady=20)

        # Bottom nav button (always visible)
        bottom_frame = tk.Frame(self, bg="#121212")
        bottom_frame.pack(side="bottom", pady=15, fill="x")
        ttk.Button(bottom_frame, text="⬅ Back to Menu",
                   command=lambda: master.show_main_menu()).pack()


if __name__ == "__main__":
    app = TypingApp()
    app.mainloop()
