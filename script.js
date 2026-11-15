// ======================================================
// СӨЙЛЕУ ӘЛЕМІНЕ САЯХАТ
// Негізгі JavaScript файлы
// ======================================================

“use strict”;

// ——————————
// 1. НЕГІЗГІ БАПТАУЛАР
// ——————————

const SOUND_ORDER_DEFAULT = [“Р”, “Л”, “Г”, “Ғ”, “К”, “Қ”, “Ш”, “Ж”, “З”, “С”];

const STAGE_TITLES = [
“Дайындық кезеңі”,
“Дыбысты қою кезеңі”,
“Автоматтандыру кезеңі”,
“Дифференциация кезеңі”
];

const STORAGE_KEY = “soileu_sayahaty_progress_v1”;

let currentSound = null;
let currentStage = 0;
let currentTask = 0;

let progressData = {};
let cameraStream = null;
let microphoneStream = null;
let microphoneAnimation = null;
let audioContext = null;

let selectedScore = null;

// ——————————
// 2. HTML ЭЛЕМЕНТТЕРІ
// ——————————

const $ = (id) => document.getElementById(id);

function showPage(pageId) {
document.querySelectorAll(”.page”).forEach(page => {
page.classList.remove(“active”);
});

const page = $(pageId);

if (page) {
page.classList.add(“active”);
window.scrollTo({ top: 0, behavior: “smooth” });
}
}

// ——————————
// 3. DATA.JS ДЕРЕКТЕРІН ОҚУ
// ——————————

function getSpeechData() {
if (typeof speechTasks !== “undefined”) {
return speechTasks;
}

if (window.speechTasks) {
return window.speechTasks;
}

return null;
}

function getSoundOrder(data) {
let order = SOUND_ORDER_DEFAULT;

if (typeof SOUND_ORDER !== “undefined” && Array.isArray(SOUND_ORDER)) {
order = SOUND_ORDER;
} else if (Array.isArray(window.SOUND_ORDER)) {
order = window.SOUND_ORDER;
}

const availableKeys = Object.keys(data || {});

const normalized = order.map(item => {
if (typeof item === “string”) return item;
return item.key || item.id || item.sound || item.letter;
}).filter(Boolean);

// Деректерде бар дыбыстарды ғана көрсету.
const existing = normalized.filter(key => data && data[key]);

// SOUND_ORDER сәйкес келмесе, data.js ішіндегі кілттерді қолдану.
return existing.length ? existing : availableKeys;
}

function getSoundData(soundKey) {
const data = getSpeechData();

if (!data || !soundKey) return null;

return data[soundKey] || null;
}

function getStages(soundData) {
if (!soundData) return [];

if (Array.isArray(soundData.stages)) {
return soundData.stages;
}

if (soundData.stages && typeof soundData.stages === “object”) {
return Object.values(soundData.stages);
}

return [];
}

function getTasks(stage) {
if (!stage) return [];

if (Array.isArray(stage.tasks)) {
return stage.tasks;
}

return [];
}

function getTaskValue(task, fields, fallback = “”) {
for (const field of fields) {
if (task[field] !== undefined && task[field] !== null) {
return task[field];
}
}

return fallback;
}

function getSoundName(soundKey, soundData) {
return (
soundData.sound ||
soundData.title ||
soundData.name ||
soundKey
);
}

// ——————————
// 4. ПРОГРЕСТІ САҚТАУ
// ——————————

function loadProgress() {
try {
const saved = localStorage.getItem(STORAGE_KEY);

progressData = saved ? JSON.parse(saved) : {};

} catch (error) {
console.warn(“Прогресті оқу мүмкін болмады:”, error);
progressData = {};
}
}

function saveProgress() {
try {
localStorage.setItem(STORAGE_KEY, JSON.stringify(progressData));
} catch (error) {
console.warn(“Прогресті сақтау мүмкін болмады:”, error);
}
}

function getTaskProgressKey(soundKey, stageIndex, taskIndex) {
return ${soundKey}_${stageIndex}_${taskIndex};
}

function saveTaskScore(score) {
const key = getTaskProgressKey(
currentSound,
currentStage,
currentTask
);

progressData[key] = {
score: Number(score),
completed: true,
updatedAt: new Date().toISOString()
};

saveProgress();
}

function getSavedTask(soundKey, stageIndex, taskIndex) {
const key = getTaskProgressKey(
soundKey,
stageIndex,
taskIndex
);

return progressData[key] || null;
}

function isTaskCompleted(soundKey, stageIndex, taskIndex) {
return Boolean(
getSavedTask(soundKey, stageIndex, taskIndex)?.completed
);
}

