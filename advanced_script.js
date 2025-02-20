document.addEventListener('DOMContentLoaded', () => {
    // ===== Global Variables =====
    let flashcards = [];
    let moveCount = 0;
    let firstCard = null;
    let secondCard = null;
    let lockBoard = false;
  
    // ===== DOM Elements =====
    const pageTitle = document.getElementById('page-title');
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
        return true;
      } catch (error) {
        console.error('Error fetching flashcards:', error);
        alert(`Failed to load flashcards for subject "${subject}".`);
        return false;
      }
    }
  
    // Simple array shuffle
    function shuffle(array) {
      let currentIndex = array.length, randomIndex;
      while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
      }
      return array;
    }
  
    // Reset test state and clear test columns
    function resetTestState() {
      moveCount = 0;
      firstCard = null;
      secondCard = null;
      lockBoard = false;
      if (testQuestions) {
        testQuestions.innerHTML =
          '<h2>Questions</h2><p>Select an answer to match with the corresponding question.</p>';
      }
      if (testAnswers) {
        testAnswers.innerHTML =
          '<h2>Answers</h2><p>Select a question to match with the selected answer.</p>';
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
  
    // Generate test columns for advanced test mode
    function generateTestColumns(questionsArray, answersArray) {
      if (testQuestions) {
        testQuestions.innerHTML =
          '<h2>Questions</h2><p>Select an answer to match with the corresponding question.</p>';
        questionsArray.forEach(card => {
          const cardElement = createTestCard(card);
          testQuestions.appendChild(cardElement);
        });
      }
      if (testAnswers) {
        testAnswers.innerHTML =
          '<h2>Answers</h2><p>Select a question to match with the selected answer.</p>';
        answersArray.forEach(card => {
          const cardElement = createTestCard(card);
          testAnswers.appendChild(cardElement);
        });
      }
    }
  
    // Check if the test is complete (all pairs matched)
    function checkTestCompletion() {
      if (!testContainer) return;
      const remainingCards = testContainer.querySelectorAll('.test-card:not(.correct)');
      if (remainingCards.length === 0) {
        // Here the ideal move count is loosely defined; you can adjust as needed.
        const idealMoves = flashcards.length;
        const efficiency = (idealMoves / moveCount) * 100;
        alert(`Congratulations! You have matched all the cards.
  Total Moves: ${moveCount}
  Efficiency: ${efficiency.toFixed(2)}%`);
      }
    }
  
    // Handle clicks on test cards
    function handleTestCardClick(e) {
      const clickedCard = e.target.closest('.test-card');
      if (!clickedCard || lockBoard || clickedCard.classList.contains('correct') || clickedCard.classList.contains('no-match')) return;
  
      // Deselect if the card is already selected
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
      // When both a question and an answer are selected, check for a match
      if (firstCard && secondCard) {
        moveCount++;
        lockBoard = true;
        const isMatch =
          firstCard.dataset.id === secondCard.dataset.matchId ||
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
  
    // Initialize advanced test mode
    function initializeAdvancedTestMode() {
      resetTestState();
      if (testContainer) testContainer.style.display = 'block';
      document.querySelector('.container').classList.add('test-mode');
  
      // Choose a subset of flashcards for matching and extra questions
      const matchingPairs = 6;
      const additionalQuestions = 4;
      let shuffledFlashcards = shuffle([...flashcards]);
      const selectedMatchingFlashcards = shuffledFlashcards.slice(0, matchingPairs);
      const selectedAdditionalFlashcards = shuffledFlashcards.slice(matchingPairs, matchingPairs + additionalQuestions);
  
      let questions = [];
      let answers = [];
  
      // For each matching flashcard, select one random line from the answer.
      selectedMatchingFlashcards.forEach((card, index) => {
        const answerLines = card.answer.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        const selectedLine = answerLines[Math.floor(Math.random() * answerLines.length)];
        questions.push({
          id: `adv-front-${index}`,
          content: card.question,
          type: 'question'
        });
        answers.push({
          id: `adv-back-${index}`,
          content: selectedLine,
          type: 'answer',
          matchId: `adv-front-${index}`
        });
      });
  
      // Additional questions (without matching answers)
      selectedAdditionalFlashcards.forEach((card, index) => {
        questions.push({
          id: `adv-front-extra-${index}`,
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
      initializeAdvancedTestMode();
    }
  
    // ===== Event Listeners =====
    if (testContainer) {
      testContainer.addEventListener('click', handleTestCardClick);
    }
    if (resetTestButton) {
      resetTestButton.addEventListener('click', resetTest);
    }
  
    // Initialize the advanced test app with a given subject
    function initAdvancedTestApp(subject) {
      pageTitle.textContent = `Advanced Test Mode: ${subject}`;
      fetchFlashcards(subject).then(success => {
        if (!success) return;
        initializeAdvancedTestMode();
      });
    }
  
    // Get assignmentId from URL parameters; if absent, use the first subject from subjects.json.
    const urlParams = new URLSearchParams(window.location.search);
    let assignmentId = urlParams.get('assignmentId');
    if (assignmentId) {
      initAdvancedTestApp(assignmentId);
    } else {
      fetch('./subjects.json')
        .then(response => response.json())
        .then(subjects => {
          if (subjects && subjects.length > 0) {
            initAdvancedTestApp(subjects[0]);
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
  