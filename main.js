const { createClient } = supabase;
// Create a single supabase client for interacting with your database
const supabaseClient = createClient('https://aehuthpdyhmamebxgire.supabase.co/', 'sb_publishable_wQ9xQzL2MWkJ3qiZO-uzPA_9aK3DQA3')

let time = 60;
let timerInterval = null;
let score = 0;
let highscore = 0;
let currentLetter = "";
let wordlist = new Set();
let wordSet = new Set();
let wordListReady = false;

let currentRoom = null;
let playerName = "";
let isHost = false;
let isMultiplayer = false;
let currentRoomCode = "";



// Fetch the word list from the JSON file and store it in a Set for quick lookup
async function fetchWordList() {
    const response = await fetch('words_dictionary.json');
    const data = await response.json();
    wordSet = new Set(Object.keys(data).map(word => word.toLowerCase()));

    wordListReady = true;
}

fetchWordList();

function startTimer() {

    if (timerInterval !== null) {

        if (timerInterval !== null) {
            if (isMultiplayer && isHost) {
                currentRoom.send({
                    type: "broadcast",
                    event: "round-end",
                    payload: {}
                });
            }
        }

        document.getElementById("countdownDisplay").textContent = ""; // Clear the countdown display
        clearInput(); // Clear the input field when the timer ends 
        resetList(); // Clear the word list and score list when the timer ends
        resetGame(); // Reset the game if the timer is already running
        return; // Exit the function if the timer is already running

    }

    if (isMultiplayer && isHost) {
        currentLetter = String.fromCharCode(Math.floor(Math.random() * 26) + 65);
        currentRoom.send({
            type: "broadcast",
            event: "round-start",
            payload: { letter: currentLetter }
        });
        localStartTimer(currentLetter);
    }
    else if (!isMultiplayer) {
        currentLetter = String.fromCharCode(Math.floor(Math.random() * 26) + 65);
        localStartTimer(currentLetter);
    }

}

function localStartTimer(letter) {

    currentLetter = letter;
    document.getElementById("letter").textContent = currentLetter;

    resetList(); // Clear the word list and score list when the timer starts
    timeLeft = time; // Reset the timer to initial time
    updateScore(); // Update the score display when the timer starts
    document.getElementById("start-button").textContent = "End" // Change button text to "End"
    updateTimer();
    document.getElementById("word-input").disabled = false; // Enable the input field when the timer starts
    document.getElementById("word-input").focus(); //focus on input box so you don't need to click it

    timerInterval = setInterval(function () {
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

    if (!wordListReady) return;

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
function localEndRound() {
    document.getElementById("countdownDisplay").textContent = "";
    clearInput();
    resetList();
    resetGame();
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

function singleplayer() {

    isMultiplayer = false;

    document.getElementById("welcome-container").style.display = "none";
    document.getElementById("lobby-container").style.display = "none";
    document.getElementById("game-container").style.display = "";
    document.getElementById("start-button").style.display = "";
}

function createRoom() {
    const roomCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    isHost = true;
    isMultiplayer = true;
    playerName = "Host";
    currentRoomCode = roomCode;

    document.getElementById("lobby-code").textContent = "Room Code: " + roomCode;


    document.getElementById("welcome-container").style.display = "none";
    document.getElementById("game-container").style.display = "";
    document.getElementById("lobby-container").style.display = "";
    document.getElementById("start-button").style.display = ""; // Show the start button for the room creator

    joinChannel(roomCode); // Join the channel with the generated room code
}

function joinRoom() {

    const roomCode = document.getElementById("code-input").value.trim();

    // Validate the room code format (6-digit number)
    if (!/^\d{6}$/.test(roomCode)) {
        document.getElementById("code-error").textContent = "Please enter a valid 6-digit code";
        return;
    }

    isHost = false;
    isMultiplayer = true;
    playerName = "Player" + Math.floor(Math.random() * 1000);
    currentRoomCode = roomCode;
    document.getElementById("code-error").textContent = ""; // Clear any previous error message

    document.getElementById("lobby-code").textContent = "Room Code: " + roomCode;

    document.getElementById("welcome-container").style.display = "none";
    document.getElementById("game-container").style.display = "";
    document.getElementById("lobby-container").style.display = "";
    document.getElementById("start-button").style.display = "none"; // Hide the start button for players who join a room

    joinChannel(roomCode); // Join the channel with the entered room code
}

function joinChannel(roomCode) {
    currentRoom = supabaseClient.channel(`room-${roomCode}`, {
        config: { presence: { key: playerName } }
    });

    currentRoom
        .on("presence", { event: "sync" }, () => {
            updatePlayerList();
        })
        .on("presence", { event: "leave" }, ({ key }) => {
            if (key === "Host" && !isHost) {
                hostDisconnected();
            }
        })
        .on("broadcast", { event: "round-start" }, (payload) => {
            localStartTimer(payload.payload.letter);
        })
        .on("broadcast", { event: "round-end" }, () => {
            localEndRound();
        })
        .subscribe(async (status) => {
            if (status === "SUBSCRIBED") {
                await currentRoom.track({ name: playerName, score: 0 });
            }
        });

}

function hostDisconnected() {
clearInterval(timerInterval);
    timerInterval = null;

    home();
    document.getElementById("code-error").textContent = "Host disconnected";

}
function updatePlayerList() {

    const state = currentRoom.presenceState();
    const players = Object.values(state).flat();
    document.getElementById("player-list").innerHTML = players
        .map(p => `<li>${p.name}   +${p.score}</li>`)
        .join("");
}

function home() {

    if (currentRoom) {
        currentRoom.unsubscribe();
        currentRoom = null;
    }

    document.getElementById("welcome-container").style.display = "";
    document.getElementById("game-container").style.display = "none";
    document.getElementById("lobby-container").style.display = "none";
}

//function checks if word is valid, if it starts with current letter, and if it has already been used
function checkWord(word) {

    //check if word is valid and not already used, if so add to wordlist and update score
    if (wordSet.has(word.toLowerCase()) && word.charAt(0).toUpperCase() == currentLetter && !wordlist.has(word.toLowerCase())) {
        wordlist.add(word.toLowerCase());
        score += word.length * 100;
        updateScore();
        document.getElementById("result").textContent = word.toUpperCase() + " +" + word.length * 100 + " points";
        document.getElementById("word-list").innerHTML += "<li>" + word.toUpperCase() + "</li>";
        document.getElementById("score-list").innerHTML += "<li>+" + word.length * 100 + "</li>";
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


}