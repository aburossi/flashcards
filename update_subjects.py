import os
import json

def update_subjects():
    flashcards_dir = 'flashcards'
    subjects_file = 'subjects.json'

    try:
        # List all files in the flashcards directory
        files = os.listdir(flashcards_dir)

        # Filter out only .json files
        json_files = [f for f in files if f.endswith('.json') and f != 'subjects.json']

        # Extract subject names by removing the .json extension
        subjects = [os.path.splitext(f)[0] for f in json_files]

        # Sort subjects alphabetically
        subjects.sort()

        # Write to subjects.json
        with open(subjects_file, 'w') as sf:
            json.dump(subjects, sf, indent=2)
        
        print(f"Updated {subjects_file} with subjects: {subjects}")

    except Exception as e:
        print(f"Error updating subjects.json: {e}")
        exit(1)

if __name__ == "__main__":
    update_subjects()
