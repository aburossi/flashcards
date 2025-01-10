document.addEventListener('DOMContentLoaded', () => {
    // === DOM Elements ===
    const subjectSelect = document.getElementById('subject');
    const startButton = document.getElementById('start');
    const flashcardContainer = document.getElementById('flashcard-container');
    const flashcard = document.getElementById('flashcard');
    const front = document.getElementById('front');
    const back = document.getElementById('back');
    const prevButton = document.getElementById('prev');
    const flipButton = document.getElementById('flip');
    const nextButton = document.getElementById('next');
    const subjectSelector = document.getElementById('subject-selector');
    const pageTitle = document.getElementById('page-title');
  
    let flashcards = [];
    let currentIndex = 0;
    let isFlipped = false; // Track the current state of the flashcard
    let isAnimating = false; // Prevent multiple animations at the same time
  
    /**
     * Utility function to get URL parameters
     * @returns {Object} Key-value pairs of URL parameters
     */
    function getUrlParams() {
      const params = {};
      const queryString = window.location.search.substring(1);
      const pairs = queryString.split('&');
      pairs.forEach(pair => {
        const [key, value] = pair.split('=');
        if (key) {
          params[decodeURIComponent(key)] = decodeURIComponent(value || '');
        }
      });
      return params;
    }
  
    /**
     * Capitalizes the first letter of a string
     * @param {string} string 
     * @returns {string}
     */
    function capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }
  
    /**
     * Fetch and populate subjects in the dropdown
     */
    async function loadSubjects() {
      try {
        const response = await fetch('./subjects.json'); // Ensure relative path
        if (!response.ok) {
          throw new Error(`Failed to load subjects.json: ${response.status}`);
        }
        const subjects = await response.json();
        populateDropdown(subjects);
      } catch (error) {
        console.error('Error loading subjects:', error);
        alert('Failed to load subjects.');
      }
    }
  
    /**
     * Populate the subject dropdown with fetched subjects
     * @param {Array} subjects - Array of subject names
     */
    function populateDropdown(subjects) {
      subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = capitalizeFirstLetter(subject);
        subjectSelect.appendChild(option);
      });
    }
  
    /**
     * Fetch and display flashcards for a given subject
     * @param {string} subject 
     */
    async function loadFlashcards(subject) {
        const flashcardUrl = `./flashcards/${subject}.json`; // Ensure relative path
      
        try {
          const response = await fetch(flashcardUrl);
          if (!response.ok) {
            throw new Error(`Failed to load flashcards for subject: ${subject}. Status: ${response.status}`);
          }
      
          const data = await response.json();
          flashcards = data;
          if (flashcards.length === 0) {
            alert('No flashcards available for this subject.');
            return;
          }
          currentIndex = 0;
          displayFlashcard();
          flashcardContainer.style.display = 'block';
        } catch (error) {
          console.error('Error details:', error);
          alert(`Failed to load flashcards for subject "${subject}". Please check the console for more details.`);
        }
      }
      
  
/**
 * Display the current flashcard
 */
function displayFlashcard(direction = null) {
    const card = flashcards[currentIndex];
    front.innerHTML = card.question; // Use innerHTML in case there are HTML entities
    back.innerHTML = card.answer.replace(/\n/g, '<br>'); // Replace line breaks with <br>
    flashcard.classList.remove('flipped'); // Ensure card is showing front
    isFlipped = false; // Reset flip state

    // Reset animation classes
    flashcard.classList.remove('slide-in-left', 'slide-out-left', 'slide-in-right', 'slide-out-right');

    if (direction === 'left') {
      flashcard.classList.add('slide-in-left');
    } else if (direction === 'right') {
      flashcard.classList.add('slide-in-right');
    }

    // After content is updated, allow the browser to recalculate the height
    setTimeout(() => {
      adjustFlashcardHeight();
    }, 100);
  }
  
  /**
   * Adjust the flashcard container height based on the current card's content
   */
  function adjustFlashcardHeight() {
    // Get the heights of front and back
    const frontHeight = front.offsetHeight;
    const backHeight = back.offsetHeight;
  
    // Set the container's height to the taller of the two
    const newHeight = Math.max(frontHeight, backHeight);
  
    // Apply the new height to the flashcard container
    flashcard.style.height = `${newHeight}px`;
  }
  
  /**
   * Navigate to the next flashcard with sliding animation
   */
  function goToNextCard() {
    if (isAnimating) return;
    if (currentIndex < flashcards.length - 1) {
      isAnimating = true;
      const previousIndex = currentIndex;
      currentIndex++;
      displayFlashcard('right');
      // Add slide-out-left to previous card
      flashcard.classList.add('slide-out-left');
      flashcard.addEventListener('animationend', onAnimationEnd);
    } else {
      alert('This is the last flashcard.');
    }
  }

  /**
   * Navigate to the previous flashcard with sliding animation
   */
  function goToPrevCard() {
    if (isAnimating) return;
    if (currentIndex > 0) {
      isAnimating = true;
      const previousIndex = currentIndex;
      currentIndex--;
      displayFlashcard('left');
      // Add slide-out-right to previous card
      flashcard.classList.add('slide-out-right');
      flashcard.addEventListener('animationend', onAnimationEnd);
    } else {
      alert('This is the first flashcard.');
    }
  }

  /**
   * Handle the end of the sliding animation
   */
  function onAnimationEnd() {
    flashcard.classList.remove('slide-out-left', 'slide-out-right', 'slide-in-left', 'slide-in-right');
    flashcard.removeEventListener('animationend', onAnimationEnd);
    isAnimating = false;
  }

  /**
   * Flip the flashcard with vertical animation
   */
  function flipFlashcard() {
    if (isAnimating) return;
    isFlipped = !isFlipped;
    flashcard.classList.toggle('flipped');
  }

  /**
   * Initialize the app based on URL parameters
   */
  async function initializeApp() {
    const params = getUrlParams();
    const assignmentId = params['assignmentId'];

    if (assignmentId) {
      // Attempt to load flashcards for the given assignmentId
      await loadFlashcards(assignmentId);
      // Update the page title
      pageTitle.textContent = `Flashcards ${capitalizeFirstLetter(assignmentId)}`;
      // Hide the subject selector
      subjectSelector.style.display = 'none';
    } else {
      // No assignmentId, load subjects for selection
      await loadSubjects();
      // Show the subject selector
      subjectSelector.style.display = 'block';
    }
  }

  // Event listener for the Start button
  startButton.addEventListener('click', () => {
    const subject = subjectSelect.value;
    if (!subject) {
      alert('Please select a subject.');
      return;
    }

    loadFlashcards(subject);
  });

  // Event listener for the Flip button
  flipButton.addEventListener('click', () => {
    flipFlashcard();
  });

  // Event listener for the Next button
  nextButton.addEventListener('click', () => {
    goToNextCard();
  });

  // Event listener for the Previous button
  prevButton.addEventListener('click', () => {
    goToPrevCard();
  });

  // Allow flipping the card by clicking on it
  flashcard.addEventListener('click', () => {
    flipFlashcard();
  });

  // Keyboard Navigation
  document.addEventListener('keydown', (event) => {
    switch(event.key) {
      case 'ArrowUp':
      case 'ArrowDown':
        flipFlashcard();
        break;
      case 'ArrowRight':
        goToNextCard();
        break;
      case 'ArrowLeft':
        goToPrevCard();
        break;
      default:
        break;
    }
  });

  // Initialize the application
  initializeApp();
});
