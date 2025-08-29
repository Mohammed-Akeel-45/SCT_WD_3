
const prizeMoneyLadder = [
    { amount: 1000, safe: false },
    { amount: 2000, safe: false },
    { amount: 3000, safe: false },
    { amount: 5000, safe: false },
    { amount: 10000, safe: true },     
    { amount: 20000, safe: false },
    { amount: 40000, safe: false },
    { amount: 80000, safe: false },
    { amount: 160000, safe: false },
    { amount: 320000, safe: true },    
    { amount: 640000, safe: false },
    { amount: 1250000, safe: false },
    { amount: 2500000, safe: false },
    { amount: 5000000, safe: false },
    { amount: 10000000, safe: false } 
];

const fallbackQuestions = {
    easy: [
        {
            question: "What is the capital of India?",
            options: ["Mumbai", "New Delhi", "Kolkata", "Chennai"],
            correct: 1
        },
        {
            question: "How many days are there in a week?",
            options: ["5", "6", "7", "8"],
            correct: 2
        },
        {
            question: "What is 2 + 2?",
            options: ["3", "4", "5", "6"],
            correct: 1
        },
        {
            question: "Which animal is known as the King of the Jungle?",
            options: ["Tiger", "Lion", "Elephant", "Leopard"],
            correct: 1
        },
        {
            question: "How many colors are there in a rainbow?",
            options: ["5", "6", "7", "8"],
            correct: 2
        }
    ],
    medium: [
        {
            question: "Who wrote the Indian national anthem?",
            options: ["Rabindranath Tagore", "Bankim Chandra Chattopadhyay", "Sarojini Naidu", "Mahatma Gandhi"],
            correct: 0
        },
        {
            question: "What is the currency of Japan?",
            options: ["Yuan", "Won", "Yen", "Ringgit"],
            correct: 2
        },
        {
            question: "Which planet is closest to the Sun?",
            options: ["Venus", "Mercury", "Earth", "Mars"],
            correct: 1
        },
        {
            question: "In which state is the Taj Mahal located?",
            options: ["Rajasthan", "Uttar Pradesh", "Madhya Pradesh", "Haryana"],
            correct: 1
        },
        {
            question: "What is the largest mammal in the world?",
            options: ["African Elephant", "Blue Whale", "Giraffe", "Hippopotamus"],
            correct: 1
        }
    ],
    hard: [
        {
            question: "In which year did India win its first Cricket World Cup?",
            options: ["1975", "1979", "1983", "1987"],
            correct: 2
        },
        {
            question: "What is the chemical symbol for Silver?",
            options: ["Si", "Ag", "Al", "Au"],
            correct: 1
        },
        {
            question: "Who was the first woman Prime Minister of India?",
            options: ["Indira Gandhi", "Pratibha Patil", "Sonia Gandhi", "Sarojini Naidu"],
            correct: 0
        },
        {
            question: "Which is the smallest bone in the human body?",
            options: ["Stapes", "Malleus", "Incus", "Radius"],
            correct: 0
        },
        {
            question: "What is the capital of Australia?",
            options: ["Sydney", "Melbourne", "Canberra", "Perth"],
            correct: 2
        }
    ]
};

let currentQuestionIndex = 0;
let selectedAnswer = null;
let gameActive = false;
let lifelines = {
    fiftyFifty: true,
    audiencePoll: true,
    phoneAFriend: true
};
let currentQuestion = null;
let usedQuestions = new Set();

function startGame() {
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameLayout').style.display = 'grid';
    
    currentQuestionIndex = 0;
    selectedAnswer = null;
    gameActive = true;
    usedQuestions.clear();
    
    lifelines = {
        fiftyFifty: true,
        audiencePoll: true,
        phoneAFriend: true
    };
    
    initializePrizeLadder();
    loadQuestion();
}

function initializePrizeLadder() {
    const ladderContainer = document.getElementById('prizeLadder');
    ladderContainer.innerHTML = '<h3>💰 Prize Money</h3>';
    

    for (let i = prizeMoneyLadder.length - 1; i >= 0; i--) {
        const level = prizeMoneyLadder[i];
        const div = document.createElement('div');
        div.className = `prize-level ${level.safe ? 'safe-haven' : ''}`;
        div.id = `prize-${i}`;
        
        div.innerHTML = `
            <span>${i + 1}</span>
            <span>₹${formatMoney(level.amount)}</span>
        `;
        
        ladderContainer.appendChild(div);
    }
}

