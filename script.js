document.addEventListener('DOMContentLoaded', () => {
    // ===== Global Variables =====
    let flashcards = [];
    let currentIndex = 0;
    let currentSubject = "";
    let isAnimating = false;
  
    // Variables for Test Mode
    let moveCount = 0;
    let firstCard = null;
    let secondCard = null;
    let lockBoard = false;
  
    // ===== DOM Elements =====
    const pageTitle = document.getElementById('page-title');
  
    // Learn Mode elements (may be absent on test.html)
    const flashcardContainer = document.getElementById('flashcard-container');
    const flashcard = document.getElementById('flashcard');
    const front = document.getElementById('front');
    const back = document.getElementById('back');
    const prevButton = document.getElementById('prev');
    const flipButton = document.getElementById('flip');
    const nextButton = document.getElementById('next');
  
    // Test Mode elements (may be absent on learn.html)
    const testContainer = document.getElementById('test-container');
    const testQuestions = document.getElementById('test-questions');
    const testAnswers = document.getElementById('test-answers');
    const resetTestButton = document.getElementById('reset-test');
  
    // ===== Utility Functions =====
  
    // Fetch flashcards JSON for a given subject
    async function fetchFlashcards(subject) {
      const url = `./flashcards/${subject}.json`;
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        flashcards = data;
        if (flashcards.length === 0) {
          alert('No flashcards available for this subject.');
          return false;
        }
        currentIndex = 0;
        return true;
      } catch (error) {
        console.error('Error fetching flashcards:', error);
        alert(`Failed to load flashcards for subject "${subject}".`);
        return false;
      }
    }
  
    // Adjust the flashcard container's height based on content
    function adjustFlashcardHeight() {
      if (!flashcardContainer) return;
      flashcardContainer.style.height = 'auto';
      const isFlipped = flashcard.classList.contains('flipped');
      const visibleSide = isFlipped ? back : front;
      const newHeight = visibleSide.scrollHeight + 40; // add padding
      flashcardContainer.style.height = `${newHeight}px`;
    }
  
    // Display the current flashcard (Learn Mode)
    function displayFlashcard() {
      if (flashcards.length === 0) return;
      const card = flashcards[currentIndex];
      front.innerHTML = card.question;
      back.innerHTML = card.answer.replace(/\n/g, '<br>');
      flashcard.classList.remove('flipped');
      adjustFlashcardHeight();
    }
  
    // Animate flashcard transition (for next/prev)
    function displayFlashcardWithAnimation(direction) {
      if (isAnimating) return;
      isAnimating = true;
      if (direction === 'next') {
        flashcard.classList.add('slide-out-left');
      } else if (direction === 'prev') {
        flashcard.classList.add('slide-out-right');
      }
      flashcard.addEventListener('animationend', function handleAnimationEnd() {
        flashcard.removeEventListener('animationend', handleAnimationEnd);
        flashcard.classList.remove(direction === 'next' ? 'slide-out-left' : 'slide-out-right');
  
        // Update index
        if (direction === 'next') {
          currentIndex++;
        } else if (direction === 'prev') {
          currentIndex--;
        }
        const card = flashcards[currentIndex];
        front.innerHTML = card.question;
        back.innerHTML = card.answer.replace(/\n/g, '<br>');
        flashcard.classList.remove('flipped');
  
        // Add slide-in animation
        if (direction === 'next') {
          flashcard.classList.add('slide-in-right');
        } else if (direction === 'prev') {
          flashcard.classList.add('slide-in-left');
        }
        flashcard.addEventListener('animationend', function removeAnimation() {
          flashcard.classList.remove(direction === 'next' ? 'slide-in-right' : 'slide-in-left');
          isAnimating = false;
          adjustFlashcardHeight();
        }, { once: true });
      });
    }
  
    // Shuffle an array (used in test mode)
    function shuffle(array) {
      let currentIndex = array.length, temporaryValue, randomIndex;
      while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
      }
      return array;
    }
  
    // ===== Test Mode Functions =====
  
    // Reset test state and clear test columns
    function resetTestState() {
      moveCount = 0;
      firstCard = null;
      secondCard = null;
      lockBoard = false;
      if (testQuestions) {
        testQuestions.innerHTML = '<h2>Questions</h2><p>Select an answer to match with the corresponding question.</p>';
      }
      if (testAnswers) {
        testAnswers.innerHTML = '<h2>Answers</h2><p>Select a question to match with the selected answer.</p>';
      }
    }
  
    // Create a test card element from a card object
    function createTestCard(card) {
      const cardElement = document.createElement('div');
      cardElement.classList.add('test-card');
      cardElement.dataset.id = card.id;
      if (card.matchId) {
        cardElement.dataset.matchId = card.matchId;
      }
      cardElement.dataset.type = card.type;
      cardElement.innerHTML = card.content;
      return cardElement;
    }
  
    // Generate test columns for questions and answers
    function generateTestColumns(shuffledQuestions, shuffledAnswers) {
      if (testQuestions) {
        testQuestions.innerHTML = '<h2>Questions</h2><p>Select an answer to match with the corresponding question.</p>';
        shuffledQuestions.forEach(card => {
          const cardElement = createTestCard(card);
          testQuestions.appendChild(cardElement);
        });
      }
      if (testAnswers) {
        testAnswers.innerHTML = '<h2>Answers</h2><p>Select a question to match with the selected answer.</p>';
        shuffledAnswers.forEach(card => {
          const cardElement = createTestCard(card);
          testAnswers.appendChild(cardElement);
        });
      }
    }
  
    // Check if the test is completed (all matching pairs removed)
    function checkTestCompletion() {
      if (!testContainer) return;
      const remainingCards = testContainer.querySelectorAll('.test-card:not(.correct)');
      if (remainingCards.length === 0) {
        const idealMoves = 6; // for matching pairs
        const efficiency = (idealMoves / moveCount) * 100;
        alert(`Congratulations! You have matched all the cards.\nTotal Moves: ${moveCount}\nEfficiency: ${efficiency.toFixed(2)}%`);
      }
    }
  
    // Handle clicks on test cards
    function handleTestCardClick(e) {
      const clickedCard = e.target.closest('.test-card');
      if (!clickedCard || lockBoard || clickedCard.classList.contains('correct') || clickedCard.classList.contains('no-match')) return;
  
      // If the same card is clicked again, deselect it.
      if (clickedCard.classList.contains('selected')) {
        clickedCard.classList.remove('selected');
        if (clickedCard.dataset.type === 'question') {
          firstCard = null;
        } else if (clickedCard.dataset.type === 'answer') {
          secondCard = null;
        }
        return;
      }
      clickedCard.classList.add('selected');
      if (clickedCard.dataset.type === 'question') {
        if (firstCard) {
          alert('You have already selected a question. Please select an answer.');
          clickedCard.classList.remove('selected');
          return;
        }
        firstCard = clickedCard;
      } else if (clickedCard.dataset.type === 'answer') {
        if (secondCard) {
          alert('You have already selected an answer. Please select a question.');
          clickedCard.classList.remove('selected');
          return;
        }
        secondCard = clickedCard;
      }
      // If both a question and an answer are selected, check for a match.
      if (firstCard && secondCard) {
        moveCount++;
        lockBoard = true;
        const isMatch = firstCard.dataset.id === secondCard.dataset.matchId ||
                        secondCard.dataset.id === firstCard.dataset.matchId;
        if (isMatch) {
          firstCard.classList.add('correct');
          secondCard.classList.add('correct');
          setTimeout(() => {
            firstCard.remove();
            secondCard.remove();
            firstCard = null;
            secondCard = null;
            lockBoard = false;
            checkTestCompletion();
          }, 500);
        } else {
          firstCard.classList.add('incorrect');
          secondCard.classList.add('incorrect');
          setTimeout(() => {
            firstCard.classList.remove('incorrect', 'selected');
            secondCard.classList.remove('incorrect', 'selected');
            firstCard = null;
            secondCard = null;
            lockBoard = false;
          }, 500);
        }
      }
    }
  
    // Initialize test mode by hiding learn elements, showing test UI, and building test cards.
    function initializeTestMode() {
      resetTestState();
      if (flashcardContainer) flashcardContainer.style.display = 'none';
      if (prevButton) prevButton.style.display = 'none';
      if (flipButton) flipButton.style.display = 'none';
      if (nextButton) nextButton.style.display = 'none';
      if (testContainer) testContainer.style.display = 'block';
      document.querySelector('.container').classList.add('test-mode');
  
      // Prepare test cards from flashcards.
      const matchingPairs = 6;
      const additionalFronts = 4;
      const shuffledFlashcards = shuffle([...flashcards]);
      const selectedMatchingFlashcards = shuffledFlashcards.slice(0, matchingPairs);
      const selectedAdditionalFlashcards = shuffledFlashcards.slice(matchingPairs, matchingPairs + additionalFronts);
      let questions = [];
      let answers = [];
  
      selectedMatchingFlashcards.forEach((card, index) => {
        questions.push({
          id: `front-${index}`,
          content: card.question,
          type: 'question'
        });
        answers.push({
          id: `back-${index}`,
          content: card.answer.replace(/\n/g, '<br>'),
          type: 'answer',
          matchId: `front-${index}`
        });
      });
  
      selectedAdditionalFlashcards.forEach((card, index) => {
        questions.push({
          id: `front-extra-${index}`,
          content: card.question,
          type: 'question'
        });
      });
  
      const shuffledQuestions = shuffle(questions);
      const shuffledAnswers = shuffle(answers);
      generateTestColumns(shuffledQuestions, shuffledAnswers);
    }
  
    // Reset test mode completely.
    function resetTest() {
      resetTestState();
      initializeTestMode();
    }
  
    // ===== Event Listeners =====
  
    // Learn Mode controls
    if (flipButton) {
      flipButton.addEventListener('click', () => {
        if (isAnimating) return;
        flashcard.classList.toggle('flipped');
        adjustFlashcardHeight();
      });
    }
    if (nextButton) {
      nextButton.addEventListener('click', () => {
        if (isAnimating) return;
        if (currentIndex < flashcards.length - 1) {
          displayFlashcardWithAnimation('next');
        } else {
          alert('This is the last flashcard.');
        }
      });
    }
    if (prevButton) {
      prevButton.addEventListener('click', () => {
        if (isAnimating) return;
        if (currentIndex > 0) {
          displayFlashcardWithAnimation('prev');
        } else {
          alert('This is the first flashcard.');
        }
      });
    }
    // Keyboard navigation for Learn Mode
    document.addEventListener('keydown', (event) => {
      if (isAnimating) return;
      if (window.appMode === 'learn') {
        switch(event.key) {
          case 'ArrowLeft':
            prevButton && prevButton.click();
            break;
          case 'ArrowRight':
            nextButton && nextButton.click();
            break;
          case 'ArrowUp':
          case 'ArrowDown':
            flipButton && flipButton.click();
            break;
          default:
            break;
        }
      }
    });
  
    // Test Mode: attach click handler if testContainer exists
    if (testContainer) {
      testContainer.addEventListener('click', handleTestCardClick);
    }
    // Test Mode: attach reset button handler
    if (resetTestButton) {
      resetTestButton.addEventListener('click', resetTest);
    }
  
    // ===== Initialization =====
  
    // Function to initialize the app with a given subject
    function initApp(subject) {
      currentSubject = subject;
      if (window.appMode === 'learn') {
        pageTitle.textContent = `Lernkarteien: ${subject}`;
      } else if (window.appMode === 'test') {
        pageTitle.textContent = `Zuordnen: ${subject}`;
      } else {
        pageTitle.textContent = subject;
      }
      fetchFlashcards(currentSubject).then(success => {
        if (!success) return;
        if (window.appMode === 'learn') {
          if (flashcardContainer) flashcardContainer.style.display = 'block';
          if (document.getElementById('controls')) {
            document.getElementById('controls').style.display = 'flex';
          }
          if (testContainer) testContainer.style.display = 'none';
          displayFlashcard();
        } else if (window.appMode === 'test') {
          if (flashcardContainer) flashcardContainer.style.display = 'none';
          if (document.getElementById('controls')) {
            document.getElementById('controls').style.display = 'none';
          }
          initializeTestMode();
        }
      });
    }
  
    // Get assignmentId from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    let assignmentId = urlParams.get('assignmentId');
  
    if (assignmentId) {
      initApp(assignmentId);
    } else {
      // For learn mode, if no assignmentId is provided, use the first subject from subjects.json as a default.
      fetch('./subjects.json')
        .then(response => response.json())
        .then(subjects => {
          if (subjects && subjects.length > 0) {
            initApp(subjects[0]);
          } else {
            alert('No subjects available.');
          }
        })
        .catch(err => {
          console.error('Error loading subjects.json:', err);
          alert('Error loading subjects.');
        });
    }
  });
  