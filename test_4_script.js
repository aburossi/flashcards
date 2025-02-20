document.addEventListener('DOMContentLoaded', function() {
    let flashcards = [];
    let testCards = [];
    let currentQuestionIndex = 0;
    let totalQuestions = 10;
    let correctCount = 0;
    let lock = false;
  
    // DOM Elements
    const cardBackElem = document.getElementById('card-back');
    const optionsElem = document.getElementById('options');
    const resultElem = document.getElementById('result');
    const questionCounterElem = document.getElementById('question-counter');
    const printButton = document.getElementById('print-button');
    const setupContainer = document.getElementById('setup-container');
    const testContainer = document.querySelector('.test-4-container');
    const startTestButton = document.getElementById('start-test');
    const numCardsInput = document.getElementById('num-cards');
  
    // Open the print dialog when the Print button is clicked
    printButton.addEventListener('click', function() {
      window.print();
    });
  
    // Fetch flashcards JSON for a given subject (using assignmentId from URL)
    async function fetchFlashcards(subject) {
      const url = `./flashcards/${subject}.json`;
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const data = await response.json();
        flashcards = data;
        if (!flashcards.length) {
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
  
    // Simple Fisher-Yates shuffle
    function shuffle(array) {
      let currentIndex = array.length, randomIndex;
      while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
      }
      return array;
    }
  
    // Prepare test questions by choosing (up to) totalQuestions flashcards
    function prepareTestCards() {
      if (flashcards.length < totalQuestions) {
        totalQuestions = flashcards.length;
      }
      const shuffled = shuffle([...flashcards]);
      testCards = shuffled.slice(0, totalQuestions);
    }
  
    // For the current test card, generate four options (one correct and three distractors)
    function generateOptions(correctCard) {
      const options = [];
      // Add the correct front (question) as one option
      options.push({ text: correctCard.question, isCorrect: true });
      
      // Gather distractor options from flashcards (avoiding duplicates)
      const distractors = flashcards.filter(card => card.question !== correctCard.question);
      shuffle(distractors);
      for (let i = 0; i < 3 && i < distractors.length; i++) {
        options.push({ text: distractors[i].question, isCorrect: false });
      }
      // Shuffle the final options so the correct answer isn’t always in the same position
      return shuffle(options);
    }
  
    // Display the current test question
    function displayQuestion() {
      if (currentQuestionIndex >= totalQuestions) {
        showResults();
        return;
      }
      // Clear previous options and any result text
      optionsElem.innerHTML = '';
      resultElem.textContent = '';
      // Update question counter
      questionCounterElem.textContent = `Question ${currentQuestionIndex + 1} of ${totalQuestions}`;
      
      const currentCard = testCards[currentQuestionIndex];
      // Show the card's back (answer) at the top
      cardBackElem.innerHTML = currentCard.answer.replace(/\n/g, '<br>');
      
      // Generate and display the four front options
      const options = generateOptions(currentCard);
      options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'option-button';
        btn.textContent = option.text;
        btn.dataset.correct = option.isCorrect;
        btn.addEventListener('click', handleOptionClick);
        optionsElem.appendChild(btn);
      });
    }
  
    // Handle option selection and provide feedback
    function handleOptionClick(event) {
      if (lock) return;
      lock = true;
      const chosenButton = event.currentTarget;
      const isCorrect = chosenButton.dataset.correct === 'true';
      
      // Find the button with the correct answer
      const buttons = optionsElem.querySelectorAll('.option-button');
      let correctButton;
      buttons.forEach(btn => {
        if (btn.dataset.correct === 'true') {
          correctButton = btn;
        }
      });
      
      if (isCorrect) {
        chosenButton.classList.add('correct');
        correctCount++;
        // Wait 1 second before moving to the next question
        setTimeout(() => {
          currentQuestionIndex++;
          lock = false;
          displayQuestion();
        }, 1000);
      } else {
        chosenButton.classList.add('incorrect');
        if (correctButton) {
          correctButton.classList.add('correct');
        }
        // Wait 3 seconds before moving to the next question
        setTimeout(() => {
          currentQuestionIndex++;
          lock = false;
          displayQuestion();
        }, 3000);
      }
    }
  
    // Show the final results (percentage of correct answers)
    function showResults() {
      cardBackElem.innerHTML = '';
      optionsElem.innerHTML = '';
      questionCounterElem.textContent = '';
      const percentage = Math.round((correctCount / totalQuestions) * 100);
      resultElem.textContent = `You got ${correctCount} out of ${totalQuestions} correct. (${percentage}%)`;
      // Show the print button at the end
      printButton.style.display = 'block';
    }
  
    // Retrieve the assignmentId from the URL parameters
    function getAssignmentId() {
      const params = new URLSearchParams(window.location.search);
      return params.get('assignmentId');
    }
  
    // Initialization: load flashcards, prepare test questions, and display the first question
    async function initTest4() {
      let subject = getAssignmentId();
      if (!subject) {
        // Fallback: load subjects.json and use the first subject if assignmentId isn’t provided
        try {
          const response = await fetch('./subjects.json');
          const subjects = await response.json();
          if (subjects && subjects.length > 0) {
            subject = subjects[0];
          } else {
            alert('No subjects available.');
            return;
          }
        } catch (error) {
          console.error('Error loading subjects.json:', error);
          alert('Error loading subjects.');
          return;
        }
      }
      document.getElementById('page-title').textContent = `Test Mode 4: ${subject}`;
      const success = await fetchFlashcards(subject);
      if (!success) return;
      prepareTestCards();
      displayQuestion();
    }
  
    // Start the test when the user clicks the Start Test button
    startTestButton.addEventListener('click', function() {
      totalQuestions = parseInt(numCardsInput.value, 10) || 10;
      // Hide the setup container and show the test container
      setupContainer.style.display = 'none';
      testContainer.style.display = 'block';
      initTest4();
    });
  });
  