function calculateStageProgress(soundKey, stageIndex) {
const soundData = getSoundData(soundKey);
const stages = getStages(soundData);
const tasks = getTasks(stages[stageIndex]);

if (!tasks.length) return 0;

let completed = 0;

tasks.forEach((task, index) => {
if (isTaskCompleted(soundKey, stageIndex, index)) {
completed++;
}
});

return Math.round((completed / tasks.length) * 100);
}

// ——————————
// 5. БАСТЫ БЕТТЕН БАСТАУ
// ——————————

function initializeProgram() {
loadProgress();

const data = getSpeechData();

if (!data) {
alert(
“data.js файлы оқылмады. “ +
“Алдымен data.js, содан кейін script.js қосылғанын тексеріңіз.”
);
return;
}

bindMainButtons();
}

function bindMainButtons() {
$(“startJourneyButton”)?.addEventListener(“click”, () => {
renderSoundMenu();
showPage(“soundPage”);
});

$(“backToHomeButton”)?.addEventListener(“click”, () => {
showPage(“homePage”);
});

$(“backToSoundsButton”)?.addEventListener(“click”, () => {
renderSoundMenu();
showPage(“soundPage”);
});

$(“backToStagesButton”)?.addEventListener(“click”, () => {
renderStages();
showPage(“stagePage”);
});

$(“previousTaskButton”)?.addEventListener(“click”, previousTask);

$(“nextTaskButton”)?.addEventListener(“click”, nextTask);

$(“completeTaskButton”)?.addEventListener(“click”, completeTask);

$(“taskCheck”)?.addEventListener(“click”, checkTask);

$(“taskHint”)?.addEventListener(“click”, showHint);

$(“openAssessmentButton”)?.addEventListener(“click”, () => {
stopMedia();
showPage(“assessmentPage”);
});

$(“backFromAssessmentButton”)?.addEventListener(“click”, () => {
showPage(“taskPage”);
});

$(“openRelaxationButton”)?.addEventListener(“click”, () => {
renderRelaxation();
showPage(“relaxationPage”);
});

$(“openMotorButton”)?.addEventListener(“click”, () => {
showPage(“motorPage”);
});

$(“diplomaButton”)?.addEventListener(“click”, openDiploma);

$(“printDiplomaButton”)?.addEventListener(“click”, () => {
window.print();
});

$(“backToSoundsFromDiplomaButton”)?.addEventListener(“click”, () => {
renderSoundMenu();
showPage(“soundPage”);
});

$(“backFromRelaxationButton”)?.addEventListener(“click”, () => {
showPage(“taskPage”);
});

$(“nextRelaxationButton”)?.addEventListener(“click”, renderRelaxation);

$(“backFromMotorButton”)?.addEventListener(“click”, () => {
showPage(“taskPage”);
});

document.querySelectorAll(”[data-score]”).forEach(button => {
button.addEventListener(“click”, () => {
selectScore(Number(button.dataset.score));
});
});

document.querySelectorAll(”[data-game]”).forEach(button => {
button.addEventListener(“click”, () => {
startMotorGame(button.dataset.game);
});
});

$(“cameraButton”)?.addEventListener(“click”, toggleCamera);

$(“microphoneButton”)?.addEventListener(“click”, toggleMicrophone);
}

// ——————————
// 6. ДЫБЫСТАР МӘЗІРІ
// ——————————

function renderSoundMenu() {
const menu = $(“soundMenu”);
const data = getSpeechData();

if (!menu || !data) return;

menu.innerHTML = “”;

const soundKeys = getSoundOrder(data);

if (!soundKeys.length) {
menu.innerHTML = <div class="empty-message"> <h3>Әзірге дыбыстар енгізілмеген</h3> <p>Дыбыстардың тапсырмаларын data.js файлына енгізу қажет.</p> </div>;
return;
}

soundKeys.forEach((soundKey, index) => {
const soundData = getSoundData(soundKey);
const soundName = getSoundName(soundKey, soundData);
const stages = getStages(soundData);

const card = document.createElement("button");
card.className = "sound-card";
card.innerHTML = `
  <span class="sound-card-number">${index + 1}</span>
  <span class="sound-card-letter">${escapeHTML(soundName)}</span>
  <span class="sound-card-description">Дыбыспен жұмыс</span>
  <span class="sound-card-arrow">→</span>
  <span class="sound-card-progress">
    ${stages.length} кезең
  </span>
`;
card.addEventListener("click", () => {
  currentSound = soundKey;
  currentStage = 0;
  currentTask = 0;
  renderStages();
  showPage("stagePage");
});
menu.appendChild(card);

});
}

