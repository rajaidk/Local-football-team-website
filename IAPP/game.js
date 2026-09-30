const cardImages = [
    "Image/boots.jpg",
    "Image/HandShaking.jpg",
    "Image/FootballTraining.jpg",
    "Image/Trophy.jpg",
    "Image/warmup.jpg",
    "Image/bottle.jpg"
];

let pictures = [];
let firstCard = null;
let secondCard = null;
let score = 0;
let matched = 0;
let lockBoard = false;
let countdown = null;
let time = 60;

function initGame() {
    if (countdown) {
        clearInterval(countdown);
    }

    firstCard = null;
    secondCard = null;
    score = 0;
    matched = 0;
    lockBoard = false;
    time = 60;

    const scoreEl = document.getElementById("score");
    const timerEl = document.getElementById("timer");
    const messageEl = document.getElementById("message");
    const board = document.getElementById("gameBoard");

    if (scoreEl) scoreEl.textContent = score;
    if (timerEl) timerEl.textContent = time;
    if (messageEl) messageEl.textContent = "";

    pictures = [...cardImages, ...cardImages];
    pictures.sort(() => Math.random() - 0.5);

    if (board) {
        board.innerHTML = "";
        for (let i = 0; i < pictures.length; i++) {
            board.innerHTML +=
                "<div class='card' onclick='flipCard(this," + i + ")'>" +
                    "<div class='card-inner'>" +
                        "<div class='card-front'><img src='Image/clubicon.png' alt='Card back'></div>" +
                        "<div class='card-back'><img src='" + pictures[i] + "' alt='Card picture'></div>" +
                    "</div>" +
                "</div>";
        }
    }

    startTimer();
}

function startTimer() {
    countdown = setInterval(function () {
        time--;
        const timerEl = document.getElementById("timer");
        if (timerEl) timerEl.textContent = time;

        if (time <= 0) {
            clearInterval(countdown);
            const msgEl = document.getElementById("message");
            if (msgEl) msgEl.textContent = "Game Over! Try again!";

            let cards = document.getElementsByClassName("card");
            for (let i = 0; i < cards.length; i++) {
                cards[i].onclick = null;
            }
        }
    }, 1000);
}

function flipCard(card, index) {
    if (lockBoard) return;
    if (card === firstCard) return;
    if (card.classList.contains("matched")) return;

    card.classList.add("flipped");
    card.dataset.image = pictures[index];

    if (firstCard == null) {
        firstCard = card;
        return;
    }

    secondCard = card;
    lockBoard = true;
    checkMatch();
}

function checkMatch() {
    const isMatch = firstCard.dataset.image === secondCard.dataset.image;

    if (isMatch) {
        score += 10;
        matched++;

        const scoreEl = document.getElementById("score");
        if (scoreEl) scoreEl.textContent = score;

        firstCard.onclick = null;
        secondCard.onclick = null;

        firstCard.classList.add("matched");
        secondCard.classList.add("matched");

        resetTurn();

        if (matched === cardImages.length) {
            clearInterval(countdown);
            const msgEl = document.getElementById("message");
            if (msgEl) msgEl.textContent = "🎉 Victory! You matched all pairs!";
        }
    } else {
        setTimeout(function () {
            if (firstCard) firstCard.classList.remove("flipped");
            if (secondCard) secondCard.classList.remove("flipped");
            resetTurn();
        }, 1000);
    }
}

function resetTurn() {
    firstCard = null;
    secondCard = null;
    lockBoard = false;
}

document.addEventListener("DOMContentLoaded", () => {
    initGame();
});
