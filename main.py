import tkinter as tk
from tkinter import simpledialog, ttk
import time
import random
import csv
import os

SENTENCE_FILE = "sentences.txt"
LONG_TEXT_FILE = "long_texts.txt"
SCORES_FILE = "scores.csv"


class TypingApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Typing Test")
        self.geometry("900x600")

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
        self.current_frame.pack(fill="both", expand=True)

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
        super().__init__(master)

        high_score = master.get_high_score()

        tk.Label(self, text="Typing Test", font=("Helvetica", 28, "bold")).pack(pady=20)
        tk.Label(self, text=f"🏆 High Score: {high_score:.2f} WPM", font=("Helvetica", 16)).pack(pady=10)

        tk.Label(self, text="Choose Mode:", font=("Helvetica", 16, "bold")).pack(pady=10)

        tk.Button(self, text="Stopwatch Mode", font=("Helvetica", 14),
                  command=lambda: master.switch_frame(TypingFrame, mode="stopwatch")).pack(pady=5)

        tk.Button(self, text="Countdown Mode (60s)", font=("Helvetica", 14),
                  command=lambda: master.switch_frame(TypingFrame, mode="countdown")).pack(pady=5)

        tk.Label(self, text="Choose Text:", font=("Helvetica", 16, "bold")).pack(pady=15)

        # Dropdown for text selection
        self.selected_text = tk.StringVar(value="Random")
        texts = ["Random"] + master.sentences
        dropdown = ttk.Combobox(self, textvariable=self.selected_text, values=texts, width=80)
        dropdown.pack(pady=5)

        tk.Button(self, text="Start with Selected Text", font=("Helvetica", 14),
                  command=self.start_with_selected).pack(pady=10)

        # Add custom text
        tk.Button(self, text="+ Add Custom Text", font=("Helvetica", 14),
                  command=self.add_custom_text).pack(pady=10)

        # View history
        tk.Button(self, text="View History", font=("Helvetica", 14),
                  command=lambda: master.switch_frame(HistoryFrame)).pack(pady=20)

    def start_with_selected(self):
        text = self.selected_text.get()
        if text == "Random":
            self.master.switch_frame(TypingFrame, mode="stopwatch")
        else:
            self.master.switch_frame(TypingFrame, mode="stopwatch", text=text)

    def add_custom_text(self):
        custom_text = simpledialog.askstring("Add Custom Text", "Enter your custom passage:")
        if custom_text:
            with open(SENTENCE_FILE, "a") as f:
                f.write(custom_text.strip() + "\n")
            self.master.sentences.append(custom_text.strip())


class TypingFrame(tk.Frame):
    def __init__(self, master, mode="stopwatch", text=None):
        super().__init__(master)
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

        # Sentence display
        self.text_display = tk.Text(self, font=("Helvetica", 16), wrap="word", height=6, width=90)
        self.text_display.pack(pady=20)
        self.text_display.insert("1.0", self.text_to_type)
        self.text_display.config(state="disabled")

        # Typing entry
        self.entry = tk.Entry(self, font=("Helvetica", 14), width=90)
        self.entry.pack(pady=10)
        self.entry.bind("<KeyRelease>", self.check_typing)
        self.entry.bind("<Return>", self.calculate_results)

        # Timer
        self.timer_label = tk.Label(self, text="Time: 0.00s", font=("Helvetica", 14))
        self.timer_label.pack(pady=10)

        # Results
        self.result_label = tk.Label(self, text="", font=("Helvetica", 14))
        self.result_label.pack(pady=15)

        # Back button
        tk.Button(self, text="⬅ Back to Menu", font=("Helvetica", 14),
                  command=lambda: master.show_main_menu()).pack(side="left", padx=20, pady=10)

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
        if self.start_time is None and self.entry.get():
            self.start_timer()

        typed_text = self.entry.get()
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
        self.text_display.tag_config("correct", foreground="green")
        self.text_display.tag_config("wrong", foreground="red")
        self.text_display.config(state="disabled")

    def calculate_results(self, event):
        if not self.running:
            return
        self.running = False

        elapsed = time.time() - self.start_time if self.start_time else 0
        typed_text = self.entry.get()

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
        new_entry = [f"{time_taken:.2f}", f"{wpm:.2f}", f"{accuracy:.2f}%"]
        file_exists = os.path.exists(SCORES_FILE)
        with open(SCORES_FILE, "a", newline="") as f:
            writer = csv.writer(f)
            if not file_exists:
                writer.writerow(["Time Taken (s)", "WPM", "Accuracy"])
            writer.writerow(new_entry)


class HistoryFrame(tk.Frame):
    def __init__(self, master):
        super().__init__(master)

        tk.Label(self, text="Score History", font=("Helvetica", 20, "bold")).pack(pady=10)

        text_widget = tk.Text(self, font=("Helvetica", 12), width=80, height=20)
        text_widget.pack(padx=10, pady=10)

        if os.path.exists(SCORES_FILE):
            with open(SCORES_FILE, "r") as f:
                for line in f:
                    text_widget.insert("end", line)
        else:
            text_widget.insert("end", "No history yet.")

        text_widget.config(state="disabled")

        tk.Button(self, text="⬅ Back to Menu", font=("Helvetica", 14),
                  command=lambda: master.show_main_menu()).pack(pady=10)


if __name__ == "__main__":
    app = TypingApp()
    app.mainloop()