// ——————————
// 7. КЕЗЕҢДЕР МӘЗІРІ
// ——————————

function renderStages() {
const menu = $(“stageMenu”);
const soundData = getSoundData(currentSound);

if (!menu || !soundData) return;

const soundName = getSoundName(currentSound, soundData);

$(“soundTitle”).textContent = ${soundName} дыбысы;

menu.innerHTML = “”;

const stages = getStages(soundData);

if (!stages.length) {
menu.innerHTML = <div class="empty-message"> <h3>Кезеңдер әзірге енгізілмеген</h3> <p>Бұл дыбыстың кезеңдерін data.js файлына енгізіңіз.</p> </div>;
return;
}

stages.forEach((stage, index) => {
const tasks = getTasks(stage);
const percent = calculateStageProgress(currentSound, index);

const title =
  stage.title ||
  stage.name ||
  STAGE_TITLES[index] ||
  `Кезең ${index + 1}`;
const card = document.createElement("button");
card.className = "stage-card";
card.innerHTML = `
  <span class="stage-card-number">${index + 1}</span>
  <div class="stage-card-content">
    <h3>${escapeHTML(title)}</h3>
    <p>${tasks.length} тапсырма</p>
    <div class="progress-track">
      <div class="progress-bar" style="width:${percent}%"></div>
    </div>
    <small>Орындалуы: ${percent}%</small>
  </div>
  <span class="stage-card-arrow">→</span>
`;
card.addEventListener("click", () => {
  currentStage = index;
  currentTask = 0;
  if (!tasks.length) {
    alert("Бұл кезеңге тапсырмалар әлі енгізілмеген.");
    return;
  }
  openTask();
  showPage("taskPage");
});
menu.appendChild(card);

});
}

// ——————————
// 8. ТАПСЫРМАНЫ АШУ
// ——————————

function openTask() {
stopMedia();

const soundData = getSoundData(currentSound);
const stages = getStages(soundData);
const stage = stages[currentStage];
const tasks = getTasks(stage);

if (!tasks.length || !tasks[currentTask]) {
alert(“Тапсырма табылмады.”);
return;
}

const task = tasks[currentTask];

const stageTitle =
stage.title ||
stage.name ||
STAGE_TITLES[currentStage] ||
“Тапсырма кезеңі”;

$(“stageTitle”).textContent =
${getSoundName(currentSound, soundData)} дыбысы — ${stageTitle};

$(“taskNumber”).textContent =
${currentTask + 1} / ${tasks.length};

$(“taskName”).textContent = getTaskValue(
task,
[“title”, “name”],
Тапсырма ${currentTask + 1}
);

$(“taskGoal”).textContent = getTaskValue(
task,
[“goal”, “purpose”, “aim”],
“Тапсырманың мақсаты көрсетілмеген.”
);

$(“taskInstruction”).textContent = getTaskValue(
task,
[“instruction”, “description”, “task”],
“Тапсырма нұсқаулығы көрсетілмеген.”
);

$(“taskExample”).textContent = getTaskValue(
task,
[“example”, “model”, “sample”],
“Үлгі көрсетілмеген.”
);

renderTaskVisual(task);
renderTaskExtras(task);
renderTaskVideo(task);
renderTaskAudio(task);

updateTaskProgress();
updateTaskNavigation();
restoreSelectedScore();
}

// ——————————
// 9. КӨРНЕКІЛІКТЕР
// ——————————

function renderTaskVisual(task) {
const area = $(“taskVisual”);

if (!area) return;

area.innerHTML = “”;

const visual = getTaskValue(
task,
[“visual”, “image”, “items”, “words”],
null
);

if (!visual) return;

if (typeof visual === “string”) {
if (visual.startsWith(“http”)) {
const image = document.createElement(“img”);
image.src = visual;
image.alt = “Тапсырма көрнекілігі”;
image.loading = “lazy”;
area.appendChild(image);
} else {
const paragraph = document.createElement(“p”);
paragraph.textContent = visual;
area.appendChild(paragraph);
}

return;

}

if (Array.isArray(visual)) {
const list = document.createElement(“div”);
list.className = “visual-items”;

visual.forEach(item => {
  const element = document.createElement("div");
  element.className = "visual-item";
  if (typeof item === "string") {
    element.textContent = item;
  } else {
    element.textContent =
      item.text || item.word || item.name || JSON.stringify(item);
  }
  list.appendChild(element);
});
area.appendChild(list);
return;

}

if (typeof visual === “object”) {
if (visual.url || visual.src) {
const image = document.createElement(“img”);
image.src = visual.url || visual.src;
image.alt = visual.alt || “Тапсырма көрнекілігі”;
image.loading = “lazy”;
area.appendChild(image);
}

if (visual.text) {
  const paragraph = document.createElement("p");
  paragraph.textContent = visual.text;
  area.appendChild(paragraph);
}

}
}

