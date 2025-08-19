import tkinter as tk
import time
import random
import csv
import os

SENTENCE_FILE = "sentences.txt"
SCORES_FILE = "scores.csv"


class TypingTest:
    def __init__(self, root):
        self.root = root
        self.root.title("Typing Test")
        self.root.geometry("700x450")

        self.sentences = self.load_sentences()
        self.text_to_type = random.choice(self.sentences)
        self.start_time = None
        self.running = False

        # Sentence display (Text widget so we can color)
        self.text_display = tk.Text(root, font=("Helvetica", 16), wrap="word", height=4, width=60)
        self.text_display.pack(pady=20)
        self.text_display.insert("1.0", self.text_to_type)
        self.text_display.config(state="disabled")

        # Typing box
        self.entry = tk.Entry(root, font=("Helvetica", 14), width=80)
        self.entry.pack(pady=10)
        self.entry.bind("<KeyRelease>", self.check_typing)
        self.entry.bind("<Return>", self.calculate_results)

        # Clock display
        self.timer_label = tk.Label(root, text="Time: 0.00s", font=("Helvetica", 14))
        self.timer_label.pack(pady=10)

        # Result label
        self.result_label = tk.Label(root, text="", font=("Helvetica", 14))
        self.result_label.pack(pady=20)

        # Buttons
        self.restart_button = tk.Button(root, text="Restart", command=self.restart, state="disabled")
        self.restart_button.pack(side="left", padx=20, pady=10)

        self.history_button = tk.Button(root, text="View History", command=self.show_history)
        self.history_button.pack(side="right", padx=20, pady=10)

    def load_sentences(self):
        if not os.path.exists(SENTENCE_FILE):
            return [
                "The quick brown fox jumps over the lazy dog.",
                "Python is fun and powerful for building applications.",
                "Typing fast is a skill that improves with practice."
            ]
        with open(SENTENCE_FILE, "r") as f:
            return [line.strip() for line in f if line.strip()]

    def start_timer(self):
        if not self.running:  # Start only once
            self.start_time = time.time()
            self.running = True
            self.update_timer()

    def update_timer(self):
        if self.running:
            elapsed_time = time.time() - self.start_time
            self.timer_label.config(text=f"Time: {elapsed_time:.2f}s")
            self.root.after(100, self.update_timer)  # update every 100ms

    def check_typing(self, event):
        if self.start_time is None and self.entry.get():
            self.start_timer()

        typed_text = self.entry.get()
        self.text_display.config(state="normal")
        self.text_display.delete("1.0", "end")

        # Color code each character
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
            return  # Prevent pressing Enter before typing

        self.running = False
        end_time = time.time()
        elapsed_time = end_time - self.start_time
        typed_text = self.entry.get()

        # Accuracy
        correct_chars = sum(1 for a, b in zip(typed_text, self.text_to_type) if a == b)
        accuracy = (correct_chars / len(self.text_to_type)) * 100

        # Words per minute
        words = len(typed_text) / 5
        minutes = elapsed_time / 60
        wpm = words / minutes if minutes > 0 else 0

        self.result_label.config(
            text=f"Final Time: {elapsed_time:.2f}s\nWPM: {wpm:.2f}\nAccuracy: {accuracy:.2f}%"
        )

        # Save score
        self.save_score(elapsed_time, wpm, accuracy)

        # Disable typing
        self.entry.config(state="disabled")
        self.restart_button.config(state="normal")

    def save_score(self, time_taken, wpm, accuracy):
        new_entry = [f"{time_taken:.2f}", f"{wpm:.2f}", f"{accuracy:.2f}%"]
        file_exists = os.path.exists(SCORES_FILE)
        with open(SCORES_FILE, "a", newline="") as f:
            writer = csv.writer(f)
            if not file_exists:
                writer.writerow(["Time Taken (s)", "WPM", "Accuracy"])
            writer.writerow(new_entry)

    def show_history(self):
        if not os.path.exists(SCORES_FILE):
            return

        history_win = tk.Toplevel(self.root)
        history_win.title("Score History")

        text_widget = tk.Text(history_win, font=("Helvetica", 12), width=50, height=15)
        text_widget.pack(padx=10, pady=10)

        with open(SCORES_FILE, "r") as f:
            for line in f:
                text_widget.insert("end", line)
        text_widget.config(state="disabled")

    def restart(self):
        self.text_to_type = random.choice(self.sentences)
        self.text_display.config(state="normal")
        self.text_display.delete("1.0", "end")
        self.text_display.insert("1.0", self.text_to_type)
        self.text_display.config(state="disabled")

        self.entry.config(state="normal")
        self.entry.delete(0, "end")

        self.result_label.config(text="")
        self.timer_label.config(text="Time: 0.00s")

        self.restart_button.config(state="disabled")
        self.start_time = None
        self.running = False


if __name__ == "__main__":
    root = tk.Tk()
    TypingTest(root)
    root.mainloop()
