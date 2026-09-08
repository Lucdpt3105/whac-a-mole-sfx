let currMoleTile = null, plantTiles = new Set(), score = 0, gameOver = false, gamePaused = false;
let moleTimeout, plantTimeout, questionTimer, activeQuestion = null, questionTile = null, musicStarted = false, questions = [];
const QUESTION_SPAWN_CHANCE = 20; // Tỉ lệ 20%: random trong khoảng 0–20 trên thang 0–100.
const LEVELS = [
    { minScore: 0, moleDelay: 1000, plantDelay: 2300, plantCount: 1 },
    { minScore: 80, moleDelay: 850, plantDelay: 1900, plantCount: 2 },
    { minScore: 180, moleDelay: 700, plantDelay: 1600, plantCount: 3 },
    { minScore: 320, moleDelay: 570, plantDelay: 1350, plantCount: 4 },
];
const difficultyLabels = { easy: "Dễ", medium: "Trung bình", hard: "Khó" };
const audioSettings = { system: true, sfx: true, music: true, systemVolume: .55, sfxVolume: 1, musicVolume: .5 };
const soundEffects = { moleHit: new Audio("sounds/mole-hit.mp3"), wrongHit: new Audio("sounds/wrong-hit.mp3"), gameOver: new Audio("sounds/game-over.mp3"), restart: new Audio("sounds/restart.mp3"), click: new Audio("sounds/clicking-sound.mp3"), uiClick: new Audio("sounds/ui-click.ogg"), uiSwitch: new Audio("sounds/ui-switch.ogg") };

window.addEventListener("DOMContentLoaded", setGame);

async function setGame() {
    const board = document.getElementById("board");
    for (let i = 0; i < 9; i += 1) {
        const tile = document.createElement("button");
        tile.id = String(i); tile.type = "button"; tile.className = "tile";
        tile.setAttribute("role", "gridcell"); tile.setAttribute("aria-label", `Ô ${i + 1}`);
        tile.addEventListener("click", selectTile); board.appendChild(tile);
    }
    bindControls(); questions = await loadQuestions();
    document.addEventListener("pointerdown", startMusicOnce, { once: true }); startRound();
}

function bindControls() {
    document.getElementById("restart-button").addEventListener("click", restartGame);
    document.getElementById("music-button").addEventListener("click", toggleMusic);
    document.getElementById("settings-button").addEventListener("click", openSoundSettings);
    document.getElementById("close-settings-button").addEventListener("click", () => playUiSound("uiClick"));
    document.getElementById("sound-settings").addEventListener("close", () => document.getElementById("settings-button").setAttribute("aria-expanded", "false"));
    document.getElementById("question-dialog").addEventListener("cancel", (event) => event.preventDefault());
    document.querySelectorAll(".sound-volume").forEach((slider) => { slider.addEventListener("input", updateAudioSettings); slider.addEventListener("change", () => playUiSound("uiClick")); });
    ["system-sound-toggle", "sfx-sound-toggle", "music-sound-toggle"].forEach((id) => document.getElementById(id).addEventListener("change", () => { updateAudioSettings(); playUiSound("uiSwitch"); }));
}

async function loadQuestions() {
    try { const response = await fetch("./questions.json"); if (!response.ok) throw new Error(); const data = await response.json(); return Array.isArray(data.questions) ? data.questions : []; }
    catch { console.warn("Không tải được questions.json; game tiếp tục không có câu hỏi."); return []; }
}

function getLevel() { return LEVELS.reduce((current, level, index) => score >= level.minScore ? { ...level, number: index + 1 } : current, { ...LEVELS[0], number: 1 }); }
function updateStatus() { const level = getLevel(); document.getElementById("score").textContent = `Score: ${score}`; document.getElementById("level").textContent = `Cấp độ: ${level.number}`; }
function stopSpawning() { clearTimeout(moleTimeout); clearTimeout(plantTimeout); }
function startRound() { stopSpawning(); if (!gameOver && !gamePaused) { scheduleMole(); schedulePlants(); } }
function scheduleMole() { if (gameOver || gamePaused) return; setMole(); moleTimeout = setTimeout(scheduleMole, getLevel().moleDelay); }
function schedulePlants() { if (gameOver || gamePaused) return; setPlants(); plantTimeout = setTimeout(schedulePlants, getLevel().plantDelay); }

