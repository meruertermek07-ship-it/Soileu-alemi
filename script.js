let currentSound = “”;
let currentStage = “”;
let currentTask = null;
let completed = 0;
let errors = [];

function hideAll() {
document.querySelectorAll(“main section”).forEach(s => s.classList.add(“hidden”));
}

function showSounds() {
hideAll();
document.getElementById(“sounds”).classList.remove(“hidden”);

const list = document.getElementById("soundList");
list.innerHTML = "";
sounds.forEach(sound => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = "🔤 " + sound;
    card.onclick = () => selectSound(sound);
    list.appendChild(card);
});

}

function selectSound(sound) {
currentSound = sound;
hideAll();
document.getElementById(“stages”).classList.remove(“hidden”);
document.getElementById(“selectedSound”).textContent =
sound + “ дыбысымен жұмыс”;

const list = document.getElementById("stageList");
list.innerHTML = "";
stages.forEach(stage => {
    const card = document.createElement("div");
    card.className = "card";
    card.textContent = stage;
    card.onclick = () => openStage(stage);
    list.appendChild(card);
});

}

function openStage(stage) {
currentStage = stage;
hideAll();
document.getElementById(“tasks”).classList.remove(“hidden”);
document.getElementById(“stageTitle”).textContent = stage;

const list = document.getElementById("taskList");
list.innerHTML = "";
let taskArray = tasksData[stage];
for (let i = 0; i < 10; i++) {
    const task = taskArray[i % taskArray.length];
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `⭐ ${i + 1}-тапсырма<br>${task.title}`;
    card.onclick = () => openTask(task, i + 1);
    list.appendChild(card);
}

}

function openTask(task, number) {
currentTask = task;
hideAll();

document.getElementById("taskDetail").classList.remove("hidden");
document.getElementById("detailTitle").textContent =
    number + "-тапсырма: " + task.title;
document.getElementById("detailContent").innerHTML = `
    <div style="font-size:65px">${task.visual}</div>
    <h3>🎯 Мақсаты</h3>
    <p>${task.goal}</p>
    <h3>📖 Орындау ережесі</h3>
    <p>${task.instruction}</p>
    <h3>⚠️ Қателермен жұмыс</h3>
    <p>${task.error}</p>
`;
document.getElementById("feedback").textContent = "";

}

function completeTask() {
completed++;
document.getElementById(“feedback”).innerHTML =
“🌟 Тапсырма орындалды! Логопед нәтижені тексерсін.”;
}

function backToSounds() {
showSounds();
}

function backToStages() {
selectSound(currentSound);
}

function backToTasks() {
openStage(currentStage);
}

function showDiploma() {
hideAll();
document.getElementById(“diploma”).classList.remove(“hidden”);
document.getElementById(“diplomaResult”).textContent =
“Орындалған тапсырмалар саны: “ + completed;
}

function showResults() {
hideAll();
document.getElementById(“results”).classList.remove(“hidden”);
document.getElementById(“resultText”).textContent =
“Орындалған тапсырмалар: “ + completed;
}
