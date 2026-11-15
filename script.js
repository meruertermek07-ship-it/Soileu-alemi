// ======================================================
// СӨЙЛЕУ ӘЛЕМІНЕ САЯХАТ
// Негізгі JavaScript бағдарламасы
// ======================================================

“use strict”;

// ——————————————————
// 1. НЕГІЗГІ ДЕРЕКТЕР
// ——————————————————

const SOUND_KEYS = Array.isArray(window.SOUND_ORDER)
? window.SOUND_ORDER.map(item =>
typeof item === “string” ? item : item.key || item.id
).filter(Boolean)
: [“R”, “L”, “G”, “GH”, “K”, “Q”, “SH”, “ZH”, “Z”, “S”];

const STAGE_TITLES = [
“Дайындық кезеңі”,
“Дыбысты қою кезеңі”,
“Автоматтандыру кезеңі”,
“Дифференциация кезеңі”
];

const STORAGE_KEY = “soileuSayahatyProgress”;

let currentSound = null;
let currentStage = 0;
let currentTaskIndex = 0;
let selectedScore = null;

let currentRelaxationIndex = 0;
let currentMotorGame = null;

let cameraStream = null;
let microphoneStream = null;
let microphoneAnimation = null;

let progressData = loadProgress();

// ——————————————————
// 2. HTML ЭЛЕМЕНТТЕРІ
// ——————————————————

const $ = id => document.getElementById(id);

