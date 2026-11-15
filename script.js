/* =====================================================
   СӨЙЛЕУ ӘЛЕМІНЕ САЯХАТ
   Негізгі басқару жүйесі
   ===================================================== */


/* ---------- 1. НЕГІЗГІ ДЕРЕКТЕР ---------- */

const SOUND_ORDER = [
  "R", "L", "G", "GH", "K",
  "Q", "SH", "ZH", "Z", "S"
];

const SOUND_NAMES = {
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

const STORAGE_KEY = "soileuSayahatyProgress";

let currentSound = null;
let currentStage = 0;
let currentTaskIndex = 0;

let completedTasks = [];
let taskScores = {};

let cameraStream = null;
let microphoneStream = null;
let audioContext = null;
let microphoneAnimation = null;
let speechUtterance = null;


/* ---------- 2. САҚТАЛҒАН ПРОГРЕСТІ ЖҮКТЕУ ---------- */

function loadProgress() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const data = JSON.parse(saved);

      completedTasks = Array.isArray(data.completedTasks)
        ? [...new Set(data.completedTasks)]
        : [];

      taskScores = data.taskScores || {};
    }
  } catch (error) {
    console.error("Прогресті жүктеу қатесі:", error);

    completedTasks = [];
    taskScores = {};
  }
}

function saveProgress() {
  const data = {
    completedTasks,
    taskScores
  };

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(data)
  );
}

loadProgress();


/* ---------- 3. HTML ЭЛЕМЕНТТЕРІМЕН ЖҰМЫС ---------- */

function getElement(id) {
  return document.getElementById(id);
}

function setText(id, value) {
  const element = getElement(id);

  if (element) {
    element.textContent = value ?? "";
  }
}

function showSection(id, show) {
  const element = getElement(id);

  if (element) {
    element.classList.toggle("hidden", !show);
  }
}


/* ---------- 4. БЕТТЕР АРАСЫНДА АУЫСУ ---------- */

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.add("hidden");
  });

  const target = getElement(pageId);

  if (target) {
    target.classList.remove("hidden");
  }

  stopCamera();
  stopMicrophone();
  stopSpeechSample();
}

function goHome() {
  showPage("homePage");
}

function startJourney() {
  showPage("soundPage");
  renderSoundMenu();
}

function openRelaxation() {
  showPage("relaxationPage");
  showSection("relaxationMenu", true);
  showSection("relaxationGame", false);
  renderRelaxationMenu();
}

function openMotorSkills() {
  showPage("motorPage");
  showSection("motorMenu", true);
  showSection("motorGame", false);
  renderMotorMenu();
}

function openAssessment() {
  showPage("assessmentPage");
  renderAssessment();
}


/* ---------- 5. ДЫБЫСТАР МӘЗІРІ ---------- */

function renderSoundMenu() {
  const container = getElement("soundMenu");

  if (!container) return;

  container.innerHTML = "";

  SOUND_ORDER.forEach((soundKey, index) => {
    const soundData = speechTasks[soundKey];

    if (!soundData) {
      console.error("Дыбыс дерегі табылмады:", soundKey);
      return;
    }

    const button = document.createElement("button");

    button.className = "sound-card";

    button.innerHTML = `
      <span class="sound-card-number">${index + 1}</span>
      <span class="sound-card-letter">
        ${SOUND_NAMES[soundKey]}
      </span>
      <span class="sound-card-title">
        ${soundData.title || SOUND_NAMES[soundKey] + " дыбысы"}
      </span>
    `;

    button.addEventListener("click", () => {
      selectSound(soundKey);
    });

    container.appendChild(button);
  });
}


/* ---------- 6. ДЫБЫСТЫ ТАҢДАУ ---------- */

function selectSound(soundKey) {
  if (!speechTasks[soundKey]) {
    alert("Бұл дыбыс бойынша тапсырмалар табылмады.");
    return;
  }

  currentSound = soundKey;
  currentStage = 0;
  currentTaskIndex = 0;

  showPage("taskPage");

  renderStageMenu();
  renderTask();
}


