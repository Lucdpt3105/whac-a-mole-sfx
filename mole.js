let currMoleTile;
let currPlantTile;
let score = 0;
let gameOver = false;
let moleInterval;
let plantInterval;
let musicStarted = false;

// Đặt các file hiệu ứng của bạn trong thư mục sounds/ với đúng tên bên dưới.
// Game vẫn chạy bình thường nếu một file chưa được thêm.
const soundEffects = {
    moleHit: new Audio("sounds/mole-hit.mp3"),
    wrongHit: new Audio("sounds/wrong-hit.mp3"),
    gameOver: new Audio("sounds/game-over.mp3"),
    restart: new Audio("sounds/restart.mp3"),
};

window.addEventListener("DOMContentLoaded", setGame);

function setGame() {
    const board = document.getElementById("board");
    for (let i = 0; i < 9; i++) {
        let tile = document.createElement("button");
        tile.id = i.toString();
        tile.type = "button";
        tile.className = "tile";
        tile.setAttribute("role", "gridcell");
        tile.setAttribute("aria-label", `Ô ${i + 1}`);
        tile.addEventListener("click", selectTile);
        board.appendChild(tile);
    }
    document.getElementById("restart-button").addEventListener("click", restartGame);
    document.getElementById("music-button").addEventListener("click", toggleMusic);
    document.addEventListener("pointerdown", startMusicOnce, { once: true });
    startRound();
}

function startRound() {
    clearInterval(moleInterval);
    clearInterval(plantInterval);
    moleInterval = setInterval(setMole, 1000);
    plantInterval = setInterval(setPlant, 2000);
    setMole();
    setPlant();
}

function restartGame() {
    score = 0;
    gameOver = false;
    currMoleTile = null;
    currPlantTile = null;
    document.getElementById("score").innerText = "Điểm: 0";
    document.querySelectorAll(".tile").forEach((tile) => tile.replaceChildren());
    playSound("restart",1.0);
    startMusicOnce();
    startRound();
}

function getRandomTile() {
    //math.random --> 0-1 --> (0-1) * 9 = (0-9) --> round down to (0-8) integers
    let num = Math.floor(Math.random() * 9);
    return num.toString();
}

function setMole() {
    if (gameOver) {
        return;
    }
    if (currMoleTile) currMoleTile.replaceChildren();
    let num = getRandomTile();
    if (currPlantTile && currPlantTile.id == num) return;
    let mole = document.createElement("img");
    mole.src = "./monty-mole.png";
    mole.alt = "Chuột chũi";
    currMoleTile = document.getElementById(num);
    currMoleTile.appendChild(mole);
}

function setPlant() {
    if (gameOver) {
        return;
    }
    if (currPlantTile) currPlantTile.replaceChildren();
    let num = getRandomTile();
    if (currMoleTile && currMoleTile.id == num) return;
    let plant = document.createElement("img");
    plant.src = "./piranha-plant.png";
    plant.alt = "Cây ăn thịt";
    currPlantTile = document.getElementById(num);
    currPlantTile.appendChild(plant);
}

function selectTile() {
    if (gameOver) {
        return;
    }
    startMusicOnce();
    if (this == currMoleTile) {
        score += 10;
        document.getElementById("score").innerText = `Điểm: ${score}`;
        playSound("moleHit",1.0);
    }
    else if (this == currPlantTile) {
        gameOver = true;
        clearInterval(moleInterval);
        clearInterval(plantInterval);
        document.getElementById("score").innerText = `GAME OVER — Điểm: ${score}`;
        playSound("gameOver", 1.0);
    } else {
        playSound("wrongHit", 1.0);
    }
}

function playSound(name, volume = 1.0) {
    const sound = soundEffects[name];
    if (!sound) return;
    sound.currentTime = 0;
    sound.volume = volume;
    sound.play().catch(() => {});
}

function startMusicOnce() {
    const music = document.getElementById("theme-music");
    if (!musicStarted && !music.muted) {
        music.volume = 0.5;
        music.play().then(() => { musicStarted = true; }).catch(() => {});
    }
}

function toggleMusic() {
    const music = document.getElementById("theme-music");
    const button = document.getElementById("music-button");
    music.muted = !music.muted;
    button.setAttribute("aria-pressed", String(!music.muted));
    button.innerText = music.muted ? "♪ Nhạc: Tắt" : "♪ Nhạc: Bật";
    if (!music.muted) startMusicOnce();
}
