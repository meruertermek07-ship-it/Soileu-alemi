let selectedSound = null;
let selectedStage = null;

const home = document.getElementById("home");
const soundsPage = document.getElementById("soundsPage");
const stagesPage = document.getElementById("stagesPage");
const tasksPage = document.getElementById("tasksPage");

function hideAll() {
  [home, soundsPage, stagesPage, tasksPage]
    .forEach(page => page.classList.add("hidden"));
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
      <div class="card sound-card">
        <div class="world-icon">${sound.icon}</div>
        <h2>${sound.letter} дыбысы</h2>
        <p>${sound.world}</p>
        <button onclick="openSound(${index})">
          Әлемге кіру
        </button>
      </div>
    `;
  });
}

function openSound(index) {
  selectedSound = programData[index];

  hideAll();
  stagesPage.classList.remove("hidden");

  document.getElementById("selectedTitle").innerText =
    selectedSound.letter + " дыбысы — " + selectedSound.world;

  const grid = document.getElementById("stageGrid");
  grid.innerHTML = "";

  selectedSound.stages.forEach((stage, i) => {
    const completed = stage.tasks.filter(t => isDone(t.id)).length;

    grid.innerHTML += `
      <div class="card stage-card">
        <div class="world-icon">🌟</div>
        <h3>${i + 1}-кезең</h3>
        <p>${stage.title}</p>
        <p>${completed}/10 тапсырма</p>
        <button onclick="openStage(${i})">
          Бастау
        </button>
      </div>
    `;
  });
}

function isDone(id) {
  const done = JSON.parse(
    localStorage.getItem("soileuDone") || "[]"
  );
  return done.includes(id);
}

function markDone(id) {
  const done = JSON.parse(
    localStorage.getItem("soileuDone") || "[]"
  );

  if (!done.includes(id)) {
    done.push(id);
  }

  localStorage.setItem("soileuDone", JSON.stringify(done));
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
    const done = isDone(task.id);

    grid.innerHTML += `
      <div class="card task-card ${done ? "completed" : ""}">
        <div class="task-animation ${task.animation}">
          ${task.icon}
        </div>

        <h3>${task.number}. ${task.title}</h3>

        <p>${task.question}</p>
        <p>${task.instruction}</p>

        ${
          task.type === "choice"
          ? `
            <div class="answer-options">
              ${task.options.map(option => `
                <button onclick="checkAnswer('${task.id}', '${option}', '${task.answer}', this)">
                  ${option}
                </button>
              `).join("")}
            </div>
          `
          : `
            <div class="practice-word">
              ${task.word || task.syllable || selectedSound.letter}
            </div>

            <button onclick="speak('${task.word || task.syllable || selectedSound.letter}')">
              🔊 Тыңдау
            </button>

            <button onclick="finishSpeaking('${task.id}', this)">
              Орындадым ✓
            </button>
          `
        }

        <div class="feedback" id="feedback-${task.id}">
          ${done ? "⭐ Орындалды!" : ""}
        </div>
      </div>
    `;
  });

  updateProgress();
}

function checkAnswer(id, selected, correct, button) {
  const feedback = document.getElementById("feedback-" + id);

  if (selected === correct) {
    markDone(id);
    feedback.innerHTML = "🎉 Дұрыс! Жарайсың! ⭐";
    button.classList.add("correct");
    button.closest(".task-card").classList.add("celebrate");
    updateProgress();
  } else {
    feedback.innerHTML = "😊 Қайта ойланып көр!";
    button.classList.add("wrong");
  }
}

function finishSpeaking(id, button) {
  markDone(id);
  button.innerText = "Орындалды ✓";
  button.disabled = true;

  const feedback = document.getElementById("feedback-" + id);
  feedback.innerHTML = "🌟 Тамаша! Жаттығу орындалды!";

  button.closest(".task-card").classList.add("celebrate");
  updateProgress();
}

function updateProgress() {
  const completed = selectedStage.tasks.filter(
    task => isDone(task.id)
  ).length;

  const percent = completed * 10;

  document.getElementById("progressBar").style.width =
    percent + "%";

  document.getElementById("progressText").innerText =
    `⭐ ${completed}/10 тапсырма орындалды — ${percent}%`;
}

function speak(text) {
  if (!("speechSynthesis" in window)) {
    alert("Бұл браузер дыбыстауды қолдамайды.");
    return;
  }

  speechSynthesis.cancel();

  const voice = new SpeechSynthesisUtterance(text);
  voice.lang = "kk-KZ";
  voice.rate = 0.8;

  speechSynthesis.speak(voice);
}

function goBackToSounds() {
  startJourney();
}

function goBackToStages() {
  openSound(programData.indexOf(selectedSound));
}