// ——————————
// 10. ҚОСЫМША ҚҰРАЛДАР
// ——————————

function renderTaskExtras(task) {
const extras = $(“taskExtras”);

if (extras) extras.innerHTML = “”;

const camera = Boolean(task.camera);
const microphone = Boolean(task.microphone);
const breathing = Boolean(task.breathing);

$(“cameraSection”).hidden = !camera;
$(“microphoneSection”).hidden = !microphone;
$(“breathingSection”).hidden = !breathing;
}

// ——————————
// 11. ВИДЕО
// ——————————

function getYouTubeEmbed(url) {
if (!url || typeof url !== “string”) return “”;

try {
const parsed = new URL(url);

let videoId = "";
if (parsed.hostname.includes("youtu.be")) {
  videoId = parsed.pathname.slice(1);
} else if (parsed.hostname.includes("youtube.com")) {
  if (parsed.pathname === "/watch") {
    videoId = parsed.searchParams.get("v") || "";
  } else if (parsed.pathname.startsWith("/embed/")) {
    videoId = parsed.pathname.split("/embed/")[1];
  } else if (parsed.pathname.startsWith("/shorts/")) {
    videoId = parsed.pathname.split("/shorts/")[1];
  }
}
videoId = videoId.split(/[?&/]/)[0];
if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) return "";
return `https://www.youtube.com/embed/${videoId}`;

} catch (error) {
return “”;
}
}

function renderTaskVideo(task) {
const container = $(“taskVideoContainer”);
const iframe = $(“taskVideo”);

const video = getTaskValue(
task,
[“video”, “videoUrl”, “videoLink”, “youtube”],
“”
);

const embedUrl = getYouTubeEmbed(video);

if (!embedUrl) {
container.hidden = true;
iframe.src = “”;
return;
}

container.hidden = false;
iframe.src = embedUrl;
}

// ——————————
// 12. АУДИО
// ——————————

function renderTaskAudio(task) {
const container = $(“taskAudioContainer”);
const audio = $(“taskAudio”);

const audioUrl = getTaskValue(
task,
[“audio”, “audioUrl”, “soundUrl”],
“”
);

if (!audioUrl || typeof audioUrl !== “string”) {
container.hidden = true;
audio.removeAttribute(“src”);
audio.load();
return;
}

container.hidden = false;
audio.src = audioUrl;
audio.load();
}

// ——————————
// 13. ТАПСЫРМАНЫ ТЕКСЕРУ
// ——————————

function checkTask() {
const task = getCurrentTask();

if (!task) return;

const message = getTaskValue(
task,
[“check”, “answer”, “correctAnswer”, “feedback”],
“Жауабыңды логопедпен бірге тексер.”
);

alert(message);
}

function showHint() {
const task = getCurrentTask();

if (!task) return;

const hint = getTaskValue(
task,
[“hint”, “help”, “tip”],
“Тапсырманы асықпай орында. Қажет болса, үлгіге қайта қара.”
);

alert(💡 КӨМЕК:\n\n${hint});
}

function getCurrentTask() {
const soundData = getSoundData(currentSound);
const stages = getStages(soundData);
const tasks = getTasks(stages[currentStage]);

return tasks[currentTask] || null;
}

// ——————————
// 14. БАҒАЛАУ
// ——————————

function selectScore(score) {
if (![0, 1, 2, 3].includes(score)) return;

selectedScore = score;

document.querySelectorAll(”[data-score]”).forEach(button => {
button.classList.toggle(
“selected”,
Number(button.dataset.score) === score
);
});

saveTaskScore(score);
}

function restoreSelectedScore() {
selectedScore = null;

document.querySelectorAll(”[data-score]”).forEach(button => {
button.classList.remove(“selected”);
});

const saved = getSavedTask(
currentSound,
currentStage,
currentTask
);

if (saved && saved.completed) {
selectedScore = saved.score;

document.querySelectorAll("[data-score]").forEach(button => {
  button.classList.toggle(
    "selected",
    Number(button.dataset.score) === saved.score
  );
});

}
}