/* ---------- 7. КЕЗЕҢДЕР МӘЗІРІ ---------- */

function renderStageMenu() {
  const container = getElement("stageMenu");

  if (!container || !currentSound) return;

  const soundData = speechTasks[currentSound];

  container.innerHTML = "";

  soundData.stages.forEach((stage, index) => {
    const button = document.createElement("button");

    button.className = "stage-card";

    if (index === currentStage) {
      button.classList.add("active");
    }

    const completed = getStageCompletedCount(index);

    button.innerHTML = `
      <strong>${stage.name}</strong>
      <span>${completed}/10 тапсырма</span>
    `;

    button.addEventListener("click", () => {
      currentStage = index;
      currentTaskIndex = 0;

      renderStageMenu();
      renderTask();
    });

    container.appendChild(button);
  });
}


/* ---------- 8. АҒЫМДАҒЫ ТАПСЫРМАНЫ АЛУ ---------- */

function getCurrentStageData() {
  if (!currentSound) return null;

  const soundData = speechTasks[currentSound];

  if (!soundData || !soundData.stages) return null;

  return soundData.stages[currentStage] || null;
}

function getCurrentTask() {
  const stage = getCurrentStageData();

  if (!stage || !Array.isArray(stage.tasks)) {
    return null;
  }

  return stage.tasks[currentTaskIndex] || null;
}

function getTaskKey(task) {
  return task.id;
}


/* ---------- 9. ТАПСЫРМАНЫ КӨРСЕТУ ---------- */

function renderTask() {
  const stage = getCurrentStageData();
  const task = getCurrentTask();

  if (!stage || !task) {
    alert("Бұл кезеңде тапсырмалар табылмады.");
    return;
  }

  setText("stageTitle", stage.name);

  setText(
    "taskCounter",
    `Тапсырма ${currentTaskIndex + 1} / 10`
  );

  setText("taskCategory", task.category);
  setText("taskName", task.title);
  setText("taskGoal", task.goal);
  setText("taskInstruction", task.instruction);
  setText("taskExample", task.example);
  setText("taskVisual", task.visual);
  setText("taskHint", task.help);

  const completed = completedTasks.includes(getTaskKey(task));

  const score = taskScores[getTaskKey(task)];

  setText(
    "taskScoreMessage",
    score !== undefined
      ? `Қойылған баға: ${score}/3`
      : "Тапсырманы маман бағалайды."
  );

  const completeButton = document.querySelector(
    '[onclick="completeTask()"]'
  );

  if (completeButton) {
    completeButton.textContent = completed
      ? "Келесі тапсырма"
      : "Тапсырманы аяқтау";
  }

  showTaskSections(task);

  updateTaskProgress();
  renderStageMenu();
}


/* ---------- 10. ТАПСЫРМА БӨЛІМДЕРІ ---------- */

function showTaskSections(task) {
  const category = String(task.category || "").toLowerCase();

  const articulation =
    category.includes("артикуляция") ||
    Boolean(task.articulation);

  const breathing =
    category.includes("тыныс") ||
    Boolean(task.breathing);

  const camera =
    articulation ||
    Boolean(task.camera);

  const microphone =
    breathing ||
    Boolean(task.microphone);

  showSection("articulationSection", articulation);
  showSection("cameraSection", camera);
  showSection("microphoneSection", microphone);
  showSection("breathingSection", breathing);

  setText(
    "articulationDescription",
    task.articulation || task.help
  );

  setText(
    "articulationVisual",
    task.articulation || "Артикуляциялық үлгіні мұқият қара."
  );

  setText(
    "speechSample",
    task.sample || task.example
  );

  setText(
    "microphoneMessage",
    "Микрофон дыбыс деңгейін көрсетеді. Ол дыбыстың дұрыс айтылғанын анықтамайды."
  );

  resetBreathingAnimation();
}


/* ---------- 11. ТАПСЫРМА ПРОГРЕСІ ---------- */

function updateTaskProgress() {
  const completed = getStageCompletedCount(currentStage);

  const percent = completed * 10;

  const bar = getElement("progressBar");

  if (bar) {
    bar.style.width = percent + "%";
  }

  setText("progressText", percent + "%");
}

