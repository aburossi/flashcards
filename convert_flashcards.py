import os
import json
import tkinter as tk
from tkinter import filedialog, messagebox, scrolledtext
import sys
import subprocess

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
                flashcards = parse_flashcards(content)
                if flashcards:
                    subject = subject_name if subject_name else os.path.splitext(filename)[0]
                    save_flashcards(subject, flashcards)
                else:
                    print(f"No valid flashcards found in {filename}.")

def save_flashcards(subject, flashcards):
    """
    Saves flashcards to a JSON file in the flashcards folder.
    """
    flashcards_dir = 'flashcards'
    if not os.path.exists(flashcards_dir):
        os.makedirs(flashcards_dir)
    
    # Sanitize subject name to create a valid filename
    subject_filename = ''.join(c for c in subject if c.isalnum() or c in (' ', '_', '-')).rstrip()
    json_filename = f"{subject_filename.lower().replace(' ', '_')}.json"
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
        subject_name = simpledialog.askstring("Subject Name", "Enter the subject name (optional):")
        process_files(folder_selected, subject_name)
        run_update_subjects()
        messagebox.showinfo("Success", "Flashcards have been successfully converted and saved.")

def paste_flashcards():
    content = paste_text_area.get("1.0", tk.END)
    if content.strip():
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
    root = tk.Tk()
    root.title("Flashcards Converter")
    root.geometry("600x500")
    
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
    
    paste_text_area = scrolledtext.ScrolledText(tab2, wrap=tk.WORD, width=70, height=20)
    paste_text_area.pack(padx=10, pady=10)
    
    subject_label = ttk.Label(tab2, text="Subject Name:")
    subject_label.pack(pady=(10, 0))
    
    subject_entry = ttk.Entry(tab2, width=50)
    subject_entry.pack(pady=5)
    
    paste_convert_button = ttk.Button(tab2, text="Convert Pasted Flashcards", command=paste_flashcards)
    paste_convert_button.pack(pady=10)
    
    # Make paste_text_area and subject_entry accessible globally
    global paste_text_area_widget, subject_entry_widget
    paste_text_area_widget = paste_text_area
    subject_entry_widget = subject_entry
    
    root.mainloop()

# Import necessary modules for GUI
from tkinter import ttk, simpledialog

if __name__ == "__main__":
    # Assign the global widgets
    paste_text_area = None
    subject_entry = None
    # Create the GUI
    create_gui()