function showPage(pageId) {
document.querySelectorAll(”.page”).forEach(page => {
page.classList.remove(“active”);
});

const page = $(pageId);
if (page) {
    page.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

}

function setText(id, value) {
const element = $(id);
if (element) element.textContent = value ?? “”;
}

function setHTML(id, value) {
const element = $(id);
if (element) element.innerHTML = value ?? “”;
}

// ——————————————————
// 3. ДЕРЕКТЕРДІ САҚТАУ
// ——————————————————

function loadProgress() {
try {
return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
} catch (error) {
console.warn(“Прогресс деректерін оқу мүмкін болмады:”, error);
return {};
}
}

function saveProgress() {
try {
localStorage.setItem(STORAGE_KEY, JSON.stringify(progressData));
} catch (error) {
console.warn(“Прогресті сақтау мүмкін болмады:”, error);
}
}

function getProgressKey(sound, stage, task) {
return ${sound}_${stage}_${task};
}

function getSavedScore(sound, stage, task) {
return progressData[getProgressKey(sound, stage, task)] ?? null;
}

function saveScore(sound, stage, task, score) {
progressData[getProgressKey(sound, stage, task)] = score;
saveProgress();
}

// ——————————————————
// 4. DATA.JS ҚҰРЫЛЫМЫН АЛУ
// ——————————————————

function getSoundData(soundKey) {
if (!window.speechTasks) return null;
return window.speechTasks[soundKey] || null;
}

function getStages(soundKey) {
const sound = getSoundData(soundKey);

if (!sound || !Array.isArray(sound.stages)) {
    return [];
}
return sound.stages;

}

function getTasks(soundKey, stageIndex) {
const stages = getStages(soundKey);
const stage = stages[stageIndex];

if (!stage || !Array.isArray(stage.tasks)) {
    return [];
}
return stage.tasks;

}

function getTotalTasks() {
let total = 0;

SOUND_KEYS.forEach(soundKey => {
    getStages(soundKey).forEach(stage => {
        total += Array.isArray(stage.tasks) ? stage.tasks.length : 0;
    });
});
return total;

}

// ——————————————————
// 5. БАСТАПҚЫ ЖҮКТЕУ
// ——————————————————

document.addEventListener(“DOMContentLoaded”, initializeProgram);

function initializeProgram() {
if (!window.speechTasks) {
alert(
“data.js файлы жүктелмеді. “ +
“index.html ішінде алдымен data.js, содан кейін script.js тұрғанын тексер.”
);
return;
}

validateData();
$("startJourneyButton")?.addEventListener("click", startJourney);
$("backToHomeButton")?.addEventListener("click", () => {
    stopCamera();
    stopMicrophone();
    showPage("homePage");
});
$("backToSoundsButton")?.addEventListener("click", () => {
    stopCamera();
    stopMicrophone();
    renderSoundMenu();
    showPage("soundPage");
});
$("backToStagesButton")?.addEventListener("click", () => {
    stopCamera();
    stopMicrophone();
    renderStages();
    showPage("stagePage");
});
$("completeTaskButton")?.addEventListener("click", completeTask);
$("nextTaskButton")?.addEventListener("click", nextTask);
$("previousTaskButton")?.addEventListener("click", previousTask);
$("openAssessmentButton")?.addEventListener("click", () => {
    showPage("assessmentPage");
});
$("assessmentButton")?.addEventListener("click", () => {
    showPage("taskPage");
});
$("backFromAssessmentButton")?.addEventListener("click", () => {
    showPage("taskPage");
});
$("openRelaxationButton")?.addEventListener("click", openRelaxation);
$("backFromRelaxationButton")?.addEventListener("click", () => {
    showPage("taskPage");
});
$("nextRelaxationButton")?.addEventListener("click", nextRelaxation);
$("openMotorButton")?.addEventListener("click", openMotor);
$("backFromMotorButton")?.addEventListener("click", () => {
    showPage("taskPage");
});
$("diplomaButton")?.addEventListener("click", openDiploma);
$("backToSoundsFromDiplomaButton")?.addEventListener("click", () => {
    renderSoundMenu();
    showPage("soundPage");
});
$("printDiplomaButton")?.addEventListener("click", () => {
    window.print();
});
$("cameraButton")?.addEventListener("click", toggleCamera);
$("microphoneButton")?.addEventListener("click", toggleMicrophone);
document.querySelectorAll(".score-button").forEach(button => {
    button.addEventListener("click", () => {
        selectScore(Number(button.dataset.score));
    });
});
document.querySelectorAll(".motor-game-card").forEach(button => {
    button.addEventListener("click", () => {
        startMotorGame(button.dataset.game);
    });
});
showPage("homePage");

}

// ——————————————————
// 6. DATA.JS ТЕКСЕРУ
// ——————————————————

function validateData() {
console.log(“СӨЙЛЕУ ӘЛЕМІНЕ САЯХАТ — деректерді тексеру”);

SOUND_KEYS.forEach(soundKey => {
    const stages = getStages(soundKey);
    if (stages.length !== 4) {
        console.warn(
            `${soundKey}: 4 кезең болуы керек. Қазір: ${stages.length}`
        );
    }
    stages.forEach((stage, index) => {
        const count = Array.isArray(stage.tasks)
            ? stage.tasks.length
            : 0;
        if (count !== 10) {
            console.warn(
                `${soundKey}, ${index + 1}-кезең: 10 тапсырма болуы керек. Қазір: ${count}`
            );
        }
    });
});
console.log("Деректердегі тапсырмалардың жалпы саны:", getTotalTasks());

}

// ——————————————————
// 7. САЯХАТТЫ БАСТАУ
// ——————————————————

function startJourney() {
renderSoundMenu();
showPage(“soundPage”);
}

// ——————————————————
// 8. ДЫБЫСТАР МӘЗІРІ
// ——————————————————

function renderSoundMenu() {
const container = $(“soundMenu”);
if (!container) return;

container.innerHTML = "";
const soundNames = {
    R: "Р",
    L: "Л",
    G: "Г",
    GH: "Ғ",
    K: "К",
    Q: "Қ",
    SH: "Ш",
    ZH: "Ж",
    Z: "З",
    S: "С"
};
SOUND_KEYS.forEach(soundKey => {
    const soundData = getSoundData(soundKey);
    const title = soundData?.sound || soundNames[soundKey] || soundKey;
    const card = document.createElement("button");
    card.className = "sound-card";
    card.innerHTML = `
        <span class="sound-letter">${escapeHTML(title)}</span>
        <span class="sound-caption">Дыбысымен жұмыс</span>
        <span class="sound-arrow">→</span>
    `;
    card.addEventListener("click", () => {
        if (!soundData) {
            alert(`${title} дыбысының материалдары data.js файлында әлі жоқ.`);
            return;
        }
        currentSound = soundKey;
        renderStages();
        showPage("stagePage");
    });
    container.appendChild(card);
});

}

// ——————————————————
// 9. КЕЗЕҢДЕР МӘЗІРІ
// ——————————————————

function renderStages() {
const container = $(“stageMenu”);
if (!container || !currentSound) return;

container.innerHTML = "";
const sound = getSoundData(currentSound);
const stages = getStages(currentSound);
setText("soundTitle", `${sound?.sound || currentSound} дыбысымен жұмыс`);
stages.forEach((stage, index) => {
    const tasks = getTasks(currentSound, index);
    const completed = tasks.filter((task, taskIndex) => {
        return getSavedScore(currentSound, index, taskIndex) !== null;
    }).length;
    const percent = tasks.length
        ? Math.round(completed / tasks.length * 100)
        : 0;
    const card = document.createElement("button");
    card.className = "stage-card";
    card.innerHTML = `
        <span class="stage-number">${index + 1}</span>
        <h3>${escapeHTML(stage.title || STAGE_TITLES[index])}</h3>
        <p>${tasks.length} тапсырма</p>
        <div class="stage-progress">
            <div style="width:${percent}%"></div>
        </div>
        <span>${percent}% орындалды</span>
    `;
    card.addEventListener("click", () => {
        currentStage = index;
        currentTaskIndex = 0;
        openTask();
        showPage("taskPage");
    });
    container.appendChild(card);
});

}

// ——————————————————
// 10. ТАПСЫРМАНЫ АШУ
// ——————————————————

function openTask() {
const tasks = getTasks(currentSound, currentStage);

if (!tasks.length) {
    alert("Бұл кезеңде тапсырмалар табылмады. data.js файлын тексер.");
    return;
}
if (currentTaskIndex < 0) currentTaskIndex = 0;
if (currentTaskIndex >= tasks.length) {
    currentTaskIndex = tasks.length - 1;
}
const task = tasks[currentTaskIndex];
stopCamera();
stopMicrophone();
selectedScore = getSavedScore(
    currentSound,
    currentStage,
    currentTaskIndex
);
setText("stageTitle", STAGE_TITLES[currentStage]);
setText("taskNumber", `${currentTaskIndex + 1}-тапсырма`);
setText("taskName", task.title || task.name || "Тапсырма");
setText("taskGoal", task.goal || task.purpose || "Мақсаты көрсетілмеген.");
setText("taskInstruction", task.instruction || task.description || "Нұсқаулық көрсетілмеген.");
setText("taskExample", task.example || task.sample || "Мысал көрсетілмеген.");
setText("taskCheck", task.check || task.question || "Тапсырманы орында.");
setText("taskHint", task.hint || "Тапсырманы асықпай орында.");
renderTaskVisual(task);
renderTaskExtras(task);
updateProgress();
updateScoreButtons();

}

// ——————————————————
// 11. ТАПСЫРМА КӨРНЕКІЛІГІ
// ——————————————————

function renderTaskVisual(task) {
const container = $(“taskVisual”);
if (!container) return;

container.innerHTML = "";
if (task.image) {
    const image = document.createElement("img");
    image.src = task.image;
    image.alt = task.title || "Тапсырма көрнекілігі";
    image.className = "task-image";
    container.appendChild(image);
}
if (task.visual && typeof task.visual === "string") {
    const visual = document.createElement("div");
    visual.className = "task-visual-text";
    visual.textContent = task.visual;
    container.appendChild(visual);
}
if (task.words && Array.isArray(task.words)) {
    const wordList = document.createElement("div");
    wordList.className = "task-word-list";
    task.words.forEach(word => {
        const item = document.createElement("span");
        item.className = "task-word";
        item.textContent = word;
        wordList.appendChild(item);
    });
    container.appendChild(wordList);
}
if (task.items && Array.isArray(task.items)) {
    const list = document.createElement("div");
    list.className = "task-items";
    task.items.forEach(item => {
        const element = document.createElement("div");
        element.className = "task-item";
        element.textContent = typeof item === "string"
            ? item
            : item.text || item.name || "";
        list.appendChild(element);
    });
    container.appendChild(list);
}
if (!container.innerHTML.trim()) {
    container.textContent = "Бұл тапсырмаға арналған көрнекілік data.js файлында көрсетілмеген.";
}

}

// ——————————————————
// 12. ҚОСЫМША МАТЕРИАЛДАР
// ——————————————————

function renderTaskExtras(task) {
const videoContainer = $(“taskVideoContainer”);
const video = $(“taskVideo”);

if (videoContainer) videoContainer.style.display = "none";
if (video) video.innerHTML = "";
const videoUrl = task.video || task.videoUrl;
if (videoUrl) {
    if (videoContainer) videoContainer.style.display = "block";
    renderVideo(video, videoUrl);
}
const audioContainer = $("taskAudioContainer");
const audio = $("taskAudio");
if (audioContainer) audioContainer.style.display = "none";
const audioUrl = task.audioUrl || (
    typeof task.audio === "string" ? task.audio : ""
);
if (audio && audioUrl) {
    audio.src = audioUrl;
    audioContainer.style.display = "block";
} else if (audio) {
    audio.removeAttribute("src");
    audio.load();
}
const cameraSection = $("cameraSection");
const microphoneSection = $("microphoneSection");
const breathingSection = $("breathingSection");
if (cameraSection) {
    cameraSection.style.display = task.camera ? "block" : "none";
}
if (microphoneSection) {
    microphoneSection.style.display = task.microphone ? "block" : "none";
}
if (breathingSection) {
    breathingSection.style.display = task.breathing ? "block" : "none";
}
const cotton = $("breathingCotton");
if (cotton) {
    cotton.style.animation = task.breathing
        ? "cottonFloat 1.5s ease-in-out infinite alternate"
        : "none";
}

}

function renderVideo(container, url) {
if (!container) return;

const videoId = getYouTubeId(url);
if (videoId) {
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}`;
    iframe.title = "Оқыту бейнесі";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    container.appendChild(iframe);
    return;
}
const link = document.createElement("a");
link.href = url;
link.target = "_blank";
link.rel = "noopener noreferrer";
link.textContent = "▶ Бейнені ашу";
container.appendChild(link);

}

function getYouTubeId(url) {
try {
const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
        return parsed.pathname.slice(1);
    }
    if (parsed.hostname.includes("youtube.com")) {
        if (parsed.searchParams.get("v")) {
            return parsed.searchParams.get("v");
        }
        const match = parsed.pathname.match(/\/embed\/([^/]+)/);
        if (match) return match[1];
    }
} catch (error) {
    return null;
}
return null;

}

// ——————————————————
// 13. БАҒАЛАУ
// ——————————————————

function selectScore(score) {
if (![0, 1, 2, 3].includes(score)) return;

selectedScore = score;
updateScoreButtons();

}

function updateScoreButtons() {
document.querySelectorAll(”.score-button”).forEach(button => {
const score = Number(button.dataset.score);

    button.classList.toggle(
        "selected",
        score === selectedScore
    );
});

}

function completeTask() {
if (!currentSound) return;

if (selectedScore === null) {
    alert("Алдымен тапсырманы бағала!");
    return;
}
saveScore(
    currentSound,
    currentStage,
    currentTaskIndex,
    selectedScore
);
updateProgress();
alert("Бағалау сақталды!");
renderStages();

}

// ——————————————————
// 14. КЕЛЕСІ ЖӘНЕ АЛДЫҢҒЫ ТАПСЫРМА
// ——————————————————

function nextTask() {
const tasks = getTasks(currentSound, currentStage);

if (currentTaskIndex < tasks.length - 1) {
    currentTaskIndex++;
    openTask();
    return;
}
alert("Бұл кезеңдегі тапсырмалар аяқталды!");
renderStages();
showPage("stagePage");

}

function previousTask() {
if (currentTaskIndex > 0) {
currentTaskIndex–;
openTask();
} else {
alert(“Бұл — бірінші тапсырма.”);
}
}

// ——————————————————
// 15. ПРОГРЕСС
// ——————————————————

function updateProgress() {
const tasks = getTasks(currentSound, currentStage);

const completed = tasks.filter((task, index) => {
    return getSavedScore(currentSound, currentStage, index) !== null;
}).length;
const percent = tasks.length
    ? Math.round(completed / tasks.length * 100)
    : 0;
setText("progressText", `${percent}%`);
const bar = $("progressBar");
if (bar) {
    bar.style.width = `${percent}%`;
}

}

// ——————————————————
// 16. КАМЕРА
// ——————————————————

async function toggleCamera() {
if (cameraStream) {
stopCamera();
return;
}

if (!navigator.mediaDevices?.getUserMedia) {
    alert("Бұл браузер камераға рұқсат бермейді. HTTPS арқылы ашып көр.");
    return;
}
try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
        video: {
            facingMode: "user"
        },
        audio: false
    });
    const video = $("cameraVideo");
    if (video) {
        video.srcObject = cameraStream;
        video.style.display = "block";
        video.play();
    }
    setText("cameraButton", "Камераны өшіру");
} catch (error) {
    console.error(error);
    alert("Камера қосылмады. Браузерден камераға рұқсат берілгенін тексер.");
}

}

function stopCamera() {
if (cameraStream) {
cameraStream.getTracks().forEach(track => track.stop());
cameraStream = null;
}

const video = $("cameraVideo");
if (video) {
    video.srcObject = null;
    video.style.display = "none";
}
const button = $("cameraButton");
if (button) {
    button.textContent = "📷 Камераны қосу";
}

}

// ——————————————————
// 17. МИКРОФОН
// ——————————————————

async function toggleMicrophone() {
if (microphoneStream) {
stopMicrophone();
return;
}

if (!navigator.mediaDevices?.getUserMedia) {
    alert("Микрофон бұл браузерде қолжетімсіз. HTTPS арқылы ашып көр.");
    return;
}
try {
    microphoneStream = await navigator.mediaDevices.getUserMedia({
        audio: true
    });
    const audioContext = new (
        window.AudioContext || window.webkitAudioContext
    )();
    await audioContext.resume();
    const source = audioContext.createMediaStreamSource(microphoneStream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    function updateMicLevel() {
        if (!microphoneStream) return;
        analyser.getByteFrequencyData(data);
        const average = data.reduce((sum, value) => sum + value, 0) / data.length;
        const level = Math.min(100, Math.round(average * 1.5));
        const bar = $("micLevel");
        if (bar) {
            bar.style.width = `${level}%`;
        }
        if (level < 15) {
            setText("micStatus", "Дауыс деңгейі төмен");
        } else if (level < 45) {
            setText("micStatus", "Дауыс деңгейі орташа");
        } else {
            setText("micStatus", "Дауыс деңгейі жоғары");
        }
        microphoneAnimation = requestAnimationFrame(updateMicLevel);
    }
    window.currentAudioContext = audioContext;
    updateMicLevel();
    setText("microphoneButton", "Микрофонды өшіру");
} catch (error) {
    console.error(error);
    alert("Микрофон қосылмады. Браузер рұқсаттарын тексер.");
}

}

function stopMicrophone() {
if (microphoneAnimation) {
cancelAnimationFrame(microphoneAnimation);
microphoneAnimation = null;
}

if (microphoneStream) {
    microphoneStream.getTracks().forEach(track => track.stop());
    microphoneStream = null;
}
if (window.currentAudioContext) {
    window.currentAudioContext.close();
    window.currentAudioContext = null;
}
const bar = $("micLevel");
if (bar) bar.style.width = "0%";
setText("micStatus", "Микрофон қосылмаған.");
const button = $("microphoneButton");
if (button) {
    button.textContent = "🎤 Микрофонды қосу";
}

}

// ——————————————————
// 18. СЕРГІТУ СӘТІ
// ——————————————————

const relaxationVideos = [
{
title: “Қимыл-қозғалыс жаттығуы”,
url: “https://www.youtube.com/results?search_query=балаларға+арналған+сергіту+сәті”
},
{
title: “Ән мен би”,
url: “https://www.youtube.com/results?search_query=балаларға+арналған+би+жаттығулары”
},
{
title: “Қимылды ойын”,
url: “https://www.youtube.com/results?search_query=балаларға+арналған+қимылды+ойындар”
}
];

function openRelaxation() {
currentRelaxationIndex = 0;
renderRelaxation();
showPage(“relaxationPage”);
}

function renderRelaxation() {
const video = relaxationVideos[currentRelaxationIndex];

setText(
    "danceVideo",
    video.title
);
const container = $("danceVideo");
if (container) {
    container.innerHTML = "";
    const link = document.createElement("a");
    link.href = video.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "▶ Бейнені көру";
    container.appendChild(link);
}
["singingVideo", "movementVideo"].forEach(id => {
    const element = $(id);
    if (element) element.innerHTML = "";
});

}

function nextRelaxation() {
currentRelaxationIndex =
(currentRelaxationIndex + 1) % relaxationVideos.length;

renderRelaxation();

}

// ——————————————————
// 19. ҰСАҚ МОТОРИКА
// ——————————————————

function openMotor() {
showPage(“motorPage”);
}

function startMotorGame(game) {
currentMotorGame = game;

const area = $("motorGameArea");
if (!area) return;
area.innerHTML = "";
switch (game) {
    case "puzzle":
        createPuzzleGame(area);
        break;
    case "maze":
        createMazeGame(area);
        break;
    case "dots":
        createDotsGame(area);
        break;
    case "coloring":
        createColoringGame(area);
        break;
    case "memory":
        createMemoryGame(area);
        break;
    case "sorting":
        createSortingGame(area);
        break;
    default:
        area.textContent = "Ойын табылмады.";
}

}

// ——————————————————
// 20. ПАЗЛ ОЙЫНЫ
// ——————————————————

function createPuzzleGame(area) {
const title = document.createElement(“h3”);
title.textContent = “Сандарды ретімен орналастыр”;

const info = document.createElement("p");
info.textContent = "Бос орын арқылы сандарды 1-ден 8-ге дейін ретте.";
const board = document.createElement("div");
board.className = "puzzle-board";
let numbers = [1, 2, 3, 4, 5, 6, 7, 8, 0];
function shuffle() {
    for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    if (!isSolvable(numbers)) {
        [numbers[0], numbers[1]] = [numbers[1], numbers[0]];
    }
    if (numbers.every((n, i) => n === (i + 1) % 9)) {
        [numbers[0], numbers[1]] = [numbers[1], numbers[0]];
    }
}
function isSolvable(array) {
    let inversions = 0;
    for (let i = 0; i < array.length; i++) {
        for (let j = i + 1; j < array.length; j++) {
            if (array[i] && array[j] && array[i] > array[j]) {
                inversions++;
            }
        }
    }
    return inversions % 2 === 0;
}
function draw() {
    board.innerHTML = "";
    numbers.forEach((number, index) => {
        const cell = document.createElement("button");
        cell.className = "puzzle-piece";
        cell.textContent = number || "";
        if (number === 0) {
            cell.classList.add("empty");
        }
        cell.addEventListener("click", () => {
            const emptyIndex = numbers.indexOf(0);
            const sameRow = Math.floor(index / 3) === Math.floor(emptyIndex / 3);
            const sameColumn = index % 3 === emptyIndex % 3;
            if (
                (sameRow && Math.abs(index - emptyIndex) === 1) ||
                (sameColumn && Math.abs(index - emptyIndex) === 3)
            ) {
                [numbers[index], numbers[emptyIndex]] =
                    [numbers[emptyIndex], numbers[index]];
                draw();
            }
            if (numbers.every((n, i) => n === (i + 1) % 9)) {
                info.textContent = "Жарайсың! Пазлды дұрыс жинадың!";
            }
        });
        board.appendChild(cell);
    });
}
const restart = createButton("Қайта бастау", () => {
    shuffle();
    info.textContent = "Бос орынды пайдаланып сандарды ретте.";
    draw();
});
area.append(title, info, board, restart);
shuffle();
draw();

}

// ——————————————————
// 21. ЛАБИРИНТ
// ——————————————————

function createMazeGame(area) {
const title = document.createElement(“h3”);
title.textContent = “Қоянға жол көрсет!”;

const info = document.createElement("p");
info.textContent = "Бағыт көрсеткілерін басып, қоянды сәбізге жеткіз.";
const maze = [
    [0, 1, 0, 0, 0],
    [0, 1, 0, 1, 0],
    [0, 0, 0, 1, 0],
    [1, 1, 0, 0, 0],
    [0, 0, 0, 1, 0]
];
let player = { row: 0, col: 0 };
const board = document.createElement("div");
board.className = "maze-board";
function draw() {
    board.innerHTML = "";
    maze.forEach((row, r) => {
        row.forEach((cell, c) => {
            const square = document.createElement("div");
            square.className = cell ? "maze-wall" : "maze-cell";
            if (player.row === r && player.col === c) {
                square.textContent = "🐰";
            } else if (r === 4 && c === 4) {
                square.textContent = "🥕";
            }
            board.appendChild(square);
        });
    });
}
function move(dr, dc) {
    const row = player.row + dr;
    const col = player.col + dc;
    if (
        row < 0 || row > 4 ||
        col < 0 || col > 4 ||
        maze[row][col] === 1
    ) return;
    player = { row, col };
    draw();
    if (row === 4 && col === 4) {
        info.textContent = "Жарайсың! Қоян сәбізге жетті!";
    }
}
const controls = document.createElement("div");
controls.className = "maze-controls";
[
    ["↑", -1, 0],
    ["↓", 1, 0],
    ["←", 0, -1],
    ["→", 0, 1]
].forEach(([label, dr, dc]) => {
    controls.appendChild(
        createButton(label, () => move(dr, dc))
    );
});
area.append(title, info, board, controls);
draw();

}

// ——————————————————
// 22. НҮКТЕЛЕРДІ ҚОСУ
// ——————————————————

function createDotsGame(area) {
const title = document.createElement(“h3”);
title.textContent = “Нүктелерді ретімен қос”;

const info = document.createElement("p");
info.textContent = "1-ден 6-ға дейінгі нүктелерді бас.";
const board = document.createElement("div");
board.className = "dots-board";
const points = [
    { x: 50, y: 15 },
    { x: 80, y: 35 },
    { x: 70, y: 70 },
    { x: 30, y: 70 },
    { x: 20, y: 35 },
    { x: 50, y: 15 }
];
let nextPoint = 0;
points.forEach((point, index) => {
    const dot = createButton(String(index + 1), () => {
        if (index !== nextPoint) {
            info.textContent = "Нүктелерді ретімен бас!";
            return;
        }
        dot.classList.add("selected");
        nextPoint++;
        if (nextPoint === points.length) {
            info.textContent = "Керемет! Суретті аяқтадың!";
        }
    });
    dot.style.position = "absolute";
    dot.style.left = `${point.x}%`;
    dot.style.top = `${point.y}%`;
    board.appendChild(dot);
});
board.style.position = "relative";
board.style.minHeight = "260px";
area.append(title, info, board);

}

// ——————————————————
// 23. БОЯУ ОЙЫНЫ
// ——————————————————

function createColoringGame(area) {
const title = document.createElement(“h3”);
title.textContent = “Түстер әлемі”;

const canvas = document.createElement("canvas");
canvas.width = 600;
canvas.height = 350;
canvas.className = "coloring-canvas";
const context = canvas.getContext("2d");
context.fillStyle = "#ffffff";
context.fillRect(0, 0, canvas.width, canvas.height);
context.lineWidth = 5;
context.strokeStyle = "#333333";
context.beginPath();
context.arc(300, 170, 90, 0, Math.PI * 2);
context.stroke();
context.beginPath();
context.arc(265, 145, 12, 0, Math.PI * 2);
context.stroke();
context.beginPath();
context.arc(335, 145, 12, 0, Math.PI * 2);
context.stroke();
context.beginPath();
context.arc(300, 185, 30, 0, Math.PI);
context.stroke();
let drawing = false;
let color = "#ff6b9d";
const colors = ["#ff6b9d", "#8a63d2", "#4bb7df", "#ffcf4a", "#65c99a"];
const palette = document.createElement("div");
colors.forEach(value => {
    const button = createButton("●", () => {
        color = value;
        context.strokeStyle = color;
    });
    button.style.color = value;
    palette.appendChild(button);
});
function position(event) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (event.clientX - rect.left) * canvas.width / rect.width,
        y: (event.clientY - rect.top) * canvas.height / rect.height
    };
}
canvas.addEventListener("pointerdown", event => {
    drawing = true;
    const p = position(event);
    context.beginPath();
    context.moveTo(p.x, p.y);
});
canvas.addEventListener("pointermove", event => {
    if (!drawing) return;
    const p = position(event);
    context.strokeStyle = color;
    context.lineWidth = 12;
    context.lineCap = "round";
    context.lineTo(p.x, p.y);
    context.stroke();
});
canvas.addEventListener("pointerup", () => drawing = false);
canvas.addEventListener("pointerleave", () => drawing = false);
const clear = createButton("Тазалау", () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    createColoringGame(area);
});
area.append(title, palette, canvas, clear);

}

// ——————————————————
// 24. ЕСТЕ САҚТА ОЙЫНЫ
// ——————————————————

function createMemoryGame(area) {
const title = document.createElement(“h3”);
title.textContent = “Суреттердің жұбын тап”;

const info = document.createElement("p");
info.textContent = "Бірдей суреттерді тауып, жұптастыр.";
const symbols = ["🍎", "🐱", "🌸", "🚗", "🍎", "🐱", "🌸", "🚗"]
    .sort(() => Math.random() - 0.5);
const board = document.createElement("div");
board.className = "memory-board";
let first = null;
let lock = false;
let matches = 0;
symbols.forEach(symbol => {
    const card = createButton("❔", () => {
        if (lock || card.dataset.open === "yes") return;
        card.textContent = symbol;
        card.dataset.open = "yes";
        if (!first) {
            first = card;
            return;
        }
        if (first.textContent === card.textContent) {
            matches++;
            first = null;
            if (matches === 4) {
                info.textContent = "Жарайсың! Барлық жұпты таптың!";
            }
        } else {
            lock = true;
            const previous = first;
            first = null;
            setTimeout(() => {
                previous.textContent = "❔";
                card.textContent = "❔";
                previous.dataset.open = "";
                card.dataset.open = "";
                lock = false;
            }, 800);
        }
    });
    card.className = "memory-card";
    board.appendChild(card);
});
area.append(title, info, board);

}

// ——————————————————
// 25. ТОПТАСТЫРУ ОЙЫНЫ
// ——————————————————

function createSortingGame(area) {
const title = document.createElement(“h3”);
title.textContent = “Заттарды топтастыр”;

const info = document.createElement("p");
info.textContent = "Әр заттың қай топқа жататынын таңда.";
const items = [
    { name: "🍎 Алма", group: "Жеміс" },
    { name: "🍐 Алмұрт", group: "Жеміс" },
    { name: "🥕 Сәбіз", group: "Көкөніс" },
    { name: "🥒 Қияр", group: "Көкөніс" }
].sort(() => Math.random() - 0.5);
const board = document.createElement("div");
board.className = "sorting-board";
items.forEach(item => {
    const row = document.createElement("div");
    row.className = "sorting-item";
    const label = document.createElement("span");
    label.textContent = item.name;
    const select = document.createElement("select");
    select.innerHTML = `
        <option value="">Таңда</option>
        <option value="Жеміс">Жеміс</option>
        <option value="Көкөніс">Көкөніс</option>
    `;
    select.addEventListener("change", () => {
        if (select.value === item.group) {
            row.classList.add("correct");
            info.textContent = "Дұрыс! Жарайсың!";
        } else if (select.value) {
            row.classList.remove("correct");
            info.textContent = "Қайта ойланып көр.";
        }
        const correct = [...board.querySelectorAll("select")]
            .filter((element, index) =>
                element.value === items[index].group
            ).length;
        if (correct === items.length) {
            info.textContent = "Керемет! Барлық зат дұрыс топтастырылды!";
        }
    });
    row.append(label, select);
    board.appendChild(row);
});
area.append(title, info, board);

}

// ——————————————————
// 26. КӨМЕКШІ ФУНКЦИЯЛАР
// ——————————————————

function createButton(text, callback) {
const button = document.createElement(“button”);

button.type = "button";
button.textContent = text;
button.addEventListener("click", callback);
return button;

}

function escapeHTML(value) {
return String(value).replace(/[&<>”’]/g, character => ({
“&”: “&”,
“<”: “<”,
“>”: “>”,
‘”’: “"”,
“’”: “'”
})[character]);
}

// ——————————————————
// 27. ДИПЛОМ
// ——————————————————

function openDiploma() {
const total = getTotalTasks();

let completed = 0;
SOUND_KEYS.forEach(soundKey => {
    getStages(soundKey).forEach((stage, stageIndex) => {
        stage.tasks.forEach((task, taskIndex) => {
            if (
                getSavedScore(soundKey, stageIndex, taskIndex) !== null
            ) {
                completed++;
            }
        });
    });
});
if (total === 0 || completed < total) {
    alert(
        `Диплом алу үшін барлық тапсырманы аяқтау керек.\n` +
        `Орындалғаны: ${completed}/${total}`
    );
    return;
}
showPage("diplomaPage");

}

// ——————————————————
// 28. ҚАУІПСІЗ ШЫҒУ
// ——————————————————

window.addEventListener(“beforeunload”, () => {
stopCamera();
stopMicrophone();
});

console.log(“Сөйлеу әлеміне саяхат бағдарламасы іске қосылды.”);