function restartGame() {
    score = 0; gameOver = false; gamePaused = false; activeQuestion = null; questionTile = null; clearInterval(questionTimer);
    const dialog = document.getElementById("question-dialog"); if (dialog.open) dialog.close(); clearBoard(); updateStatus();
    playSystemSound(); playSound("restart"); applyMusicState(); startMusicOnce(); startRound();
}
function clearBoard() { currMoleTile = null; plantTiles = new Set(); document.querySelectorAll(".tile").forEach((tile) => { tile.replaceChildren(); tile.classList.remove("question-mole"); }); }
function getRandomFreeTile(excluded = new Set()) { const tiles = [...document.querySelectorAll(".tile")].filter((tile) => !excluded.has(tile)); return tiles.length ? tiles[Math.floor(Math.random() * tiles.length)] : null; }
function clearTile(tile) { tile.replaceChildren(); tile.classList.remove("question-mole"); if (tile === currMoleTile) currMoleTile = null; if (tile === questionTile) questionTile = null; }

function setMole() {
    if (gameOver || gamePaused || questionTile) return;
    if (currMoleTile) clearTile(currMoleTile);
    const tile = getRandomFreeTile(plantTiles); if (!tile) return;
    const mole = document.createElement("img"); mole.src = "./asset/monty-mole.webp"; mole.alt = "Chuột chũi"; tile.appendChild(mole); currMoleTile = tile;
    if (questions.length && Math.random() * 100 < QUESTION_SPAWN_CHANCE) { questionTile = tile; tile.classList.add("question-mole"); tile.setAttribute("aria-label", `Chuột thử thách ở ô ${Number(tile.id) + 1}`); }
}
function setPlants() {
    if (gameOver || gamePaused) return;
    plantTiles.forEach(clearTile); plantTiles = new Set();
    const unavailable = new Set(currMoleTile ? [currMoleTile] : []);
    for (let i = 0; i < getLevel().plantCount; i += 1) {
        const tile = getRandomFreeTile(unavailable); if (!tile) break;
        const plant = document.createElement("img"); plant.src = "./asset/piranha-plant.webp"; plant.alt = "Cây ăn thịt"; tile.appendChild(plant); plantTiles.add(tile); unavailable.add(tile);
    }
}

function selectTile() {
    if (gameOver || gamePaused) return; startMusicOnce();
    if (this === questionTile) openQuestion();
    else if (this === currMoleTile) { score += 10; clearTile(this); updateStatus(); playSound("moleHit"); }
    else if (plantTiles.has(this)) endGame();
    else playSound("wrongHit");
}

