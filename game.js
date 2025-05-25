// Get a reference to the canvas element and its 2D rendering context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// DOM Elements for Leaderboard and Name Form
const nameFormContainer = document.getElementById('nameFormContainer');
const nameForm = document.getElementById('nameForm');
const playerNameInput = document.getElementById('playerNameInput');
const leaderboardContainer = document.getElementById('leaderboardContainer');
const leaderboardList = document.getElementById('leaderboardList');

// Leaderboard constants
const LEADERBOARD_KEY = 'flappyBirdLeaderboard';
const MAX_LEADERBOARD_ENTRIES = 10;

// Set canvas dimensions
canvas.width = 288;
canvas.height = 512;

// Bird properties
const bird = {
    x: 50,
    y: 150,
    width: 20,
    height: 20,
    gravity: 0.6,
    lift: -10,
    velocity: 0
};

// Draw bird (simple rectangle for now)
function drawBird() {
    ctx.fillStyle = 'yellow';
    ctx.fillRect(bird.x, bird.y, bird.width, bird.height);
}

// Update bird position
function updateBird() {
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;

    // Prevent bird from going above the screen
    if (bird.y < 0) {
        bird.y = 0;
        bird.velocity = 0;
    }

    // Prevent bird from going below the screen (game over)
    if (bird.y + bird.height > canvas.height) {
        gameOver();
    }
}

// Flap
function flap() {
    bird.velocity = bird.lift;
}

// Event listener for key press
document.addEventListener('keydown', function(event) {
    if (event.code === 'Space') {
        flap();
    }
});

// Game loop
function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw and update bird
    drawBird();
    updateBird();

    requestAnimationFrame(gameLoop);
}

// Pipe properties
const pipes = [];
const pipeWidth = 50;
const pipeGap = 100; // Gap between upper and lower pipe
let frameCount = 0; // Used to control pipe generation frequency

// Draw pipes
function drawPipes() {
    ctx.fillStyle = 'green';
    pipes.forEach(pipe => {
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight); // Upper pipe
        ctx.fillRect(pipe.x, canvas.height - pipe.bottomHeight, pipeWidth, pipe.bottomHeight); // Lower pipe
    });
}

// Update pipe positions and generate new pipes
function updatePipes() {
    // Generate new pipes every 100 frames (adjust as needed)
    if (frameCount % 100 === 0) {
        const topHeight = Math.random() * (canvas.height / 2 - pipeGap / 2) + pipeGap / 2; // Random height for upper pipe
        const bottomHeight = canvas.height - topHeight - pipeGap;
        pipes.push({ x: canvas.width, topHeight, bottomHeight });
    }

    const currentLevel = levels[currentLevelIndex];
    // Adjust pipe generation frequency based on speed - faster speed, more frequent pipes
    const pipeGenerationInterval = Math.max(50, 120 - currentLevel.speed * 10);


    // Generate new pipes
    if (frameCount % Math.floor(pipeGenerationInterval) === 0) { // Ensure integer interval
        const topHeight = Math.random() * (canvas.height / 2 - pipeGap / 2) + pipeGap / 2;
        const bottomHeight = canvas.height - topHeight - pipeGap;
        pipes.push({ x: canvas.width, topHeight, bottomHeight, passed: false });
    }

    // Move pipes to the left
    pipes.forEach(pipe => {
        pipe.x -= currentLevel.speed;
    });

    // Remove pipes that are off-screen
    if (pipes.length > 0 && pipes[0].x + pipeWidth < 0) {
        pipes.shift();
    }

    frameCount++;
}

// Collision detection
function checkCollisions() {
    // Collision with pipes
    pipes.forEach(pipe => {
        if (
            bird.x < pipe.x + pipeWidth &&
            bird.x + bird.width > pipe.x &&
            (bird.y < pipe.topHeight || bird.y + bird.height > canvas.height - pipe.bottomHeight)
        ) {
            gameOver();
        }
    });
}

// Score
let score = 0;

