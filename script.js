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
    const testGrid = document.getElementById('test-grid');
    const resetTestButton = document.getElementById('reset-test');

    let flashcards = [];
    let currentIndex = 0;
    let isAnimating = false; // Flag to prevent overlapping animations

    // Variables for Test Mode
    let testCards = [];
    let firstCard = null;
    let secondCard = null;
    let lockBoard = false;

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
            const response = await fetch('./subjects.json'); // Ensure subjects.json is inside flashcards/
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
     * Fetch and store flashcards for a given subject
     * @param {string} subject 
     */
    async function fetchFlashcards(subject) {
        const flashcardUrl = `./flashcards/${subject}.json`; // Corrected path

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
            // Attempt to load flashcards for the given assignmentId
            const success = await fetchFlashcards(assignmentId);
            if (!success) return;

            // Update the page title
            pageTitle.textContent = `Flashcards - ${capitalizeFirstLetter(assignmentId.replace(/_/g, ' '))}`;
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
        // Hide Learn Mode elements
        flashcardContainer.style.display = 'none';
        controls.style.display = 'none';
        
        // Show Test Mode elements
        testContainer.style.display = 'block';
        modeSelection.style.display = 'none';
        
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
        testCards = shuffle(testCards);
        
        // Generate the grid
        generateTestGrid();
        adjustTestGridHeight(); // Adjust height on initialization
        setTimeout(setUniformCardHeights, 100); // Optional: Set uniform heights
    }

    /**
     * Generate Test Grid with Responsive Columns
     */
    function generateTestGrid() {
        testGrid.innerHTML = '';
        testCards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.classList.add('test-card');
            cardElement.dataset.id = card.id;
            cardElement.dataset.matchId = card.matchId || '';
            cardElement.dataset.type = card.type;
            cardElement.innerHTML = card.content; // Display content directly
            testGrid.appendChild(cardElement);
        });
    }

    /**
     * Handle Card Click in Test Mode
     * @param {Event} e 
     */
    function handleTestCardClick(e) {
        const clickedCard = e.target;
        if (lockBoard || clickedCard.classList.contains('correct')) return;

        if (!firstCard) {
            firstCard = clickedCard;
            firstCard.classList.add('selected');
            return;
        }

        secondCard = clickedCard;
        secondCard.classList.add('selected');
        lockBoard = true;

        // Check for match
        const isMatch = firstCard.dataset.matchId === secondCard.dataset.id || secondCard.dataset.matchId === firstCard.dataset.id;

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
        const remainingCards = testGrid.querySelectorAll('.test-card:not(.correct)');
        if (remainingCards.length === 0) {
            alert('Congratulations! You have matched all the cards.');
        }
    }

    /**
     * Reset Test Mode
     */
    function resetTest() {
        testCards = [];
        firstCard = null;
        secondCard = null;
        lockBoard = false;
        initializeTestMode();
    }


    // Event listener for the Start button
    startButton.addEventListener('click', () => {
        const subject = subjectSelect.value;
        if (!subject) {
            alert('Please select a subject.');
            return;
        }

        // Hide the subject selector
        subjectSelector.style.display = 'none';
        // Show mode selection
        modeSelection.style.display = 'flex';
    });

    // Event listener for the Learn mode button
    learnModeButton.addEventListener('click', async () => {
        const subject = subjectSelect.value;
        const success = await fetchFlashcards(subject);
        if (!success) return;

        // Show Learn Mode elements
        flashcardContainer.style.display = 'block';
        controls.style.display = 'flex';
        testContainer.style.display = 'none';
        modeSelection.style.display = 'none';
        displayFlashcard();
    });

    // Event listener for the Test mode button
    testModeButton.addEventListener('click', async () => {
        const subject = subjectSelect.value;
        const success = await fetchFlashcards(subject);
        if (!success) return;

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

    // Test Grid Event Listener
    testGrid.addEventListener('click', handleTestCardClick);

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
        setTimeout(setUniformCardHeights, 100); // Optional: Set uniform heights
    });
});