function openQuestion() {
    activeQuestion = questions[Math.floor(Math.random() * questions.length)]; gamePaused = true; stopSpawning();
    const dialog = document.getElementById("question-dialog"), form = document.getElementById("question-form");
    document.getElementById("question-text").textContent = activeQuestion.question;
    document.getElementById("question-difficulty").textContent = `${difficultyLabels[activeQuestion.difficulty] || activeQuestion.difficulty} · +${activeQuestion.points} điểm`;
    const feedback = document.getElementById("question-feedback"); feedback.textContent = ""; feedback.className = "question-feedback";
    form.replaceChildren(...activeQuestion.choices.map((choice) => { const button = document.createElement("button"); button.type = "button"; button.className = "question-option"; button.textContent = choice.text; button.addEventListener("click", () => answerQuestion(choice.id)); return button; }));
    let seconds = 10; document.getElementById("question-timer").textContent = `${seconds}s`; dialog.showModal();
    questionTimer = setInterval(() => { seconds -= 1; document.getElementById("question-timer").textContent = `${seconds}s`; if (seconds <= 0) resolveQuestion(false, "Hết giờ — lần này chưa có điểm."); }, 1000);
}
function answerQuestion(answerId) { if (activeQuestion) resolveQuestion(answerId === activeQuestion.correctAnswer, answerId === activeQuestion.correctAnswer ? `Chính xác! +${activeQuestion.points} điểm.` : "Chưa đúng — lần này chưa có điểm."); }
function resolveQuestion(correct, message) {
    if (!activeQuestion) return; clearInterval(questionTimer); document.querySelectorAll(".question-option").forEach((button) => { button.disabled = true; });
    const feedback = document.getElementById("question-feedback"); feedback.textContent = message; feedback.className = `question-feedback ${correct ? "is-success" : "is-error"}`;
    if (correct) { score += activeQuestion.points; playSound("moleHit"); } else playSound("wrongHit"); updateStatus(); window.setTimeout(closeQuestionAndResume, 850);
}
function closeQuestionAndResume() { const dialog = document.getElementById("question-dialog"); if (dialog.open) dialog.close(); if (questionTile) clearTile(questionTile); activeQuestion = null; gamePaused = false; if (!gameOver) startRound(); }
function endGame() { gameOver = true; stopSpawning(); document.getElementById("score").textContent = `GAME OVER — Score: ${score}`; playSound("gameOver"); document.getElementById("theme-music").pause(); }

function playSound(name, volume = 1) { if (!audioSettings.sfx || !soundEffects[name]) return; const instance = soundEffects[name].cloneNode(); instance.volume = volume * audioSettings.sfxVolume; instance.play().catch(() => {}); }
function playSystemSound() { if (!audioSettings.system) return; const instance = soundEffects.click.cloneNode(); instance.volume = audioSettings.systemVolume; instance.play().catch(() => {}); }
function playUiSound(name) { if (!audioSettings.system || !soundEffects[name]) return; const instance = soundEffects[name].cloneNode(); instance.volume = audioSettings.systemVolume; instance.play().catch(() => {}); }
function startMusicOnce() { const music = document.getElementById("theme-music"); if (!musicStarted && audioSettings.music && !music.muted && !gameOver) music.play().then(() => { musicStarted = true; }).catch(() => {}); }
function toggleMusic() { audioSettings.music = !audioSettings.music; document.getElementById("music-sound-toggle").checked = audioSettings.music; playSystemSound(); applyMusicState(); }
function openSoundSettings() { const dialog = document.getElementById("sound-settings"); if (!dialog.open) dialog.showModal(); document.getElementById("settings-button").setAttribute("aria-expanded", "true"); playUiSound("uiClick"); }
function updateAudioSettings() { audioSettings.system = document.getElementById("system-sound-toggle").checked; audioSettings.sfx = document.getElementById("sfx-sound-toggle").checked; audioSettings.music = document.getElementById("music-sound-toggle").checked; audioSettings.systemVolume = getVolume("system"); audioSettings.sfxVolume = getVolume("sfx"); audioSettings.musicVolume = getVolume("music"); applyMusicState(); }
function getVolume(channel) { const slider = document.getElementById(`${channel}-sound-volume`), value = Number(slider.value); document.getElementById(`${channel}-sound-volume-value`).value = `${value}%`; return value / 100; }
function applyMusicState() { const music = document.getElementById("theme-music"), button = document.getElementById("music-button"); music.muted = !audioSettings.music; music.volume = audioSettings.musicVolume; button.classList.toggle("is-muted", !audioSettings.music); button.setAttribute("aria-pressed", String(audioSettings.music)); button.setAttribute("aria-label", audioSettings.music ? "Tắt nhạc nền" : "Bật nhạc nền"); if (audioSettings.music && !gameOver) startMusicOnce(); if (!audioSettings.music) music.pause(); if (audioSettings.music && musicStarted && !gameOver) music.play().catch(() => {}); }