function updateScore() {
    pipes.forEach(pipe => {
        if (pipe.x + pipeWidth < bird.x && !pipe.passed) {
            score++;
            pipesPassedThisLevel++;
            pipe.passed = true;

            if (gameState === 'playing' && pipesPassedThisLevel >= levels[currentLevelIndex].pipesToNextLevel) {
                levelUp();
            }
        }
    });
}

function levelUp() {
    const currentLevelConfig = levels[currentLevelIndex];
    gameState = 'levelUp';
    clearTimeout(levelUpMessageTimeout); // Clear any existing timeout

    // Display level up message
    ctx.fillStyle = 'blue';
    ctx.font = '25px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(currentLevelConfig.message, canvas.width / 2, canvas.height / 2 - 40);


    levelUpMessageTimeout = setTimeout(() => {
        currentLevelIndex++;
        pipesPassedThisLevel = 0;
        if (currentLevelIndex >= levels.length) {
            gameState = 'win';
        } else {
            gameState = 'playing';
        }
    }, 2000); // Display message for 2 seconds
}


function drawScore() {
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText('Score: ' + score, 10, 20);
}

function drawLevel() {
    if (currentLevelIndex < levels.length) { // Ensure we don't try to access beyond the last level's text
        ctx.fillStyle = 'black';
        ctx.font = '20px Arial';
        ctx.fillText('Level: ' + (currentLevelIndex + 1), canvas.width - 80, 20);
    }
}


// Game state
let gameState = 'playing'; // Possible states: 'playing', 'gameOver', 'levelUp', 'win'

// Level configuration
const levels = [
    { speed: 2, pipesToNextLevel: 5, message: "Level 1 Complete!" },
    { speed: 2.5, pipesToNextLevel: 5, message: "Level 2 Complete!" },
    { speed: 3, pipesToNextLevel: 5, message: "You Win!" } // Last level
];
let currentLevelIndex = 0;
let pipesPassedThisLevel = 0;
let levelUpMessageTimeout = null; // For displaying level up message temporarily
let nameFormSubmittedForCurrentGameOver = false; // Tracks if name form was submitted for the current game over/win session

function resetGameVariables() {
    bird.y = 150;
    bird.velocity = 0;
    hideNameForm(); // Ensure name form is hidden on reset
    pipes.length = 0; // Clear pipes array
    score = 0;
    currentLevelIndex = 0;
    pipesPassedThisLevel = 0;
    frameCount = 0; // Reset frameCount to ensure pipe generation starts fresh
    // gameState will be set by the calling function (e.g., to 'playing' for a new game, or 'gameOver' state remains until explicit restart)
}

// Game over
function gameOver() {
    gameState = 'gameOver';
    console.log('Game Over! Score: ' + score);
    nameFormSubmittedForCurrentGameOver = false; // Reset flag

    if (isHighScore(score)) {
        showNameForm();
        hideLeaderboard(); // Hide leaderboard while name form is shown
    } else {
        displayLeaderboard(); // Display leaderboard if not a new high score
    }

    // Canvas message drawing is now primarily handled in gameLoop for consistency
}


// Game loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'playing') {
        hideLeaderboard();
        hideNameForm();

        drawBird();
        updateBird();
        drawPipes();
        updatePipes();
        checkCollisions();
        updateScore();
        drawScore();
        drawLevel();

    } else if (gameState === 'levelUp') {
        drawBird();
        drawPipes();
        drawScore();
        drawLevel();
        // levelUp() function itself draws its specific message on canvas
        // Leaderboard remains hidden as game will resume or go to win state
        hideLeaderboard();


    } else if (gameState === 'gameOver') {
        drawBird();
        drawPipes();
        drawScore();
        drawLevel();

        ctx.fillStyle = 'black';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 20);

        if (nameFormContainer.style.display !== 'block') {
            displayLeaderboard(); // Ensure leaderboard is visible if form is not
            ctx.font = '20px Arial';
            ctx.fillText('Press Space to Restart', canvas.width / 2, canvas.height / 2 + 50);
        }

    } else if (gameState === 'win') {
        drawBird();
        drawPipes();
        drawScore();
        drawLevel();

        ctx.fillStyle = 'green';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(levels[levels.length - 1].message, canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillText('Final Score: ' + score, canvas.width / 2, canvas.height / 2 + 20);

        if (!nameFormSubmittedForCurrentGameOver && isHighScore(score)) {
            showNameForm();
            hideLeaderboard();
        } else {
            displayLeaderboard();
            if (nameFormContainer.style.display !== 'block') {
                ctx.font = '20px Arial';
                ctx.fillText('Press Space to Restart', canvas.width / 2, canvas.height / 2 + 50);
            }
        }
    }

    requestAnimationFrame(gameLoop);
}

