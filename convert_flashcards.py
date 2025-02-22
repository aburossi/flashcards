import os
import json
import tkinter as tk
from tkinter import filedialog, messagebox, scrolledtext, simpledialog
import sys
import subprocess
from tkinter import ttk

def clean(text):
    """
    Replace all occurrences of 'ß' with 'ss' in the given text.
    """
    return text.replace('ß', 'ss')

def parse_flashcards(content):
    """
    Parses flashcards from a given string.
    Each flashcard is separated by an empty line.
    The first line is the front, followed by one or more lines of the back.
    """
    flashcards = []
    raw_cards = content.strip().split('\n\n')
    for raw_card in raw_cards:
        lines = raw_card.strip().split('\n')
        if len(lines) >= 2:
            front = lines[0].strip()
            # Preserve emojis and line breaks in the answer
            back = '\n'.join(line.strip() for line in lines[1:])
            flashcards.append({'question': front, 'answer': back})
    return flashcards

def process_files(folder_path, subject_name=None):
    """
    Processes all .txt and .md files in the given folder and converts them to JSON.
    Each file corresponds to a subject.
    """
    supported_extensions = ['.txt', '.md']
    for filename in os.listdir(folder_path):
        file_ext = os.path.splitext(filename)[1].lower()
        if file_ext in supported_extensions:
            file_path = os.path.join(folder_path, filename)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                # Clean the content by replacing 'ß' with 'ss'
                content = clean(content)
                flashcards = parse_flashcards(content)
                if flashcards:
                    subject = subject_name if subject_name else os.path.splitext(filename)[0]
                    save_flashcards(subject, flashcards)
                else:
                    print(f"No valid flashcards found in {filename}.")

def save_flashcards(subject, flashcards):
    """
    Saves flashcards to a JSON file in the 'flashcards' subfolder located in the same directory as this script.
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    flashcards_dir = os.path.join(script_dir, 'flashcards')
    if not os.path.exists(flashcards_dir):
        os.makedirs(flashcards_dir)
    
    # Use the exact subject name for the filename (e.g., "2.1 Lohn" becomes "2.1 Lohn.json")
    json_filename = f"{subject}.json"
    json_path = os.path.join(flashcards_dir, json_filename)
    
    with open(json_path, 'w', encoding='utf-8') as jf:
        json.dump(flashcards, jf, indent=2, ensure_ascii=False)
    
    print(f"Saved {len(flashcards)} flashcards to {json_filename}.")

def run_update_subjects():
    """
    Runs the update_subjects.py script to refresh subjects.json.
    """
    try:
        subprocess.run([sys.executable, 'update_subjects.py'], check=True)
        print("subjects.json has been updated.")
    except subprocess.CalledProcessError as e:
        print(f"Error running update_subjects.py: {e}")
        messagebox.showerror("Error", "Failed to update subjects.json.")

def choose_folder():
    folder_selected = filedialog.askdirectory()
    if folder_selected:
        # Optionally, prompt for a subject name override
        subject_name = simpledialog.askstring("Subject Name", "Enter the subject name (optional):")
        process_files(folder_selected, subject_name)
        run_update_subjects()
        messagebox.showinfo("Success", "Flashcards have been successfully converted and saved.")

def paste_flashcards():
    content = paste_text_area.get("1.0", tk.END)
    if content.strip():
        # Clean the pasted content by replacing 'ß' with 'ss'
        content = clean(content)
        subject_name = subject_entry.get().strip()
        if not subject_name:
            messagebox.showwarning("Input Needed", "Please enter a subject name.")
            return
        flashcards = parse_flashcards(content)
        if flashcards:
            save_flashcards(subject_name, flashcards)
            run_update_subjects()
            messagebox.showinfo("Success", "Flashcards have been successfully converted and saved.")
            paste_text_area.delete("1.0", tk.END)
            subject_entry.delete(0, tk.END)
        else:
            messagebox.showwarning("No Flashcards", "No valid flashcards found in the pasted content.")
    else:
        messagebox.showwarning("Empty Input", "Please paste some flashcards.")

def create_gui():
    global paste_text_area, subject_entry  # Declare as global to be accessible in paste_flashcards
    root = tk.Tk()
    root.title("Flashcards Converter")
    root.geometry("600x400")
    
    # Tabs
    tab_control = ttk.Notebook(root)
    
    # Tab 1: Choose Folder
    tab1 = ttk.Frame(tab_control)
    tab_control.add(tab1, text='Choose Folder')
    
    # Tab 2: Paste Flashcards
    tab2 = ttk.Frame(tab_control)
    tab_control.add(tab2, text='Paste Flashcards')
    
    tab_control.pack(expand=1, fill='both')
    
    # --- Tab 1: Choose Folder ---
    choose_folder_button = ttk.Button(tab1, text="Choose Folder", command=choose_folder)
    choose_folder_button.pack(pady=20)
    
    # --- Tab 2: Paste Flashcards ---
    instruction_label = ttk.Label(tab2, text="Paste your flashcards below:\n\nEach flashcard should be in the following format:\nFront of flashcard\nBack of flashcard (can be multiple lines)\n\nSeparate each flashcard with an empty line.")
    instruction_label.pack(pady=10)
    
    paste_text_area = scrolledtext.ScrolledText(tab2, wrap=tk.WORD, width=60, height=15)
    paste_text_area.pack(padx=10, pady=10)
    
    subject_label = ttk.Label(tab2, text="Subject Name:")
    subject_label.pack(pady=(10, 0))
    
    subject_entry = ttk.Entry(tab2, width=50)
    subject_entry.pack(pady=5)
    
    paste_convert_button = ttk.Button(tab2, text="Convert Pasted Flashcards", command=paste_flashcards)
    paste_convert_button.pack(pady=10)
    
    root.mainloop()

if __name__ == "__main__":
    # Create the GUI
    create_gui()