function getStageCompletedCount(stageIndex) {
  const soundData = speechTasks[currentSound];

  if (!soundData) return 0;

  const stage = soundData.stages[stageIndex];

  if (!stage) return 0;

  return stage.tasks.filter(task =>
    completedTasks.includes(getTaskKey(task))
  ).length;
}


/* ---------- 12. БАҒАЛАУ ---------- */

function setTaskScore(score) {
  const task = getCurrentTask();

  if (!task) return;

  if (![0, 1, 2, 3].includes(score)) {
    return;
  }

  const key = getTaskKey(task);

  taskScores[key] = score;

  saveProgress();

  setText(
    "taskScoreMessage",
    `Қойылған баға: ${score}/3`
  );

  updateTaskProgress();
  renderAssessment();
}


/* ---------- 13. ТАПСЫРМАНЫ АЯҚТАУ ---------- */

function completeTask() {
  const task = getCurrentTask();

  if (!task) return;

  const key = getTaskKey(task);

  if (taskScores[key] === undefined) {
    alert("Алдымен маман бағалау шкаласы арқылы баға қоюы керек.");
    return;
  }

  if (!completedTasks.includes(key)) {
    completedTasks.push(key);
  }

  saveProgress();

  const stage = getCurrentStageData();

  if (currentTaskIndex < stage.tasks.length - 1) {
    currentTaskIndex++;
    renderTask();
    return;
  }

  if (currentStage < 3) {
    const continueStage = confirm(
      "Кезең аяқталды! Келесі кезеңге өтесіз бе?"
    );

    if (continueStage) {
      currentStage++;
      currentTaskIndex = 0;

      renderStageMenu();
      renderTask();
    }

    return;
  }

  alert("Бұл дыбыстың төрт кезеңі аяқталды!");

  showPage("soundPage");
  renderSoundMenu();
}


/* ---------- 14. АЛДЫҢҒЫ ТАПСЫРМА ---------- */

function previousTask() {
  if (currentTaskIndex > 0) {
    currentTaskIndex--;
    renderTask();
    return;
  }

  if (currentStage > 0) {
    currentStage--;

    const previousStage = getCurrentStageData();

    currentTaskIndex = previousStage.tasks.length - 1;

    renderStageMenu();
    renderTask();
  }
}


/* ---------- 15. КЕЛЕСІ ТАПСЫРМА ---------- */

function nextTask() {
  const stage = getCurrentStageData();

  if (!stage) return;

  if (currentTaskIndex < stage.tasks.length - 1) {
    currentTaskIndex++;
    renderTask();
    return;
  }

  if (currentStage < 3) {
    currentStage++;
    currentTaskIndex = 0;

    renderStageMenu();
    renderTask();
    return;
  }

  alert("Соңғы тапсырмаға жеттіңіз!");
}


/* ---------- 16. КАМЕРАНЫ ҚОСУ ---------- */

async function startCamera() {
  const video = getElement("cameraVideo");

  if (!video) return;

  try {
    stopCamera();

    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user"
      },
      audio: false
    });

    video.srcObject = cameraStream;

    await video.play();

  } catch (error) {
    console.error("Камера қатесі:", error);

    alert(
      "Камера қосылмады. Браузерден камераға рұқсат беріңіз."
    );
  }
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }

  const video = getElement("cameraVideo");

  if (video) {
    video.srcObject = null;
  }
}


/* ---------- 17. ДЫБЫСТЫ ТЫҢДАТУ ---------- */

function playSpeechSample() {
  const task = getCurrentTask();

  if (!task) return;

  const text = task.sample || task.example;

  if (!text) {
    alert("Бұл тапсырмаға дыбыстық үлгі енгізілмеген.");
    return;
  }

  if (!("speechSynthesis" in window)) {
    alert("Бұл браузерде мәтінді дыбыстау қолжетімсіз.");
    return;
  }

  stopSpeechSample();

  speechUtterance = new SpeechSynthesisUtterance(text);

  speechUtterance.lang = "kk-KZ";
  speechUtterance.rate = 0.8;
  speechUtterance.pitch = 1;

  speechSynthesis.speak(speechUtterance);
}

