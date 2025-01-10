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
    const controls = document.getElementById('controls'); // Reference to controls
    const modeSelection = document.getElementById('mode-selection'); // Mode Selection Section
    const learnModeButton = document.getElementById('learn-mode');
    const testModeButton = document.getElementById('test-mode');
    const testContainer = document.getElementById('test-container');
    const testQuestions = document.getElementById('test-questions');
    const testAnswers = document.getElementById('test-answers');
    const resetTestButton = document.getElementById('reset-test');

    let flashcards = [];
    let currentIndex = 0;
    let isAnimating = false; // Flag to prevent overlapping animations

    // Variables for Test Mode
    let testCards = [];
    let firstCard = null;
    let secondCard = null;
    let lockBoard = false;

    let currentSubject = ""; // Tracks the active subject

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
            const response = await fetch('./subjects.json'); // Ensure the correct path
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
            option.textContent = capitalizeFirstLetter(subject.replace(/_/g, ' '));
            subjectSelect.appendChild(option);
        });
    }

    /**
     * Fetch and store flashcards for a given subject
     * @param {string} subject 
     */
    async function fetchFlashcards(subject) {
        const flashcardUrl = `./flashcards/${subject}.json`; // Ensure this path is correct

        try {
            const response = await fetch(flashcardUrl);
            if (!response.ok) {
                throw new Error(`Failed to load flashcards for subject: ${subject}. Status: ${response.status}`);
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
            console.error('Error details:', error);
            alert(`Failed to load flashcards for subject "${subject}". Please check the console for more details.`);
            return false;
        }
    }

    /**
     * Display the current flashcard without animation
     */
    function showFlashcard() {
        const card = flashcards[currentIndex];
        front.innerHTML = card.question;
        back.innerHTML = card.answer.replace(/\n/g, '<br>');
        flashcard.classList.remove('flipped');
        adjustFlashcardHeight();
    }

    /**
     * Display the current flashcard with animation based on direction
     * @param {string} direction - 'next' or 'prev'
     */
    function displayFlashcardWithAnimation(direction) {
        if (isAnimating) return;
        isAnimating = true;

        if (direction === 'next') {
            flashcard.classList.add('slide-out-left');
        } else if (direction === 'prev') {
            flashcard.classList.add('slide-out-right');
        }

        flashcard.addEventListener('animationend', handleAnimationEnd);

        function handleAnimationEnd() {
            flashcard.removeEventListener('animationend', handleAnimationEnd);
            flashcard.classList.remove(direction === 'next' ? 'slide-out-left' : 'slide-out-right');

            // Update index
            if (direction === 'next') {
                currentIndex++;
            } else if (direction === 'prev') {
                currentIndex--;
            }

            // Update content
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

            flashcard.addEventListener('animationend', () => {
                flashcard.classList.remove(direction === 'next' ? 'slide-in-right' : 'slide-in-left');
                isAnimating = false;
                adjustFlashcardHeight();
            }, { once: true });
        }
    }

    /**
     * Display the current flashcard
     */
    function displayFlashcard() {
        showFlashcard();
    }

    /**
     * Adjust the flashcard container's height based on the visible content
     */
    function adjustFlashcardHeight() {
        // Temporarily reset the height to get the natural height
        flashcardContainer.style.height = 'auto';

        // Determine which side is currently visible
        const isFlipped = flashcard.classList.contains('flipped');

        // Get the height of the visible side
        const visibleSide = isFlipped ? back : front;
        const newHeight = visibleSide.scrollHeight + 40; // Adding some padding

        // Set the container height with a smooth transition
        flashcardContainer.style.height = `${newHeight}px`;
    }

    /**
     * Initialize the app based on URL parameters
     */
    async function initializeApp() {
        const params = getUrlParams();
        const assignmentId = params['assignmentId'];

        if (assignmentId) {
            currentSubject = assignmentId; // Set the current subject
            const success = await fetchFlashcards(currentSubject);
            if (!success) return;

            // Update the page title
            pageTitle.textContent = `Flashcards - ${capitalizeFirstLetter(currentSubject.replace(/_/g, ' '))}`;
            // Hide the subject selector
            subjectSelector.style.display = 'none';
            // Show mode selection
            modeSelection.style.display = 'flex';
        } else {
            // No assignmentId, load subjects for selection
            await loadSubjects();
            // Show the subject selector
            subjectSelector.style.display = 'block';
        }
    }

    /**
     * Shuffle an array using Fisher-Yates algorithm
     * @param {Array} array 
     * @returns {Array}
     */
    function shuffle(array) {
        let currentIndex = array.length, temporaryValue, randomIndex;
      
        // While there remain elements to shuffle...
        while (0 !== currentIndex) {
      
            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
      
            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
      
        return array;
    }

    /**
     * Initialize Test Mode
     */
    function initializeTestMode() {
        // Reset previous test state
        resetTestState();

        // Hide Learn Mode elements
        flashcardContainer.style.display = 'none';
        controls.style.display = 'none';
        
        // Show Test Mode elements
        testContainer.style.display = 'block';
        modeSelection.style.display = 'none';
        
        // Add 'test-mode' class to the container for expanded width
        document.querySelector('.container').classList.add('test-mode');
        
        // Prepare Test Cards (6 random flashcards)
        testCards = [];
        const selectedFlashcards = shuffle([...flashcards]).slice(0, 6); // Select 6 random flashcards
        selectedFlashcards.forEach((card, index) => {
            testCards.push({
                id: `front-${index}`,
                content: card.question,
                type: 'question'
            });
            testCards.push({
                id: `back-${index}`,
                content: card.answer.replace(/\n/g, '<br>'),
                type: 'answer',
                matchId: `front-${index}`
            });
        });
        
        // Shuffle the test cards to randomize their positions
        // Removed shuffling since we are separating into two columns

        // Generate the questions and answers
        generateTestColumns();
        adjustTestGridHeight(); // Adjust height on initialization
    }

    /**
     * Generate Test Columns with Questions and Answers
     */
    function generateTestColumns() {
        // Clear existing content
        testQuestions.innerHTML = '<h2>Questions</h2>';
        testAnswers.innerHTML = '<h2>Answers</h2>';

        testCards.forEach(card => {
            if (card.type === 'question') {
                const cardElement = createTestCard(card);
                testQuestions.appendChild(cardElement);
            } else if (card.type === 'answer') {
                const cardElement = createTestCard(card);
                testAnswers.appendChild(cardElement);
            }
        });
    }

    /**
     * Create a Test Card Element
     * @param {Object} card 
     * @returns {HTMLElement}
     */
    function createTestCard(card) {
        const cardElement = document.createElement('div');
        cardElement.classList.add('test-card');
        cardElement.dataset.id = card.id;
        cardElement.dataset.matchId = card.matchId || '';
        cardElement.dataset.type = card.type;
        cardElement.innerHTML = card.content; // Display content directly
        return cardElement;
    }

    /**
     * Handle Card Click in Test Mode
     * @param {Event} e 
     */
    function handleTestCardClick(e) {
        const clickedCard = e.target.closest('.test-card');
        if (!clickedCard || lockBoard || clickedCard.classList.contains('correct') || clickedCard.classList.contains('selected')) return;

        if (clickedCard.dataset.type === 'answer') {
            // Answers are to be matched with questions
            if (!firstCard) {
                firstCard = clickedCard;
                firstCard.classList.add('selected');
                return;
            }

            secondCard = clickedCard;
            secondCard.classList.add('selected');
            lockBoard = true;

            // Check for match
            const isMatch = firstCard.dataset.matchId === secondCard.dataset.id;

            if (isMatch) {
                // Correct match
                firstCard.classList.add('correct');
                secondCard.classList.add('correct');
                resetSelection();
                checkTestCompletion();
            } else {
                // Incorrect match
                firstCard.classList.add('incorrect');
                secondCard.classList.add('incorrect');

                setTimeout(() => {
                    firstCard.classList.remove('incorrect', 'selected');
                    secondCard.classList.remove('incorrect', 'selected');
                    resetSelection();
                }, 500); // 0.5 second delay for animation
            }
        } else {
            // If the clicked card is a question, do nothing or you can implement additional logic
            // For simplicity, we allow matching only answers to questions
            alert('Please select an answer card to match with the question.');
            return;
        }
    }

    /**
     * Reset Selection Variables
     */
    function resetSelection() {
        [firstCard, secondCard] = [null, null];
        lockBoard = false;
    }

    /**
     * Check if Test is Completed
     */
    function checkTestCompletion() {
        const remainingCards = testContainer.querySelectorAll('.test-card:not(.correct)');
        if (remainingCards.length === 0) {
            alert('Congratulations! You have matched all the cards.');
        }
    }

    /**
     * Reset Test Mode
     */
    function resetTest() {
        resetTestState();
        initializeTestMode();
        
        // Remove 'test-mode' class when resetting
        document.querySelector('.container').classList.remove('test-mode');
    }

    /**
     * Reset Test State
     */
    function resetTestState() {
        testCards = [];
        firstCard = null;
        secondCard = null;
        lockBoard = false;
        testQuestions.innerHTML = '<h2>Questions</h2>';
        testAnswers.innerHTML = '<h2>Answers</h2>';
    }

    /**
     * Adjust Test Grid Height Dynamically
     */
    function adjustTestGridHeight() {
        const headerHeight = pageTitle.offsetHeight;
        const modeSelectionHeightValue = modeSelection.offsetHeight || 0;
        const controlsHeightValue = controls.offsetHeight || 0;
        const resetButtonHeightValue = resetTestButton.offsetHeight || 0;
        const otherHeights = headerHeight + modeSelectionHeightValue + controlsHeightValue + resetButtonHeightValue + 100; // 100px buffer
        const newHeight = window.innerHeight - otherHeights;
        testContainer.style.height = `${newHeight}px`;
    }

    // Event listener for the Start button
    startButton.addEventListener('click', () => {
        const subject = subjectSelect.value;
        if (!subject) {
            alert('Please select a subject.');
            return;
        }

        currentSubject = subject; // Set the current subject based on user selection

        // Fetch flashcards if not already loaded
        fetchFlashcards(currentSubject).then(success => {
            if (!success) return;

            // Hide the subject selector
            subjectSelector.style.display = 'none';
            // Show mode selection
            modeSelection.style.display = 'flex';
        });
    });

    // Event listener for the Learn mode button
    learnModeButton.addEventListener('click', async () => {
        if (!currentSubject) {
            alert('No subject selected.');
            return;
        }

        // Since flashcards are already loaded during initialization (if assignmentId is present),
        // no need to fetch again. However, if you allow switching subjects without assignmentId,
        // you might need to handle fetching accordingly.

        // Show Learn Mode elements
        flashcardContainer.style.display = 'block';
        controls.style.display = 'flex';
        testContainer.style.display = 'none';
        modeSelection.style.display = 'none';
        displayFlashcard();
        
        // Remove 'test-mode' class in case it's present
        document.querySelector('.container').classList.remove('test-mode');
    });

    // Event listener for the Test mode button
    testModeButton.addEventListener('click', async () => {
        if (!currentSubject) {
            alert('No subject selected.');
            return;
        }

        // Initialize Test Mode
        initializeTestMode();
    });

    // Event listener for the Reset Test button
    resetTestButton.addEventListener('click', () => {
        resetTest();
    });

    // Event listener for the Flip button
    flipButton.addEventListener('click', () => {
        if (isAnimating) return; // Prevent flipping during animation
        flashcard.classList.toggle('flipped');
        adjustFlashcardHeight();
    });

    // Event listener for the Next button
    nextButton.addEventListener('click', () => {
        if (isAnimating) return;
        if (currentIndex < flashcards.length - 1) {
            displayFlashcardWithAnimation('next');
        } else {
            alert('This is the last flashcard.');
        }
    });

    // Event listener for the Previous button
    prevButton.addEventListener('click', () => {
        if (isAnimating) return;
        if (currentIndex > 0) {
            displayFlashcardWithAnimation('prev');
        } else {
            alert('This is the first flashcard.');
        }
    });

    // Keyboard Navigation
    document.addEventListener('keydown', (event) => {
        if (isAnimating) return; // Prevent actions during animation
        switch(event.key) {
            case 'ArrowLeft':
                prevButton.click();
                break;
            case 'ArrowRight':
                nextButton.click();
                break;
            case 'ArrowUp':
            case 'ArrowDown':
                flipButton.click();
                break;
            default:
                break;
        }
    });

    // Test Columns Event Listener
    testContainer.addEventListener('click', handleTestCardClick);

    // Initialize the application
    initializeApp();

    // Adjust height when the window is resized to ensure proper fit
    window.addEventListener('resize', () => {
        adjustFlashcardHeight();
        adjustTestGridHeight();
    });

    // Initial adjustment on window load
    window.addEventListener('load', () => {
        adjustTestGridHeight();
    });
});