function formatMoney(amount) {
    if (amount >= 10000000) return '1 Crore';
    if (amount >= 100000) return `${amount / 100000} Lakh`;
    if (amount >= 1000) return `${amount / 1000}K`;
    return amount.toLocaleString('en-IN');
}

async function loadQuestion() {
    showLoading(true);
    updatePrizeLadder();
    updateQuestionHeader();
    resetLifelines();
    
    const difficulty = getDifficultyLevel();
    
    try {
        // Try to get question from API first
        const question = await fetchQuestionFromAPI(difficulty);
        currentQuestion = question;
        displayQuestion(question);
    } catch (error) {
        console.log('API failed, using fallback question:', error);

        const fallbackPool = fallbackQuestions[difficulty];
        let questionToUse;
        
  
        let attempts = 0;
        do {
            const randomIndex = Math.floor(Math.random() * fallbackPool.length);
            questionToUse = { ...fallbackPool[randomIndex], index: randomIndex };
            attempts++;
        } while (usedQuestions.has(`${difficulty}-${questionToUse.index}`) && attempts < 10);
        
        usedQuestions.add(`${difficulty}-${questionToUse.index}`);
        currentQuestion = questionToUse;
        displayQuestion(currentQuestion);
    }
    
    showLoading(false);
}

function getDifficultyLevel() {
    if (currentQuestionIndex < 5) return 'easy';
    if (currentQuestionIndex < 10) return 'medium';
    return 'hard';
}

async function fetchQuestionFromAPI(difficulty) {

    try {
        return await fetchFromTriviaDB(difficulty);
    } catch (error) {
        console.log('Trivia DB failed:', error);
    }

    try {
        return await fetchFromQuizAPI(difficulty);
    } catch (error) {
        console.log('Quiz API failed:', error);
    }
    
    throw new Error('All APIs failed');
}

async function fetchFromTriviaDB(difficulty) {
    const categoryMap = {
        'easy': '9',    
        'medium': '17', 
        'hard': '22'    
    };
    
    const difficultyMap = {
        'easy': 'easy',
        'medium': 'medium', 
        'hard': 'hard'
    };
    
    const response = await fetch(
        `https://opentdb.com/api.php?amount=1&category=${categoryMap[difficulty]}&difficulty=${difficultyMap[difficulty]}&type=multiple`
    );
    
    if (!response.ok) {
        throw new Error('Trivia DB API request failed');
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
        const questionData = data.results[0];
        
        const question = decodeHTMLEntities(questionData.question);
        const correctAnswer = decodeHTMLEntities(questionData.correct_answer);
        const incorrectAnswers = questionData.incorrect_answers.map(answer => decodeHTMLEntities(answer));
        
        const options = [...incorrectAnswers, correctAnswer];
        const shuffledOptions = shuffleArray(options);
        const correctIndex = shuffledOptions.indexOf(correctAnswer);
        
        return {
            question: question,
            options: shuffledOptions,
            correct: correctIndex
        };
    } else {
        throw new Error('No questions returned from Trivia DB');
    }
}

async function fetchFromQuizAPI(difficulty) {
 
    const difficultyMap = {
        'easy': 'easy',
        'medium': 'medium',
        'hard': 'hard'
    };
    
    const response = await fetch(`https://the-trivia-api.com/api/questions?limit=1&difficulty=${difficultyMap[difficulty]}`);
    
    if (!response.ok) {
        throw new Error('Quiz API request failed');
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
        const questionData = data[0];
        
        const options = [...questionData.incorrectAnswers, questionData.correctAnswer];
        const shuffledOptions = shuffleArray(options);
        const correctIndex = shuffledOptions.indexOf(questionData.correctAnswer);
        
        return {
            question: questionData.question,
            options: shuffledOptions,
            correct: correctIndex
        };
    } else {
        throw new Error('No questions returned from Quiz API');
    }
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function decodeHTMLEntities(text) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
}