function completeTask() {
if (selectedScore === null) {
alert(“Алдымен бағалау шкаласынан нәтиже таңдаңыз.”);
return;
}

saveTaskScore(selectedScore);

const soundData = getSoundData(currentSound);
const stages = getStages(soundData);
const tasks = getTasks(stages[currentStage]);

if (currentTask < tasks.length - 1) {
currentTask++;
openTask();
} else {
const percent = calculateStageProgress(
currentSound,
currentStage
);

alert(
  `Кезең аяқталды!\nОрындалу көрсеткіші: ${percent}%`
);
renderStages();
showPage("stagePage");

}
}

function previousTask() {
if (currentTask > 0) {
currentTask–;
openTask();
}
}

function nextTask() {
const soundData = getSoundData(currentSound);
const stages = getStages(soundData);
const tasks = getTasks(stages[currentStage]);

if (currentTask < tasks.length - 1) {
currentTask++;
openTask();
} else {
alert(“Бұл кезеңдегі соңғы тапсырма.”);
}
}

function updateTaskProgress() {
const soundData = getSoundData(currentSound);
const stages = getStages(soundData);
const tasks = getTasks(stages[currentStage]);

const percent = calculateStageProgress(
currentSound,
currentStage
);

$(“progressText”).textContent = Орындалуы: ${percent}%;
$(“progressBar”).style.width = ${percent}%;
}

function updateTaskNavigation() {
const soundData = getSoundData(currentSound);
const stages = getStages(soundData);
const tasks = getTasks(stages[currentStage]);

$(“previousTaskButton”).disabled = currentTask === 0;

$(“nextTaskButton”).disabled =
currentTask >= tasks.length - 1;
}

// ——————————
// 15. КАМЕРА
// ——————————

async function toggleCamera() {
const video = $(“cameraVideo”);
const button = $(“cameraButton”);

if (cameraStream) {
cameraStream.getTracks().forEach(track => track.stop());
cameraStream = null;
video.srcObject = null;
button.textContent = “Камераны қосу”;
return;
}

if (!navigator.mediaDevices?.getUserMedia) {
alert(“Бұл браузерде камераға қолжетімділік жоқ. HTTPS арқылы ашып көріңіз.”);
return;
}

try {
cameraStream = await navigator.mediaDevices.getUserMedia({
video: {
facingMode: “user”
},
audio: false
});

video.srcObject = cameraStream;
video.style.transform = "scaleX(-1)";
button.textContent = "Камераны өшіру";

} catch (error) {
alert(“Камера қосылмады. Браузер баптауларынан рұқсат беріңіз.”);
}
}

// ——————————
// 16. МИКРОФОН
// ——————————