function stopSpeechSample() {
  if ("speechSynthesis" in window) {
    speechSynthesis.cancel();
  }

  speechUtterance = null;
}


/* ---------- 18. МИКРОФОН ---------- */

async function startMicrophone() {
  try {
    stopMicrophone();

    microphoneStream = await navigator.mediaDevices.getUserMedia({
      audio: true
    });

    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      alert("Бұл браузерде микрофонды талдау қолжетімсіз.");
      return;
    }

    audioContext = new AudioContextClass();

    await audioContext.resume();

    const source = audioContext.createMediaStreamSource(
      microphoneStream
    );

    const analyser = audioContext.createAnalyser();

    analyser.fftSize = 1024;

    source.connect(analyser);

    const data = new Uint8Array(analyser.fftSize);

    function measureVolume() {
      analyser.getByteTimeDomainData(data);

      let sum = 0;

      for (let i = 0; i < data.length; i++) {
        const value = (data[i] - 128) / 128;
        sum += value * value;
      }

      const volume = Math.sqrt(sum / data.length);

      const level = Math.min(
        100,
        Math.round(volume * 400)
      );

      const bar = getElement("volumeBar");

      if (bar) {
        bar.style.width = level + "%";
      }

      let message = "Дыбыс деңгейі төмен";

      if (level > 45) {
        message = "Дыбыс деңгейі жоғары";
      } else if (level > 15) {
        message = "Дыбыс деңгейі орташа";
      }

      setText("microphoneStatus", message);
      setText("microphoneMessage", message);

      updateCotton(level);

      microphoneAnimation =
        requestAnimationFrame(measureVolume);
    }

    measureVolume();

  } catch (error) {
    console.error("Микрофон қатесі:", error);

    alert(
      "Микрофон қосылмады. Браузерден микрофонға рұқсат беріңіз."
    );
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

  const bar = getElement("volumeBar");

  if (bar) {
    bar.style.width = "0%";
  }

  setText("microphoneStatus", "Микрофон өшірулі");
}


/* ---------- 19. ТЫНЫС АЛУ АНИМАЦИЯСЫ ---------- */

function updateCotton(level) {
  const cotton = getElement("cotton");

  if (!cotton) return;

  const movement = Math.min(level * 2, 100);

  cotton.style.transform =
    `translate(${movement}px, -${movement * 0.25}px)`;

  if (level > 15) {
    setText("blowMessage", "Жақсы! Дыбыс деңгейі байқалды.");
  } else {
    setText("blowMessage", "Микрофонға жақын сөйлеп көр.");
  }

  setText("blowProgress", Math.min(level, 100) + "%");
}

function resetBreathingAnimation() {
  const cotton = getElement("cotton");

  if (cotton) {
    cotton.style.transform = "translate(0, 0)";
  }

  setText("blowProgress", "0%");
  setText("blowMessage", "Микрофонды қосып көр.");
}


/* ---------- 20. СЕРГІТУ СӘТІ ---------- */

const relaxationActivities = [
  {
    title: "Күнге созыл",
    visual: "☀️",
    instruction: "Қолдарыңды жоғары көтеріп, денеңді жайлап соз. Содан кейін қолдарыңды түсір."
  },
  {
    title: "Көбелек",
    visual: "🦋",
    instruction: "Қолдарыңды екі жаққа созып, көбелектің қанаты сияқты жайлап қозға."
  },
  {
    title: "Ағаштар тербеледі",
    visual: "🌳",
    instruction: "Қолдарыңды жоғары көтер. Оңға және солға жайлап еңкей."
  },
  {
    title: "Жаңбыр тамшылары",
    visual: "🌧️",
    instruction: "Саусақтарыңмен үстелді жайлап тықылдатып, жаңбыр дыбысын бейнеле."
  }
];

