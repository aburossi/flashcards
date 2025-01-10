document.addEventListener('DOMContentLoaded', () => {
    const subjectSelect = document.getElementById('subject');
    const startButton = document.getElementById('start');
    const flashcardContainer = document.getElementById('flashcard-container');
    const flashcard = document.getElementById('flashcard');
    const front = document.getElementById('front');
    const back = document.getElementById('back');
    const prevButton = document.getElementById('prev');
    const flipButton = document.getElementById('flip');
    const nextButton = document.getElementById('next');
    
    let flashcards = [];
    let currentIndex = 0;
    
    startButton.addEventListener('click', () => {
      const subject = subjectSelect.value;
      if (!subject) {
        alert('Please select a subject.');
        return;
      }
      
      fetch(`flashcards/${subject}.json`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Flashcards not found.');
          }
          return response.json();
        })
        .then(data => {
          flashcards = data;
          if (flashcards.length === 0) {
            alert('No flashcards available for this subject.');
            return;
          }
          currentIndex = 0;
          displayFlashcard();
          flashcardContainer.style.display = 'block';
        })
        .catch(error => {
          console.error(error);
          alert('Failed to load flashcards.');
        });
    });
    
    function displayFlashcard() {
      const card = flashcards[currentIndex];
      front.textContent = card.question;
      back.textContent = card.answer;
      flashcard.classList.remove('flipped');
    }
    
    flipButton.addEventListener('click', () => {
      flashcard.classList.toggle('flipped');
    });
    
    nextButton.addEventListener('click', () => {
      if (currentIndex < flashcards.length - 1) {
        currentIndex++;
        displayFlashcard();
      } else {
        alert('This is the last flashcard.');
      }
    });
    
    prevButton.addEventListener('click', () => {
      if (currentIndex > 0) {
        currentIndex--;
        displayFlashcard();
      } else {
        alert('This is the first flashcard.');
      }
    });
    
    // Optional: Allow flipping the card by clicking on it
    flashcard.addEventListener('click', () => {
      flashcard.classList.toggle('flipped');
    });
  });
  