function showLoading(show) {
    document.getElementById('loadingScreen').style.display = show ? 'block' : 'none';
    document.getElementById('questionContainer').style.display = show ? 'none' : 'block';
}

function updatePrizeLadder() {
   
    for (let i = 0; i < prizeMoneyLadder.length; i++) {
        const element = document.getElementById(`prize-${i}`);
        element.className = `prize-level ${prizeMoneyLadder[i].safe ? 'safe-haven' : ''}`;
        
        if (i < currentQuestionIndex) {
            element.classList.add('completed');
        } else if (i === currentQuestionIndex) {
            element.classList.add('current');
        }
    }
}

function updateQuestionHeader() {
    document.getElementById('questionNumber').textContent = 
        `Question ${currentQuestionIndex + 1} of ${prizeMoneyLadder.length}`;
    document.getElementById('currentPrize').textContent = 
        `Playing for: ₹${formatMoney(prizeMoneyLadder[currentQuestionIndex].amount)}`;
}

function displayQuestion(question) {
    document.getElementById('questionText').textContent = question.question;
    
    const answersGrid = document.getElementById('answersGrid');
    answersGrid.innerHTML = '';
    
    const labels = ['A', 'B', 'C', 'D'];
    
    question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'answer-option';
        button.innerHTML = `<span class="option-label">${labels[index]}:</span> ${option}`;
        button.onclick = () => selectAnswer(index);
        button.id = `option-${index}`;
        answersGrid.appendChild(button);
    });
    
    selectedAnswer = null;
    document.getElementById('finalAnswerBtn').disabled = true;
    document.getElementById('nextBtn').style.display = 'none';
    document.getElementById('answerReveal').innerHTML = '';
    gameActive = true;
}

