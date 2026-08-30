let currMoleTile;
let currPlantTile;
let score = 0;
let gameOver = false;
let moleInterval;
let plantInterval;
let musicStarted = false;
const audioSettings = { system: true, sfx: true, music: true, systemVolume: 0.55, sfxVolume: 1, musicVolume: 0.5 };

// Đặt các file hiệu ứng của bạn trong thư mục sounds/ với đúng tên bên dưới.
// Game vẫn chạy bình thường nếu một file chưa được thêm.
const soundEffects = {
    moleHit: new Audio("sounds/mole-hit.mp3"),
    wrongHit: new Audio("sounds/wrong-hit.mp3"),
    gameOver: new Audio("sounds/game-over.mp3"),
    restart: new Audio("sounds/restart.mp3"),
    click: new Audio("sounds/clicking-sound.mp3"),
    uiClick: new Audio("sounds/ui-click.ogg"),
    uiSwitch: new Audio("sounds/ui-switch.ogg"),
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
    document.getElementById("settings-button").addEventListener("click", openSoundSettings);
    document.getElementById("close-settings-button").addEventListener("click", () => playUiSound("uiClick"));
    document.getElementById("sound-settings").addEventListener("close", () => {
        document.getElementById("settings-button").setAttribute("aria-expanded", "false");
    });
    document.querySelectorAll(".sound-volume").forEach((slider) => {
        slider.addEventListener("input", updateAudioSettings);
        slider.addEventListener("change", () => playUiSound("uiClick"));
    });
    ["system-sound-toggle", "sfx-sound-toggle", "music-sound-toggle"].forEach((id) => {
        document.getElementById(id).addEventListener("change", () => {
            updateAudioSettings();
            playUiSound("uiSwitch");
        });
    });
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
    document.getElementById("score").innerText = "Score: 0";
    document.querySelectorAll(".tile").forEach((tile) => tile.replaceChildren());
    playSystemSound();
    playSound("restart", 1.0);
    applyMusicState();
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
    mole.src = "./asset/monty-mole.webp";
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
    plant.src = "./asset/piranha-plant.webp";
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
        document.getElementById("score").innerText = `Score: ${score}`;
        playSound("moleHit", 1.0);
    }
    else if (this == currPlantTile) {
        gameOver = true;
        clearInterval(moleInterval);
        clearInterval(plantInterval);
        document.getElementById("score").innerText = `GAME OVER — Score: ${score}`;
        playSound("gameOver", 1.0);
        // Nhạc được tắt trong lúc thua; chơi lại sẽ tự bật nếu người chơi chưa tắt nhạc trong cài đặt.
        document.getElementById("theme-music").pause();
    } else {
        playSound("wrongHit", 1.0);
    }
}

function playSound(name, volume = 1.0) {
    if (!audioSettings.sfx) return;
    const sound = soundEffects[name];
    if (!sound) return;
    const instance = sound.cloneNode();
    instance.volume = volume * audioSettings.sfxVolume;
    instance.play().catch(() => {});
}

function playSystemSound() {
    if (!audioSettings.system) return;
    const instance = soundEffects.click.cloneNode();
    instance.volume = audioSettings.systemVolume;
    instance.play().catch(() => {});
}

function playUiSound(name) {
    if (!audioSettings.system) return;
    const sound = soundEffects[name];
    if (!sound) return;
    const instance = sound.cloneNode();
    instance.volume = audioSettings.systemVolume;
    instance.play().catch(() => {});
}

function startMusicOnce() {
    const music = document.getElementById("theme-music");
    if (!musicStarted && audioSettings.music && !music.muted && !gameOver) {
        music.volume = audioSettings.musicVolume;
        music.play().then(() => { musicStarted = true; }).catch(() => {});
    }
}

function toggleMusic() {
    audioSettings.music = !audioSettings.music;
    document.getElementById("music-sound-toggle").checked = audioSettings.music;
    playSystemSound();
    applyMusicState();
}

function openSoundSettings() {
    const dialog = document.getElementById("sound-settings");
    if (!dialog.open) dialog.showModal();
    document.getElementById("settings-button").setAttribute("aria-expanded", "true");
    playUiSound("uiClick");
}

function updateAudioSettings() {
    audioSettings.system = document.getElementById("system-sound-toggle").checked;
    audioSettings.sfx = document.getElementById("sfx-sound-toggle").checked;
    audioSettings.music = document.getElementById("music-sound-toggle").checked;
    audioSettings.systemVolume = getVolume("system");
    audioSettings.sfxVolume = getVolume("sfx");
    audioSettings.musicVolume = getVolume("music");
    applyMusicState();
}

function getVolume(channel) {
    const slider = document.getElementById(`${channel}-sound-volume`);
    const value = Number(slider.value);
    document.getElementById(`${channel}-sound-volume-value`).value = `${value}%`;
    return value / 100;
}

function applyMusicState() {
    const music = document.getElementById("theme-music");
    const button = document.getElementById("music-button");
    const enabled = audioSettings.music;
    music.muted = !enabled;
    music.volume = audioSettings.musicVolume;
    button.classList.toggle("is-muted", !enabled);
    button.setAttribute("aria-pressed", String(enabled));
    button.setAttribute("aria-label", enabled ? "Tắt nhạc nền" : "Bật nhạc nền");
    if (enabled && !gameOver) startMusicOnce();
    if (!enabled) music.pause();
    if (enabled && musicStarted && !gameOver) music.play().catch(() => {});
}