async function toggleMicrophone() {
const button = $(“microphoneButton”);

if (microphoneStream) {
stopMicrophone();
button.textContent = “Микрофонды қосу”;
$(“micStatus”).textContent = “Микрофон өшірілді”;
return;
}

if (!navigator.mediaDevices?.getUserMedia) {
alert(“Микрофонға қолжетімділік жоқ. Сайт HTTPS арқылы ашылуы керек.”);
return;
}

try {
microphoneStream = await navigator.mediaDevices.getUserMedia({
audio: true
});

audioContext = new (
  window.AudioContext || window.webkitAudioContext
)();
const source = audioContext.createMediaStreamSource(microphoneStream);
const analyser = audioContext.createAnalyser();
analyser.fftSize = 256;
source.connect(analyser);
const dataArray = new Uint8Array(analyser.frequencyBinCount);
button.textContent = "Микрофонды өшіру";
function updateMicrophone() {
  if (!microphoneStream) return;
  analyser.getByteFrequencyData(dataArray);
  const average =
    dataArray.reduce((sum, value) => sum + value, 0) /
    dataArray.length;
  const level = Math.min(100, Math.round(average * 1.5));
  const fill = document.querySelector(".mic-level-fill");
  if (fill) {
    fill.style.width = `${level}%`;
  }
  if (level < 10) {
    $("micStatus").textContent = "Дауыс деңгейі төмен";
  } else if (level < 35) {
    $("micStatus").textContent = "Дауыс деңгейі орташа";
  } else {
    $("micStatus").textContent = "Дауыс деңгейі жоғары";
  }
  microphoneAnimation = requestAnimationFrame(updateMicrophone);
}
updateMicrophone();

} catch (error) {
alert(“Микрофон қосылмады. Браузерден рұқсат беріңіз.”);
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

if (audioContext) {
audioContext.close();
audioContext = null;
}

const fill = document.querySelector(”.mic-level-fill”);

if (fill) fill.style.width = “0%”;
}

// ——————————
// 17. МЕДИА ҚҰРАЛДАРЫН ТОҚТАТУ
// ——————————

function stopMedia() {
if (cameraStream) {
cameraStream.getTracks().forEach(track => track.stop());
cameraStream = null;
}

if ($(“cameraVideo”)) {
$(“cameraVideo”).srcObject = null;
}

if ($(“cameraButton”)) {
$(“cameraButton”).textContent = “Камераны қосу”;
}

stopMicrophone();

if ($(“microphoneButton”)) {
$(“microphoneButton”).textContent = “Микрофонды қосу”;
}
}

// ——————————
// 18. СЕРГІТУ СӘТІ
// ——————————

const relaxationVideos = [
{
title: “Қимыл-қозғалыс жаттығуы”,
text: “Балаларға арналған сергіту жаттығуын таңдаңыз.”
},
{
title: “Би жаттығуы”,
text: “Музыка ырғағымен қимыл жасаңыз.”
},
{
title: “Ән айту”,
text: “Әнді тыңдап, бірге айтуға болады.”
}
];

let relaxationIndex = 0;

function renderRelaxation() {
const item = relaxationVideos[relaxationIndex];

$(“danceVideo”).innerHTML = <p>${escapeHTML(item.text)}</p>;

$(“singingVideo”).innerHTML = <p>Ән айтуға арналған бейнематериал осы бөлімге орналастырылады.</p>;

$(“movementVideo”).innerHTML = <p>Қимыл-қозғалыс бейнематериалы осы бөлімге орналастырылады.</p>;

relaxationIndex =
(relaxationIndex + 1) % relaxationVideos.length;
}

// ——————————
// 19. ҰСАҚ МОТОРИКА ОЙЫНДАРЫ
// ——————————

function startMotorGame(game) {
const area = $(“motorGameArea”);

if (!area) return;

switch (game) {
case “puzzle”:
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

// 19.1. САНДАРДЫ ОРНЫНА ҚОЮ ОЙЫНЫ

function createPuzzleGame(area) {
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, “”];

area.innerHTML = <h3>🧩 Сандарды ретімен орналастыр</h3> <p>Бос ұяшықты пайдаланып, сандарды дұрыс ретке келтір.</p> <div class="puzzle-grid" id="puzzleGrid"></div> <button class="secondary-button" id="shufflePuzzle">Қайта бастау</button>;

const grid = $(“puzzleGrid”);

function shuffle() {
let values = [1, 2, 3, 4, 5, 6, 7, 8, “”];

for (let i = values.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [values[i], values[j]] = [values[j], values[i]];
}
return values;

}

let tiles = shuffle();

function draw() {
grid.innerHTML = “”;

tiles.forEach((value, index) => {
  const button = document.createElement("button");
  button.className = "puzzle-tile";
  button.textContent = value;
  if (value === "") {
    button.classList.add("empty");
  }
  button.addEventListener("click", () => {
    const emptyIndex = tiles.indexOf("");
    const row = Math.floor(index / 3);
    const col = index % 3;
    const emptyRow = Math.floor(emptyIndex / 3);
    const emptyCol = emptyIndex % 3;
    const distance =
      Math.abs(row - emptyRow) +
      Math.abs(col - emptyCol);
    if (distance === 1) {
      [tiles[index], tiles[emptyIndex]] =
        [tiles[emptyIndex], tiles[index]];
      draw();
    }
    if (tiles.join(",") === "1,2,3,4,5,6,7,8,") {
      alert("Жарайсың! Пазлды аяқтадың!");
    }
  });
  grid.appendChild(button);
});

}

$(“shufflePuzzle”).addEventListener(“click”, () => {
tiles = shuffle();
draw();
});

draw();
}

// 19.2. ЛАБИРИНТ

function createMazeGame(area) {
area.innerHTML = <h3>🌀 Лабиринттен жол тап</h3> <p>Бастапқы нүктеден мәреге жет.</p> <div class="maze-grid" id="mazeGrid"></div> <p id="mazeStatus">Бастау нүктесін тап.</p>;

const map = [
[0, 1, 0, 0, 0],
[0, 1, 0, 1, 0],
[0, 0, 0, 1, 0],
[1, 1, 0, 1, 0],
[0, 0, 0, 0, 2]
];

const grid = $(“mazeGrid”);

map.forEach((row, r) => {
row.forEach((cell, c) => {
const button = document.createElement(“button”);
button.className = “maze-cell”;

  if (cell === 1) {
    button.classList.add("wall");
    button.textContent = "⬛";
  }
  if (cell === 0) button.textContent = "·";
  if (cell === 2) button.textContent = "🏁";
  button.addEventListener("click", () => {
    if (cell === 1) {
      $("mazeStatus").textContent = "Бұл жол жабық. Басқа жолды таңда.";
      return;
    }
    button.classList.add("visited");
    if (cell === 2) {
      $("mazeStatus").textContent = "Тамаша! Мәреге жеттің!";
    } else {
      $("mazeStatus").textContent = `Таңдалған ұяшық: ${r + 1}, ${c + 1}`;
    }
  });
  grid.appendChild(button);
});

});
}

// 19.3. НҮКТЕЛЕРДІ ҚОСУ

function createDotsGame(area) {
area.innerHTML = <h3>✏️ Нүктелерді ретімен бас</h3> <p>1-ден 6-ға дейінгі нүктелерді ретімен таңда.</p> <div class="dots-game" id="dotsGame"></div> <p id="dotsStatus">1-нүктеден баста.</p>;

const positions = [
[20, 20],
[70, 20],
[70, 50],
[45, 75],
[20, 50],
[20, 20]
];

let next = 1;

const game = $(“dotsGame”);

positions.forEach((position, index) => {
const button = document.createElement(“button”);

button.className = "dot-point";
button.textContent = index + 1;
button.style.left = `${position[0]}%`;
button.style.top = `${position[1]}%`;
button.addEventListener("click", () => {
  if (index + 1 === next) {
    button.classList.add("visited");
    next++;
    $("dotsStatus").textContent =
      next > positions.length
        ? "Керемет! Барлық нүктені қостың!"
        : `${next}-нүктені таңда.`;
  } else {
    $("dotsStatus").textContent =
      `Алдымен ${next}-нүктені таңда.`;
  }
});
game.appendChild(button);

});
}

// 19.4. СУРЕТТІ БОЯУ

function createColoringGame(area) {
area.innerHTML = <h3>🎨 Суретті боя</h3> <p>Түсті таңдап, суретті өз қалауыңша боя.</p> <div class="color-palette"> <button data-color="#ff6b6b" style="background:#ff6b6b"></button> <button data-color="#4dabf7" style="background:#4dabf7"></button> <button data-color="#51cf66" style="background:#51cf66"></button> <button data-color="#ffd43b" style="background:#ffd43b"></button> <button data-color="#b197fc" style="background:#b197fc"></button> </div> <canvas id="colorCanvas" width="320" height="260"></canvas> <button class="secondary-button" id="clearColoring">Тазалау</button>;

const canvas = $(“colorCanvas”);
const ctx = canvas.getContext(“2d”);

let color = “#ff6b6b”;
let drawing = false;

ctx.fillStyle = “#ffffff”;
ctx.fillRect(0, 0, canvas.width, canvas.height);

document.querySelectorAll(”[data-color]”).forEach(button => {
button.addEventListener(“click”, () => {
color = button.dataset.color;
});
});

function getPosition(event) {
const rect = canvas.getBoundingClientRect();

const point = event.touches
  ? event.touches[0]
  : event;
return {
  x: (point.clientX - rect.left) *
    (canvas.width / rect.width),
  y: (point.clientY - rect.top) *
    (canvas.height / rect.height)
};

}

function startDrawing(event) {
drawing = true;
const pos = getPosition(event);

ctx.beginPath();
ctx.moveTo(pos.x, pos.y);

}

function draw(event) {
if (!drawing) return;

event.preventDefault();
const pos = getPosition(event);
ctx.lineWidth = 8;
ctx.lineCap = "round";
ctx.strokeStyle = color;
ctx.lineTo(pos.x, pos.y);
ctx.stroke();

}

function stopDrawing() {
drawing = false;
}

canvas.addEventListener(“mousedown”, startDrawing);
canvas.addEventListener(“mousemove”, draw);
canvas.addEventListener(“mouseup”, stopDrawing);
canvas.addEventListener(“mouseleave”, stopDrawing);

canvas.addEventListener(“touchstart”, startDrawing, { passive: false });
canvas.addEventListener(“touchmove”, draw, { passive: false });
canvas.addEventListener(“touchend”, stopDrawing);

$(“clearColoring”).addEventListener(“click”, () => {
ctx.clearRect(0, 0, canvas.width, canvas.height);
});
}

// 19.5. ЕСТЕ САҚТАУ

function createMemoryGame(area) {
const symbols = [“🍎”, “🍌”, “🍇”, “🍓”, “🍎”, “🍌”, “🍇”, “🍓”];

const cards = […symbols].sort(() => Math.random() - 0.5);

area.innerHTML = <h3>🧠 Есте сақтау ойыны</h3> <p>Бірдей суреттерді тап.</p> <div class="memory-grid" id="memoryGrid"></div>;

const grid = $(“memoryGrid”);

let first = null;
let lock = false;
let matched = 0;

cards.forEach(symbol => {
const button = document.createElement(“button”);

button.className = "memory-card";
button.textContent = "?";
button.addEventListener("click", () => {
  if (lock || button.classList.contains("matched") ||
      button === first) return;
  button.textContent = symbol;
  if (!first) {
    first = button;
    return;
  }
  if (first.textContent === button.textContent) {
    first.classList.add("matched");
    button.classList.add("matched");
    first = null;
    matched += 2;
    if (matched === cards.length) {
      setTimeout(() => alert("Жарайсың! Барлық жұпты таптың!"), 200);
    }
  } else {
    lock = true;
    const previous = first;
    first = null;
    setTimeout(() => {
      previous.textContent = "?";
      button.textContent = "?";
      lock = false;
    }, 800);
  }
});
grid.appendChild(button);

});
}

// 19.6. ТОПТАСТЫРУ

function createSortingGame(area) {
const items = [
{ name: “🍎”, type: “fruit” },
{ name: “🍌”, type: “fruit” },
{ name: “🚗”, type: “transport” },
{ name: “🚌”, type: “transport” },
{ name: “🍇”, type: “fruit” },
{ name: “🚲”, type: “transport” }
];

area.innerHTML = `
📦 Заттарды топтастыр
Жемістер мен көліктерді тиісті топқа орналастыр.

<div class="sorting-items" id="sortingItems"></div>
<div class="sorting-groups">
  <div class="sorting-group" data-type="fruit">
    <h4>🍎 Жемістер</h4>
    <div class="sorting-drop"></div>
  </div>
  <div class="sorting-group" data-type="transport">
    <h4>🚗 Көліктер</h4>
    <div class="sorting-drop"></div>
  </div>
</div>
<p id="sortingStatus"></p>

`;

const itemsArea = $(“sortingItems”);

items.forEach((item, index) => {
const button = document.createElement(“button”);

button.className = "sorting-item";
button.textContent = item.name;
button.addEventListener("click", () => {
  const type = prompt(
    "Қай топқа жатады?\n1 — Жемістер\n2 — Көліктер"
  );
  const correct =
    (type === "1" && item.type === "fruit") ||
    (type === "2" && item.type === "transport");
  if (correct) {
    button.disabled = true;
    button.textContent += " ✓";
    const group = document.querySelector(
      `.sorting-group[data-type="${item.type}"] .sorting-drop`
    );
    group.appendChild(button);
    if (itemsArea.children.length === 0) {
      $("sortingStatus").textContent = "Тамаша! Барлығын дұрыс топтастырдың!";
    }
  } else {
    $("sortingStatus").textContent = "Қайта ойланып көр!";
  }
});
itemsArea.appendChild(button);

});
}

// ——————————
// 20. ДИПЛОМ
// ——————————

function openDiploma() {
const data = getSpeechData();
const soundKeys = getSoundOrder(data);

let totalTasks = 0;
let completedTasks = 0;
let successfulTasks = 0;

soundKeys.forEach(soundKey => {
const stages = getStages(getSoundData(soundKey));

stages.forEach((stage, stageIndex) => {
  const tasks = getTasks(stage);
  tasks.forEach((task, taskIndex) => {
    totalTasks++;
    const saved = getSavedTask(
      soundKey,
      stageIndex,
      taskIndex
    );
    if (saved?.completed) {
      completedTasks++;
      if (saved.score > 0) {
        successfulTasks++;
      }
    }
  });
});

});

if (totalTasks === 0) {
alert(“Диплом алу үшін алдымен тапсырмалар data.js файлына енгізілуі керек.”);
return;
}

if (completedTasks !== totalTasks || successfulTasks !== totalTasks) {
alert(
Диплом алу үшін барлық тапсырманы орындау қажет.\n\n +
Орындалғаны: ${completedTasks} / ${totalTasks}\n +
Оң нәтиже: ${successfulTasks} / ${totalTasks}
);
return;
}

showPage(“diplomaPage”);
}

// ——————————
// 21. ҚАУІПСІЗ МӘТІН
// ——————————

function escapeHTML(value) {
return String(value).replace(/[&<>”’]/g, character => {
const entities = {
“&”: “&”,
“<”: “<”,
“>”: “>”,
‘”’: “"”,
“’”: “'”
};

return entities[character];

});
}

// ——————————
// 22. БАҒДАРЛАМАНЫ ІСКЕ ҚОСУ
// ——————————

document.addEventListener(“DOMContentLoaded”, () => {
initializeProgram();
});

window.addEventListener(“beforeunload”, () => {
stopMedia();
});