function selectAnswer(index) {
    if (!gameActive) return;
    
    document.querySelectorAll('.answer-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    document.getElementById(`option-${index}`).classList.add('selected');
    selectedAnswer = index;
    document.getElementById('finalAnswerBtn').disabled = false;
}

function resetLifelines() {
    Object.keys(lifelines).forEach(lifeline => {
        const element = document.getElementById(lifeline);
        if (lifelines[lifeline]) {
            element.classList.remove('used');
        } else {
            element.classList.add('used');
        }
    });
}

function useFiftyFifty() {
    if (!lifelines.fiftyFifty || !gameActive) return;
    
    lifelines.fiftyFifty = false;
    document.getElementById('fiftyFifty').classList.add('used');
    
    const incorrectOptions = [];
    for (let i = 0; i < 4; i++) {
        if (i !== currentQuestion.correct) {
            incorrectOptions.push(i);
        }
    }
    
    const shuffledIncorrect = shuffleArray(incorrectOptions);
    const toRemove = shuffledIncorrect.slice(0, 2);
    
    toRemove.forEach(index => {
        const option = document.getElementById(`option-${index}`);
        option.style.opacity = '0.3';
        option.style.pointerEvents = 'none';
        option.style.background = 'rgba(0, 0, 0, 0.5)';
    });
    
    
    console.log('50:50 lifeline used!');
}

function useAudiencePoll() {
    if (!lifelines.audiencePoll || !gameActive) return;
    
    lifelines.audiencePoll = false;
    document.getElementById('audiencePoll').classList.add('used');
    
    const poll = [0, 0, 0, 0];
    const correctIndex = currentQuestion.correct;
    
    poll[correctIndex] = 40 + Math.random() * 30;
    
    const remaining = 100 - poll[correctIndex];
    const otherIndices = [0, 1, 2, 3].filter(i => i !== correctIndex);
    
    otherIndices.forEach((index, i) => {
        if (i === otherIndices.length - 1) {
           
            poll[index] = remaining - poll.slice(0, 4).reduce((sum, val, idx) => 
                idx !== correctIndex && idx !== index ? sum + val : sum, 0);
        } else {
            poll[index] = Math.random() * (remaining / 3);
        }
    });
    
    const total = poll.reduce((sum, val) => sum + val, 0);
    poll.forEach((val, i) => poll[i] = Math.max(0, Math.round((val / total) * 100)));
    
    const labels = ['A', 'B', 'C', 'D'];
    const pollResult = labels.map((label, i) => `${label}: ${poll[i]}%`).join('\n');
    
    alert(` Audience Poll Results:\n\n${pollResult}`);
}

function usePhoneAFriend() {
    if (!lifelines.phoneAFriend || !gameActive) return;
    
    lifelines.phoneAFriend = false;
    document.getElementById('phoneAFriend').classList.add('used');
    
    const labels = ['A', 'B', 'C', 'D'];
    const friendConfidence = Math.random();
    
    if (friendConfidence > 0.3) {
        
        const suggestion = labels[currentQuestion.correct];
        const confidence = Math.round(70 + Math.random() * 20);
        alert(`📞 Your friend says: "I'm pretty sure it's option ${suggestion}. I'm ${confidence}% confident about this!"`);
    } else {
     
        const randomSuggestion = labels[Math.floor(Math.random() * 4)];
        alert(`📞 Your friend says: "I'm not really sure, but I think it might be ${randomSuggestion}. Don't rely on me too much for this one!"`);
    }
}

function submitAnswer() {
    if (selectedAnswer === null || !gameActive) return;
  
    const confirmed = confirm(`Are you sure you want to lock in option ${['A', 'B', 'C', 'D'][selectedAnswer]}?\n\nThis is your FINAL ANSWER!`);
    
    if (!confirmed) return;
    
    gameActive = false;
    document.getElementById('finalAnswerBtn').disabled = true;
    
    // Disable all answer options
    document.querySelectorAll('.answer-option').forEach(opt => {
        opt.style.pointerEvents = 'none';
    });
    
    // Disable lifelines
    document.querySelectorAll('.lifeline').forEach(lifeline => {
        lifeline.style.pointerEvents = 'none';
    });
    
    // Dramatic pause before revealing answer
    setTimeout(() => {
        revealAnswer();
    }, 2000);
}

function revealAnswer() {
    const correctIndex = currentQuestion.correct;
    const isCorrect = selectedAnswer === correctIndex;
    
    // Show correct/incorrect styling
    document.querySelectorAll('.answer-option').forEach((opt, index) => {
        if (index === correctIndex) {
            opt.classList.add('correct');
        } else if (index === selectedAnswer && !isCorrect) {
            opt.classList.add('incorrect');
        }
    });
    
    // Show answer reveal message
    const revealDiv = document.getElementById('answerReveal');
    if (isCorrect) {
        revealDiv.innerHTML = `
            <div class="correct-answer-reveal">
                <h3>🎉 Absolutely Correct!</h3>
                <p>You have won ₹${formatMoney(prizeMoneyLadder[currentQuestionIndex].amount)}!</p>
                ${prizeMoneyLadder[currentQuestionIndex].safe ? '<p><strong>🛡️ This is a safe haven amount!</strong></p>' : ''}
            </div>
        `;
        
        // Create fireworks effect for correct answers
        createFireworks();
        
        // Play celebration sound (you can add audio)
        console.log('Correct answer! 🎉');
        
        setTimeout(() => {
            currentQuestionIndex++;
            if (currentQuestionIndex >= prizeMoneyLadder.length) {
                // Won the entire game!
                setTimeout(() => showWinScreen(), 1000);
            } else {
                document.getElementById('nextBtn').style.display = 'inline-block';
            }
        }, 3000);
    } else {
        const safeAmount = getSafeAmount();
        revealDiv.innerHTML = `
            <div class="wrong-answer-reveal">
                <h3>❌ Sorry, that's incorrect!</h3>
                <p>The correct answer was: <strong>${currentQuestion.options[correctIndex]}</strong></p>
                <p>You take home: ₹${formatMoney(safeAmount)}</p>
            </div>
        `;
        
        setTimeout(() => {
            showLoseScreen(safeAmount);
        }, 4000);
    }
}

function getSafeAmount() {
    // Find the last safe haven amount reached
    for (let i = currentQuestionIndex - 1; i >= 0; i--) {
        if (prizeMoneyLadder[i].safe) {
            return prizeMoneyLadder[i].amount;
        }
    }
    return 0; // No safe haven reached
}

function nextQuestion() {
    document.getElementById('nextBtn').style.display = 'none';
    loadQuestion();
}

function showWinScreen() {
    document.getElementById('gameLayout').style.display = 'none';
    document.getElementById('winScreen').style.display = 'block';
    
    const finalAmount = prizeMoneyLadder[prizeMoneyLadder.length - 1].amount;
    document.getElementById('winPrize').textContent = `You won ₹${formatMoney(finalAmount)}!`;
    
    // Epic fireworks celebration
    createMegaFireworks();
    
    // Play victory sound (you can add audio)
    console.log('WINNER! 🏆🎉🎊');
}

function showLoseScreen(safeAmount) {
    document.getElementById('gameLayout').style.display = 'none';
    document.getElementById('loseScreen').style.display = 'block';
    
    document.getElementById('losePrize').textContent = `You take home: ₹${formatMoney(safeAmount)}`;
    
    const questionNumber = currentQuestionIndex + 1;
    let message = '';
    
    if (safeAmount === 0) {
        message = `You couldn't reach any safe haven. Better luck next time!`;
    } else {
        message = `You reached question ${questionNumber} and secured ₹${formatMoney(safeAmount)} at the safe haven!`;
    }
    
    document.getElementById('loseMessage').textContent = message;
}

function restartGame() {
    // Reset all game state
    currentQuestionIndex = 0;
    selectedAnswer = null;
    gameActive = false;
    usedQuestions.clear();
    
    lifelines = {
        fiftyFifty: true,
        audiencePoll: true,
        phoneAFriend: true
    };
    
    // Hide all screens except start screen
    document.getElementById('winScreen').style.display = 'none';
    document.getElementById('loseScreen').style.display = 'none';
    document.getElementById('gameLayout').style.display = 'none';
    document.getElementById('startScreen').style.display = 'block';
}

// Fireworks Animation Functions
function createFireworks() {
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            createSingleFirework();
        }, i * 200);
    }
}