// Leaderboard functions
function getLeaderboard() {
    try {
        const data = localStorage.getItem(LEADERBOARD_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("Error getting leaderboard from localStorage", e);
        return [];
    }
}

function saveLeaderboard(leaderboard) {
    try {
        localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
    } catch (e) {
        console.error("Error saving leaderboard to localStorage", e);
    }
}

function addScoreToLeaderboard(name, scoreValue) {
    const leaderboard = getLeaderboard();
    leaderboard.push({ name, score: scoreValue });
    leaderboard.sort((a, b) => b.score - a.score); // Sort descending
    if (leaderboard.length > MAX_LEADERBOARD_ENTRIES) {
        leaderboard.length = MAX_LEADERBOARD_ENTRIES; // Trim to max entries
    }
    saveLeaderboard(leaderboard);
}

// Display/UI functions for leaderboard and name form
function displayLeaderboard() {
    leaderboardList.innerHTML = ''; // Clear existing entries
    const leaderboard = getLeaderboard();
    if (leaderboard.length === 0) {
        leaderboardList.innerHTML = '<li>No scores yet!</li>';
    } else {
        leaderboard.forEach((entry, index) => {
            const listItem = document.createElement('li');
            listItem.textContent = `${index + 1}. ${entry.name}: ${entry.score}`;
            leaderboardList.appendChild(listItem);
        });
    }
    leaderboardContainer.style.display = 'block';
}

function hideLeaderboard() {
    leaderboardContainer.style.display = 'none';
}

function showNameForm() {
    nameFormContainer.style.display = 'block';
    playerNameInput.focus(); // Focus on the input field
}

function hideNameForm() {
    nameFormContainer.style.display = 'none';
}

function isHighScore(scoreValue) {
    const leaderboard = getLeaderboard();
    if (leaderboard.length < MAX_LEADERBOARD_ENTRIES) {
        return true;
    }
    // Check if score is higher than the lowest score on the (full) leaderboard
    return scoreValue > leaderboard[MAX_LEADERBOARD_ENTRIES - 1].score;
}

// Event listener for name form submission
nameForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const playerName = playerNameInput.value.trim();
    if (playerName) {
        addScoreToLeaderboard(playerName, score);
        hideNameForm();
        displayLeaderboard(); // Show updated leaderboard
        playerNameInput.value = '';
        nameFormSubmittedForCurrentGameOver = true; // Mark as submitted for this session

        // After submitting, if in win/gameOver state, ensure restart message is shown
        if (gameState === 'gameOver' || gameState === 'win') {
            // Need to force a canvas redraw or update the specific text area
            // For simplicity, we'll rely on the next gameLoop iteration to show the restart message
            // if nameFormContainer is now hidden.
        }
    }
});

// Original keydown listener for flap
document.addEventListener('keydown', function(event) {
    if (event.code === 'Space') {
        if (gameState === 'playing') {
            flap();
        } else if ((gameState === 'gameOver' || gameState === 'win') && nameFormContainer.style.display === 'none') {
            // Restart game only if name form is not displayed
            resetGameVariables();
            gameState = 'playing';
            // hideLeaderboard(); // Handled by 'playing' state in gameLoop
            // hideNameForm();    // Handled by resetGameVariables & 'playing' state
        }
    }
});


// Start the game loop
gameLoop();

// Initial display of leaderboard (if not starting in 'playing' state, though it defaults to 'playing')
// This ensures leaderboard is shown if game somehow starts in a non-playing state.
if (gameState !== 'playing') {
    displayLeaderboard();
} else {
    hideLeaderboard(); // Explicitly hide if starting in 'playing' state
}
