let pictures = [
    "Image/boots.jpg",
    "Image/HandShaking.jpg",
    "Image/FootballTraining.jpg",
    "Image/Trophy.jpg",
    "Image/warmup.jpg",
    "Image/bottle.jpg",

    "Image/boots.jpg",
    "Image/HandShaking.jpg",
    "Image/FootballTraining.jpg",
    "Image/Trophy.jpg",
    "Image/warmup.jpg",
    "Image/bottle.jpg",
];

pictures.sort(() => Math.random() - 0.5);

let board = document.getElementById("gameBoard");
let firstCard = null;
let secondCard = null;
let score = 0;
let matched = 0;
let lockBoard = false; 

for (let i = 0; i < pictures.length; i++) {
    board.innerHTML +=
        "<div class='card' onclick='flipCard(this," + i + ")'>" +
            "<div class='card-inner'>" +
                "<div class='card-front'><img src='Image/clubIcon.png'></div>" +
                "<div class='card-back'><img src='" + pictures[i] + "'></div>" +
            "</div>" +
        "</div>";
}

function flipCard(card, index) {
    if (lockBoard) return;
    if (card === firstCard) return;

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

        document.getElementById("score").textContent = score;

        firstCard.onclick = null;
        secondCard.onclick = null;

        firstCard.classList.add("matched");
        secondCard.classList.add("matched");

        resetTurn();

        if (matched === 6) {
            document.getElementById("message").textContent = "Victory!";
            
        }
    } else {
        setTimeout(function () {
            firstCard.classList.remove("flipped");
            secondCard.classList.remove("flipped");
            resetTurn();
        }, 1000);
    }
}

function resetTurn() {
    firstCard = null;
    secondCard = null;
    lockBoard = false;
}

let time = 60;

let countdown = setInterval(function () {
    time--;
    document.getElementById("timer").textContent = time;

    if (time === 0) {
        clearInterval(countdown);
        document.getElementById("message").textContent = "Game Over";

        let cards = document.getElementsByClassName("card");
        for (let i = 0; i < cards.length; i++) {
            cards[i].onclick = null;
        }
    }
}, 1000);