function renderRelaxationMenu() {
  const container = getElement("relaxationMenu");

  if (!container) return;

  container.innerHTML = "";

  relaxationActivities.forEach((activity, index) => {
    const button = document.createElement("button");

    button.className = "activity-card";

    button.innerHTML = `
      <span>${activity.visual}</span>
      <strong>${activity.title}</strong>
    `;

    button.addEventListener("click", () => {
      startRelaxationGame(index);
    });

    container.appendChild(button);
  });
}

let currentRelaxationIndex = 0;

function startRelaxationGame(index = 0) {
  currentRelaxationIndex = index;

  const activity = relaxationActivities[index];

  if (!activity) return;

  showSection("relaxationMenu", false);
  showSection("relaxationGame", true);

  setText("relaxationTitle", activity.title);
  setText("relaxationVisual", activity.visual);
  setText("relaxationInstruction", activity.instruction);
}

function nextRelaxationActivity() {
  currentRelaxationIndex++;

  if (currentRelaxationIndex >= relaxationActivities.length) {
    currentRelaxationIndex = 0;
  }

  startRelaxationGame(currentRelaxationIndex);
}


/* ---------- 21. ҰСАҚ МОТОРИКА ---------- */

const motorActivities = [
  {
    title: "Саусақ жаттығуы",
    visual: "✋",
    instruction: "Бас бармақты кезекпен басқа саусақтарға тигіз."
  },
  {
    title: "Моншақ тізу",
    visual: "📿",
    instruction: "Моншақтарды бірінен соң бірін ретімен орналастыр."
  },
  {
    title: "Саусақпен сана",
    visual: "🔢",
    instruction: "Бірден беске дейін саусақтарыңды кезекпен көрсет."
  },
  {
    title: "Өрнек құрастыр",
    visual: "🧩",
    instruction: "Берілген бөлшектерден қарапайым өрнек құрастыр."
  }
];

function renderMotorMenu() {
  const container = getElement("motorMenu");

  if (!container) return;

  container.innerHTML = "";

  motorActivities.forEach((activity, index) => {
    const button = document.createElement("button");

    button.className = "activity-card";

    button.innerHTML = `
      <span>${activity.visual}</span>
      <strong>${activity.title}</strong>
    `;

    button.addEventListener("click", () => {
      startMotorGame(index);
    });

    container.appendChild(button);
  });
}

let currentMotorIndex = 0;

function startMotorGame(index = 0) {
  currentMotorIndex = index;

  const activity = motorActivities[index];

  if (!activity) return;

  showSection("motorMenu", false);
  showSection("motorGame", true);

  setText("motorTitle", activity.title);
  setText("motorVisual", activity.visual);
  setText("motorInstruction", activity.instruction);
  setText("motorResult", "");
}

function checkMotorGame() {
  setText(
    "motorResult",
    "Жаттығу орындалды! Маман баланың әрекетін бақылайды."
  );
}

function nextMotorGame() {
  currentMotorIndex++;

  if (currentMotorIndex >= motorActivities.length) {
    currentMotorIndex = 0;
  }

  startMotorGame(currentMotorIndex);
}


/* ---------- 22. ЖАЛПЫ БАҒАЛАУ ---------- */

function getAllTasks() {
  const allTasks = [];

  SOUND_ORDER.forEach(soundKey => {
    const sound = speechTasks[soundKey];

    if (!sound || !sound.stages) return;

    sound.stages.forEach(stage => {
      if (!Array.isArray(stage.tasks)) return;

      stage.tasks.forEach(task => {
        allTasks.push(task);
      });
    });
  });

  return allTasks;
}

function renderAssessment() {
  const allTasks = getAllTasks();

  const total = allTasks.length;

  const completed = allTasks.filter(task =>
    completedTasks.includes(getTaskKey(task))
  ).length;

  const totalScore = Object.values(taskScores)
    .reduce((sum, score) => sum + Number(score || 0), 0);

  const maxScore = total * 3;

  const percent = total
    ? Math.round((completed / total) * 100)
    : 0;

  setText("totalCompleted", `${completed} / ${total}`);
  setText("totalScore", `${totalScore} / ${maxScore}`);
  setText("totalProgress", percent + "%");

  const bar = getElement("totalProgressBar");

  if (bar) {
    bar.style.width = percent + "%";
  }

  renderSoundResults();
}

