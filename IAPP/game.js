import { auth, recordGameScore, getTopGameScores } from './firebase-service.js';

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

export async function refreshLeaderboard() {
    const list = document.getElementById("leaderboardList");
    if (!list) return;

    try {
        const topScores = await getTopGameScores('memory', 5);
        if (topScores && topScores.length > 0) {
            list.innerHTML = topScores.map((s, idx) => `
                <li>
                    <strong>${s.displayName || 'Player'}</strong>: ${s.score} pts
                    <span style="font-size: 12px; color: #666; margin-left: 8px;">(${s.timeRemaining}s left)</span>
                </li>
            `).join('');
        } else {
            list.innerHTML = `<li>No scores recorded yet. Be the first!</li>`;
        }
    } catch (err) {
        console.error("Could not fetch leaderboard:", err);
        list.innerHTML = `<li>Sign in to see and record high scores.</li>`;
    }
}

export function initGame() {
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
                "<div class='card' data-idx='" + i + "'>" +
                    "<div class='card-inner'>" +
                        "<div class='card-front'><img src='Image/clubicon.png' alt='Card back'></div>" +
                        "<div class='card-back'><img src='" + pictures[i] + "' alt='Card picture'></div>" +
                    "</div>" +
                "</div>";
        }

        // Attach event listeners cleanly
        board.querySelectorAll('.card').forEach((cardEl) => {
            cardEl.addEventListener('click', () => {
                const idx = parseInt(cardEl.getAttribute('data-idx'), 10);
                flipCard(cardEl, idx);
            });
        });
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

async function checkMatch() {
    const isMatch = firstCard.dataset.image === secondCard.dataset.image;

    if (isMatch) {
        score += 10;
        matched++;

        const scoreEl = document.getElementById("score");
        if (scoreEl) scoreEl.textContent = score;

        firstCard.classList.add("matched");
        secondCard.classList.add("matched");

        resetTurn();

        if (matched === cardImages.length) {
            clearInterval(countdown);
            const totalScore = score + (time * 2);
            const msgEl = document.getElementById("message");
            if (msgEl) {
                msgEl.textContent = `🎉 Victory! Final Score: ${totalScore} (Includes time bonus!)`;
            }

            if (auth.currentUser) {
                try {
                    await recordGameScore({
                        gameType: 'memory',
                        score: totalScore,
                        attempts: 0,
                        timeRemaining: time
                    });
                    await refreshLeaderboard();
                } catch (err) {
                    console.error("Score recording failed:", err);
                }
            } else {
                if (msgEl) {
                    msgEl.textContent += " — Sign in with Google to save your score!";
                }
            }
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

// Bind to window for Play Again button
window.initGame = initGame;

document.addEventListener("DOMContentLoaded", () => {
    initGame();
    refreshLeaderboard();
});

window.addEventListener('clubUserAuthChanged', (e) => {
    const note = document.getElementById('authLeaderboardNote');
    if (note) {
        if (e.detail?.user) {
            note.textContent = `Signed in as ${e.detail.user.displayName || e.detail.user.email}. Your winning scores will be recorded automatically!`;
        } else {
            note.textContent = `Sign in with Google to record your scores to the club leaderboard!`;
        }
    }
    refreshLeaderboard();
});
