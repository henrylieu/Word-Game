let time = 30;
let timerInterval = null;
let score = 0;
let highscore = 0;
let currentLetter = "";
let wordlist = new Set();
let wordSet = new Set();

async function fetchWordList() {
    const response = await fetch('words_dictionary.json');
    const data = await response.json();
    wordSet = new Set(Object.keys(data).map(word => word.toLowerCase()));
        
}

fetchWordList();

function startTimer() {

    if (timerInterval !== null) {
       
        document.getElementById("countdownDisplay").textContent = ""; // Clear the countdown display
        clearInput(); // Clear the input field when the timer ends 
        resetList(); // Clear the word list and score list when the timer ends
        resetGame(); // Reset the game if the timer is already running
        return; // Exit the function if the timer is already running

    }
    resetList(); // Clear the word list and score list when the timer starts
    timeLeft = time; // Reset the timer to 30 seconds
    updateScore(); // Update the score display when the timer starts
    document.getElementById("start-button").textContent = "End" // Change button text to "End"
    updateTimer();
    document.getElementById("word-input").disabled = false; // Enable the input field when the timer starts
    document.getElementById("word-input").focus(); //focus on input box so you doin't need to click it
    showLetter(); // Show a random letter when the timer starts

    timerInterval = setInterval(function() {
        timeLeft--;
        updateTimer();
        if (timeLeft <= 0) { //if the timer reaches 0, stop the timer and end the game
            clearInput(); // Clear the input field when the timer ends
            endGame();
            resetGame();
            
        }

}, 1000);
}

function getInput() {
    let word = document.getElementById("word-input").value;
    if (checkSpace(word) == true) {
        return;
    }
    checkWord(word);
}

function updateTimer() {
    document.getElementById("countdownDisplay").textContent = timeLeft;
}

function endGame() {
    document.getElementById("countdownDisplay").textContent = "Time's up!";
}

function clearInput() {
    document.getElementById("word-input").value = ""; // Clear the input field
}

function showLetter() {
    currentLetter = String.fromCharCode(Math.floor(Math.random() * 26) + 65); // Generate a random letter from A-Z
    document.getElementById("letter").textContent = currentLetter;
}
function resetGame() {
    clearInterval(timerInterval);
    timerInterval = null;
    document.getElementById("start-button").textContent = "Start" // Change button text back to "Start"
    document.getElementById("word-input").disabled = true; // Disable the input field when the timer ends
    document.getElementById("letter").textContent = ""; // Clear the letter display
    document.getElementById("result").textContent = ""; // Clear the result display
    score = 0;
    timeLeft = time; // Reset the timer to 30 seconds
}

function checkSpace(word) {
    if (word.split(" ").length > 1) {
        document.getElementById("result").textContent = "Invalid Word: No spaces allowed";
        return true;
    }
    else {
        return false;
    }
}

function updateScore() {
    document.getElementById("score").textContent = "Score: " + score;
    if (score > highscore) {
        highscore = score;
        document.getElementById("highscore").textContent = "High Score: " + highscore;
    }
}

function resetList() {
    document.getElementById("word-list").innerHTML = "";
    document.getElementById("score-list").innerHTML = "";
    wordlist.clear();
}

//function checks if word is valid, if it starts with current letter, and if it has already been used
function checkWord(word) {
    // fetch("https://api.dictionaryapi.dev/api/v2/entries/en/" + word)
    //     .then(response => {
    //         if (!response.ok) {
    //             throw new Error("Invalid Word");
    //         }
    //         else {
                if (wordSet.has(word.toLowerCase()) && word.charAt(0).toUpperCase() == currentLetter && !wordlist.has(word.toLowerCase())) {
                    wordlist.add(word.toLowerCase());
                    score += word.length*100;
                    updateScore();
                    document.getElementById("result").textContent = word.toUpperCase() +" +" + word.length*100 + " points";
                    document.getElementById("word-list").innerHTML += "<li>" + word.toUpperCase() + "</li>";
                    document.getElementById("score-list").innerHTML += "<li>+" + word.length*100 + "</li>";
            }
            else if (!wordSet.has(word.toLowerCase())) {
                document.getElementById("result").textContent = "Invalid Word";
            }

            else if (word.charAt(0).toUpperCase() != currentLetter) {
                document.getElementById("result").textContent = "Word does not start with " + currentLetter;
            }

            else {
                document.getElementById("result").textContent = "Word already used";
            }
    //     }
    // })
    // .catch(error => {
    //     document.getElementById("result").textContent = "Invalid Word";
    // });

    }