function createMegaFireworks() {
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            createSingleFirework();
        }, i * 100);
    }
}

function createSingleFirework() {
    const colors = ['#FF6B35', '#F7931E', '#FFD700', '#4CAF50', '#2196F3', '#9C27B0', '#E91E63'];
    const firework = document.createElement('div');
    firework.className = 'firework firework-burst';
    
    // Random position
    firework.style.left = Math.random() * window.innerWidth + 'px';
    firework.style.top = Math.random() * window.innerHeight + 'px';
    
    // Random color and size
    firework.style.background = colors[Math.floor(Math.random() * colors.length)];
    firework.style.width = (20 + Math.random() * 30) + 'px';
    firework.style.height = firework.style.width;
    
    document.body.appendChild(firework);
    
    // Remove after animation
    setTimeout(() => {
        if (firework.parentNode) {
            firework.parentNode.removeChild(firework);
        }
    }, 1000);
}

// Initialize the game when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('KBC Quiz Game Loaded! 🎮');
    console.log('Ready to make someone a Crorepati! 💰');
});

// Keyboard shortcuts for better UX
document.addEventListener('keydown', function(event) {
    if (!gameActive) return;
    
    // Use A, B, C, D keys to select answers
    const key = event.key.toLowerCase();
    if (['a', 'b', 'c', 'd'].includes(key)) {
        const index = ['a', 'b', 'c', 'd'].indexOf(key);
        selectAnswer(index);
    }
    
    // Use Enter to submit final answer
    if (event.key === 'Enter' && selectedAnswer !== null) {
        submitAnswer();
    }
    
    // Use Space for next question
    if (event.key === ' ' && document.getElementById('nextBtn').style.display !== 'none') {
        event.preventDefault();
        nextQuestion();
    }
});

// Add sound effects (you can enhance this)
function playSound(type) {
    // You can add actual audio files here
    switch(type) {
        case 'correct':
            console.log('🎵 Playing correct answer sound');
            break;
        case 'incorrect':
            console.log('🎵 Playing incorrect answer sound');
            break;
        case 'lifeline':
            console.log('🎵 Playing lifeline sound');
            break;
        case 'win':
            console.log('🎵 Playing victory sound');
            break;
        default:
            break;
    }
}
