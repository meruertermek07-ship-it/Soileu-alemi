let selectedSound = null;
let selectedStage = null;

const home = document.getElementById("home");
const soundsPage = document.getElementById("soundsPage");
const stagesPage = document.getElementById("stagesPage");
const tasksPage = document.getElementById("tasksPage");

function hideAll() {
  home.classList.add("hidden");
  soundsPage.classList.add("hidden");
  stagesPage.classList.add("hidden");
  tasksPage.classList.add("hidden");
}

function startJourney() {
  hideAll();
  soundsPage.classList.remove("hidden");
  showSounds();
}

function showSounds() {
  const grid = document.getElementById("soundGrid");
  grid.innerHTML = "";

  programData.forEach((sound, index) => {
    grid.innerHTML += `
      <div class="card">
        <div style="font-size:45px">${sound.icon}</div>
        <h2>${sound.letter} дыбысы</h2>
        <p>${sound.name}</p>
        <button onclick="openSound(${index})">Таңдау</button>
      </div>
    `;
  });
}

function openSound(index) {
  selectedSound = programData[index];
  hideAll();
  stagesPage.classList.remove("hidden");

  document.getElementById("selectedTitle").innerText =
    selectedSound.letter + " дыбысы — " + selectedSound.name;

  const grid = document.getElementById("stageGrid");
  grid.innerHTML = "";

  selectedSound.stages.forEach((stage, i) => {
    grid.innerHTML += `
      <div class="card">
        <h2>${i + 1}-кезең</h2>
        <p>${stage.title}</p>
        <button onclick="openStage(${i})">Бастау</button>
      </div>
    `;
  });
}

function openStage(index) {
  selectedStage = selectedSound.stages[index];
  hideAll();
  tasksPage.classList.remove("hidden");

  document.getElementById("taskTitle").innerText =
    selectedSound.letter + " — " + selectedStage.title;

  renderTasks();
}

function renderTasks() {
  const grid = document.getElementById("taskGrid");
  grid.innerHTML = "";

  selectedStage.tasks.forEach((task, index) => {
    grid.innerHTML += `
      <div class="card task-card">
        <h3>${task.id}. ${task.title}</h3>
        <p>${task.description}</p>
        <button onclick="completeTask(${index})">
          ${task.completed ? "Орындалды ✓" : "Орындадым"}
        </button>
      </div>
    `;
  });

  updateProgress();
}

function completeTask(index) {
  selectedStage.tasks[index].completed = true;
  saveProgress();
  renderTasks();
}

function updateProgress() {
  const completed = selectedStage.tasks.filter(t => t.completed).length;
  const percent = completed * 10;

  document.getElementById("progressBar").style.width = percent + "%";
  document.getElementById("progressText").innerText =
    `Орындалды: ${completed}/10 (${percent}%)`;
}

function saveProgress() {
  localStorage.setItem("soileuProgress", JSON.stringify(programData));
}

function speak(text) {
  if (!("speechSynthesis" in window)) {
    alert("Бұл браузерде дыбыстау мүмкіндігі жоқ.");
    return;
  }

  const message = new SpeechSynthesisUtterance(text);
  message.lang = "kk-KZ";
  speechSynthesis.speak(message);
}

function goBackToSounds() {
  startJourney();
}

function goBackToStages() {
  openSound(programData.indexOf(selectedSound));
}

function startCamera() {
  const video = document.getElementById("camera");

  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      video.srcObject = stream;
    })
    .catch(() => {
      alert("Камераға рұқсат берілмеді. Браузер баптауларын тексеріңіз.");
    });
}

function startMicrophone() {
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      alert("Микрофон қосылды! Дыбысты айтып көр.");
      stream.getTracks().forEach(track => track.stop());
    })
    .catch(() => {
      alert("Микрофонға рұқсат берілмеді.");
    });
}
