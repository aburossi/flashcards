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
    const controls = document.getElementById('controls'); // Added reference to controls

    let flashcards = [];
    let currentIndex = 0;
    let isAnimating = false; // Flag to prevent overlapping animations

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
            controls.style.display = 'flex'; // Show controls
        } catch (error) {
            console.error('Error details:', error);
            alert(`Failed to load flashcards for subject "${subject}". Please check the console for more details.`);
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

    // Allow flipping the card by clicking on it
    flashcard.addEventListener('click', () => {
        if (isAnimating) return; // Prevent flipping during animation
        flashcard.classList.toggle('flipped');
        adjustFlashcardHeight();
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

    // Initialize the application
    initializeApp();

    // Adjust height when the window is resized to ensure proper fit
    window.addEventListener('resize', adjustFlashcardHeight);
});