function renderSoundResults() {
  const container = getElement("soundResults");

  if (!container) return;

  container.innerHTML = "";

  SOUND_ORDER.forEach(soundKey => {
    const sound = speechTasks[soundKey];

    if (!sound) return;

    let completed = 0;
    let score = 0;

    sound.stages.forEach(stage => {
      stage.tasks.forEach(task => {
        const key = getTaskKey(task);

        if (completedTasks.includes(key)) {
          completed++;
        }

        if (taskScores[key] !== undefined) {
          score += Number(taskScores[key]);
        }
      });
    });

    const row = document.createElement("div");

    row.className = "sound-result-row";

    row.innerHTML = `
      <strong>${SOUND_NAMES[soundKey]} дыбысы</strong>
      <span>${completed}/40 тапсырма</span>
      <span>Ұпай: ${score}/120</span>
    `;

    container.appendChild(row);
  });
}


/* ---------- 23. ДИПЛОМ ---------- */

function openDiploma() {
  showPage("diplomaPage");

  const allTasks = getAllTasks();

  const completed = allTasks.filter(task =>
    completedTasks.includes(getTaskKey(task))
  ).length;

  const percent = allTasks.length
    ? Math.round((completed / allTasks.length) * 100)
    : 0;

  setText("diplomaProgress", percent + "%");

  setText(
    "diplomaDate",
    new Date().toLocaleDateString("kk-KZ")
  );
}

function printDiploma() {
  window.print();
}


/* ---------- 24. ДЕРЕКТЕРДІ ТЕКСЕРУ ---------- */

function validateSpeechTasks() {
  const errors = [];
  const allIds = [];

  SOUND_ORDER.forEach(soundKey => {
    const sound = speechTasks[soundKey];

    if (!sound) {
      errors.push(`${soundKey}: дыбыс дерегі жоқ`);
      return;
    }

    if (!Array.isArray(sound.stages)) {
      errors.push(`${soundKey}: кезеңдер массиві жоқ`);
      return;
    }

    if (sound.stages.length !== 4) {
      errors.push(`${soundKey}: 4 кезең болуы керек`);
    }

    sound.stages.forEach((stage, stageIndex) => {
      if (!Array.isArray(stage.tasks)) {
        errors.push(`${soundKey}, ${stageIndex + 1}-кезең: тапсырмалар жоқ`);
        return;
      }

      if (stage.tasks.length !== 10) {
        errors.push(
          `${soundKey}, ${stageIndex + 1}-кезең: ${stage.tasks.length} тапсырма`
        );
      }

      stage.tasks.forEach(task => {
        if (!task.id) {
          errors.push(`${soundKey}: ID көрсетілмеген`);
        } else {
          allIds.push(task.id);
        }

        [
          "category",
          "title",
          "goal",
          "instruction",
          "example",
          "visual"
        ].forEach(field => {
          if (!task[field]) {
            errors.push(`${task.id || "ID жоқ"}: ${field} толтырылмаған`);
          }
        });
      });
    });
  });

  const uniqueIds = new Set(allIds);

  if (uniqueIds.size !== allIds.length) {
    errors.push("Қайталанатын тапсырма ID-лері бар.");
  }

  console.log("Жалпы тапсырма саны:", allIds.length);

  if (errors.length) {
    console.error("Тексеру нәтижесі:", errors);
  } else {
    console.log("Барлық тапсырма құрылымы дұрыс.");
  }

  return errors;
}


/* ---------- 25. САЙТТЫ ІСКЕ ҚОСУ ---------- */

document.addEventListener("DOMContentLoaded", () => {
  if (typeof speechTasks === "undefined") {
    console.error(
      "speechTasks табылмады. data.js файлын тексеріңіз."
    );

    return;
  }

  renderSoundMenu();

  console.log(
    "Сөйлеу әлеміне саяхат іске қосылды."
  );

  validateSpeechTasks();
});
