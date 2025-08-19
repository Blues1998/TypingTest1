import tkinter as tk
import time
import random

# Sample sentences
sentences = [
    "The quick brown fox jumps over the lazy dog.",
    "Typing fast is a skill that improves with practice.",
    "Python is fun and powerful for building applications.",
    "Discipline beats motivation when it comes to progress.",
]


class TypingTest:
    def __init__(self, root):
        self.root = root
        self.root.title("Typing Test")

        self.text_to_type = random.choice(sentences)
        self.start_time = None

        # Display sentence
        self.label = tk.Label(root, text=self.text_to_type, font=("Helvetica", 16), wraplength=600, justify="center")
        self.label.pack(pady=20)

        # Entry widget for typing
        self.entry = tk.Entry(root, font=("Helvetica", 14), width=80)
        self.entry.pack(pady=10)
        self.entry.bind("<FocusIn>", self.start_timer)
        self.entry.bind("<Return>", self.calculate_results)

        # Results area
        self.result_label = tk.Label(root, text="", font=("Helvetica", 14))
        self.result_label.pack(pady=20)

    def start_timer(self, event):
        if self.start_time is None:  # Start timer only on first focus
            self.start_time = time.time()

    def calculate_results(self, event):
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
            text=f"Time: {elapsed_time:.2f}s\nWPM: {wpm:.2f}\nAccuracy: {accuracy:.2f}%"
        )

        # Disable further typing
        self.entry.config(state="disabled")


# Run the app
if __name__ == "__main__":
    root = tk.Tk()
    TypingTest(root)
    root.mainloop()
