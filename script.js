/* ==========================================
   СӨЙЛЕУ ӘЛЕМІНЕ САЯХАТ
   НЕГІЗГІ БАСҚАРУ ЖҮЙЕСІ
   ========================================== */


/* ==========================================
   1. НЕГІЗГІ АЙНЫМАЛЫЛАР
   ========================================== */

let currentSound = null;
let currentStage = 0;
let currentTask = 0;

let cameraStream = null;
let microphoneStream = null;
let audioContext = null;
let microphoneAnimation = null;

let selectedScores = JSON.parse(
  localStorage.getItem("speechScores") || "{}"
);

let completedTasks = JSON.parse(
  localStorage.getItem("completedTasks") || "[]"
);

const soundLabels = {
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


/* ==========================================
   2. БЕТТЕРДІ БАСҚАРУ
   ========================================== */

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.add("hidden");
  });

  const page = document.getElementById(pageId);

  if (page) {
    page.classList.remove("hidden");
  }

  stopCamera();
  stopMicrophone();
  stopSpeechSample();
}

function startJourney() {
  showPage("soundPage");
  renderSoundMenu();
}

function openRelaxation() {
  showPage("relaxationPage");
  renderRelaxationMenu();
}

function openMotorSkills() {
  showPage("motorPage");
  renderMotorMenu();
}

function openAssessment() {
  showPage("assessmentPage");
  renderAssessment();
}


/* ==========================================
   3. ДЫБЫСТАР МӘЗІРІ
   ========================================== */

function renderSoundMenu() {
  const menu = document.getElementById("soundMenu");

  if (!menu) return;

  menu.innerHTML = "";

  SOUND_ORDER.forEach(key => {
    const soundData = speechTasks[key];

    if (!soundData) return;

    const button = document.createElement("button");

    button.className = "sound-card";

    button.innerHTML = `
      <span class="sound-letter">
        ${soundLabels[key]}
      </span>
      <span class="sound-name">
        ${soundData.title || soundLabels[key] + " дыбысы"}
      </span>
      <span class="sound-status">
        ${getSoundProgress(key)}%
      </span>
    `;

    button.onclick = () => selectSound(key);

    menu.appendChild(button);
  });
}


/* ==========================================
   4. ДЫБЫСТЫ ТАҢДАУ
   ========================================== */

function selectSound(soundKey) {
  if (!speechTasks[soundKey]) return;

  currentSound = soundKey;
  currentStage = 0;
  currentTask = 0;

  showPage("taskPage");

  const title = document.getElementById("soundTitle");

  if (title) {
    title.textContent =
      soundLabels[soundKey] + " дыбысы";
  }

  renderStageMenu();
  renderTask();
}


/* ==========================================
   5. КЕЗЕҢДЕР МӘЗІРІ
   ========================================== */

function renderStageMenu() {
  const menu = document.getElementById("stageMenu");

  if (!menu) return;

  menu.innerHTML = "";

  const stages = speechTasks[currentSound].stages;

  stages.forEach((stage, index) => {
    const button = document.createElement("button");

    button.className =
      "stage-button" +
      (index === currentStage ? " active" : "");

    button.innerHTML = `
      <span>${index + 1}-кезең</span>
      <small>${stage.name}</small>
      <strong>${getStageProgress(currentSound, index)}%</strong>
    `;

    button.onclick = () => {
      currentStage = index;
      currentTask = 0;

      stopCamera();
      stopMicrophone();
      renderStageMenu();
      renderTask();
    };

    menu.appendChild(button);
  });
}


/* ==========================================
   6. ТАПСЫРМАНЫ КӨРСЕТУ
   ========================================== */

function renderTask() {
  if (!currentSound) return;

  const stage =
    speechTasks[currentSound].stages[currentStage];

  if (!stage || !stage.tasks[currentTask]) return;

  const task = stage.tasks[currentTask];

  stopCamera();
  stopMicrophone();
  stopSpeechSample();

  setText("stageTitle", stage.name);

  setText(
    "taskCounter",
    `${currentTask + 1} / ${stage.tasks.length}`
  );

  setText("taskCategory", task.category);
  setText("taskName", task.title);
  setText("taskGoal", task.goal);
  setText("taskInstruction", task.instruction);
  setText("taskExample", task.example);
  setText("taskVisual", task.visual);
  setText("taskHint", task.help || "Тапсырманы асықпай орында.");

  const progress =
    ((currentTask + 1) / stage.tasks.length) * 100;

  setText("progressText", Math.round(progress) + "%");

  const progressBar =
    document.getElementById("progressBar");

  if (progressBar) {
    progressBar.style.width = progress + "%";
  }

  showTaskSections(task);

  const scoreKey = getTaskKey(task.id);

  const previousScore = selectedScores[scoreKey];

  document.querySelectorAll("[data-score]").forEach(button => {
    button.classList.toggle(
      "selected",
      Number(button.dataset.score) === previousScore
    );
  });

  setText(
    "taskScoreMessage",
    previousScore !== undefined
      ? "Бұл тапсырманың бағасы сақталған."
      : "Тапсырманы орындаған соң баға таңда."
  );

  renderStageMenu();
}


/* ==========================================
   7. ҚОСЫМША ЭЛЕМЕНТТЕРДІ БАСҚАРУ
   ========================================== */

function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value ?? "";
  }
}

function showSection(id, visible) {
  const element = document.getElementById(id);

  if (element) {
    element.style.display = visible ? "block" : "none";
  }
}

function showTaskSections(task) {
  const articulation =
    task.category?.toLowerCase().includes("артикуляция") ||
    task.articulation;

  const breathing =
    task.breathing ||
    task.category?.toLowerCase().includes("тыныс");

  const microphone =
    task.microphone ||
    breathing;

  showSection("articulationSection", Boolean(articulation));
  showSection("cameraSection", Boolean(task.camera || articulation));

  showSection("microphoneSection", Boolean(microphone));
  showSection("breathingSection", Boolean(breathing));

  showSection(
    "audioSection",
    Boolean(task.sample)
  );

  setText(
    "articulationDescription",
    task.articulation || task.help || ""
  );

  setText(
    "speechSample",
    task.sample || "Бұл тапсырмаға аудио үлгі енгізілмеген."
  );

  setText(
    "microphoneMessage",
    breathing
      ? "Микрофонды қосып, ауа ағынын емес, дыбыс деңгейін бақыла."
      : "Микрофон арқылы дыбыс деңгейін бақылауға болады."
  );

  setText(
    "blowMessage",
    "Микрофонды қосып, мақтаны үрлеу жаттығуын орында."
  );

  const cotton = document.getElementById("cotton");

  if (cotton) {
    cotton.style.transform = "translateX(0)";
  }

  setText("blowProgress", "0%");
}


/* ==========================================
   8. БҰРЫНҒЫ ЖӘНЕ КЕЛЕСІ ТАПСЫРМА
   ========================================== */

function previousTask() {
  if (currentTask > 0) {
    currentTask--;
    renderTask();
    return;
  }

  if (currentStage > 0) {
    currentStage--;
    currentTask = 9;
    renderTask();
  }
}

function nextTask() {
  const tasks =
    speechTasks[currentSound].stages[currentStage].tasks;

  if (currentTask < tasks.length - 1) {
    currentTask++;
    renderTask();
    return;
  }

  if (currentStage < 3) {
    currentStage++;
    currentTask = 0;
    renderTask();
    return;
  }

  alert("Бұл дыбыстың барлық кезеңі аяқталды!");
  showPage("soundPage");
  renderSoundMenu();
}

function completeTask() {
  const task = getCurrentTask();

  if (!task) return;

  const key = getTaskKey(task.id);

  if (!completedTasks.includes(key)) {
    completedTasks.push(key);

    localStorage.setItem(
      "completedTasks",
      JSON.stringify(completedTasks)
    );
  }

  nextTask();
}

function getCurrentTask() {
  if (!currentSound) return null;

  return speechTasks[currentSound]
    ?.stages[currentStage]
    ?.tasks[currentTask];
}


/* ==========================================
   9. БАҒАЛАУ ЖҮЙЕСІ
   ========================================== */

function getTaskKey(taskId) {
  return currentSound + "-" + taskId;
}

function setTaskScore(score) {
  const task = getCurrentTask();

  if (!task) return;

  const key = getTaskKey(task.id);

  selectedScores[key] = score;

  localStorage.setItem(
    "speechScores",
    JSON.stringify(selectedScores)
  );

  setText(
    "taskScoreMessage",
    getScoreDescription(score)
  );

  document.querySelectorAll("[data-score]").forEach(button => {
    button.classList.toggle(
      "selected",
      Number(button.dataset.score) === score
    );
  });
}

function getScoreDescription(score) {
  const descriptions = {
    3: "3 балл — тапсырманы өз бетінше орындады.",
    2: "2 балл — аздаған көмекпен орындады.",
    1: "1 балл — маманның көмегімен орындады.",
    0: "0 балл — тапсырманы қайталау қажет."
  };

  return descriptions[score] || "";
}


/* ==========================================
   10. ПРОГРЕСТІ ЕСЕПТЕУ
   ========================================== */

function getStageProgress(soundKey, stageIndex) {
  const tasks =
    speechTasks[soundKey].stages[stageIndex].tasks;

  const completed = tasks.filter(task =>
    completedTasks.includes(
      soundKey + "-" + task.id
    )
  ).length;

  return Math.round(
    completed / tasks.length * 100
  );
}

function getSoundProgress(soundKey) {
  let completed = 0;
  let total = 0;

  speechTasks[soundKey].stages.forEach(stage => {
    total += stage.tasks.length;

    stage.tasks.forEach(task => {
      if (
        completedTasks.includes(
          soundKey + "-" + task.id
        )
      ) {
        completed++;
      }
    });
  });

  return Math.round(completed / total * 100);
}

function getTotalProgress() {
  let total = 0;

  SOUND_ORDER.forEach(key => {
    total += getSoundProgress(key);
  });

  return Math.round(total / SOUND_ORDER.length);
}


/* ==========================================
   11. КАМЕРАНЫ ҚОСУ
   ========================================== */

async function startCamera() {
  const video = document.getElementById("cameraVideo");

  if (!video) return;

  try {
    stopCamera();

    cameraStream =
      await navigator.mediaDevices.getUserMedia({
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
      "Камера қосылмады. Браузердің камераға рұқсатын тексер."
    );
  }
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => {
      track.stop();
    });

    cameraStream = null;
  }

  const video = document.getElementById("cameraVideo");

  if (video) {
    video.srcObject = null;
  }
}


/* ==========================================
   12. МИКРОФОН ЖӘНЕ ДЫБЫС ДЕҢГЕЙІ
   ========================================== */

async function startMicrophone() {
  try {
    stopMicrophone();

    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Бұл браузер микрофонды қолдамайды.");
      return;
    }

    microphoneStream =
      await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });

    audioContext = new (
      window.AudioContext ||
      window.webkitAudioContext
    )();

    const source =
      audioContext.createMediaStreamSource(
        microphoneStream
      );

    const analyser = audioContext.createAnalyser();

    analyser.fftSize = 256;

    source.connect(analyser);

    const data = new Uint8Array(
      analyser.frequencyBinCount
    );

    function updateMicrophone() {
      analyser.getByteTimeDomainData(data);

      let sum = 0;

      for (let i = 0; i < data.length; i++) {
        const value = (data[i] - 128) / 128;
        sum += value * value;
      }

      const volume = Math.sqrt(sum / data.length);

      const level = Math.min(
        100,
        Math.round(volume * 350)
      );

      updateVolumeDisplay(level);
      updateCotton(level);

      microphoneAnimation =
        requestAnimationFrame(updateMicrophone);
    }

    updateMicrophone();

    setText(
      "microphoneStatus",
      "Микрофон қосылды"
    );

  } catch (error) {
    console.error("Микрофон қатесі:", error);

    alert(
      "Микрофонға рұқсат берілмеді. Браузер баптауларын тексер."
    );
  }
}

function updateVolumeDisplay(level) {
  const bar = document.getElementById("volumeBar");

  if (bar) {
    bar.style.width = level + "%";
  }

  let message = "Дыбыс жоқ";

  if (level > 5 && level < 25) {
    message = "Дыбыс деңгейі төмен";
  } else if (level >= 25 && level < 60) {
    message = "Дыбыс деңгейі орташа";
  } else if (level >= 60) {
    message = "Дыбыс деңгейі жоғары";
  }

  setText("microphoneMessage", message);
}


/* ==========================================
   13. ТЫНЫС ЖАТТЫҒУЫНЫҢ АНИМАЦИЯСЫ
   ========================================== */

function updateCotton(level) {
  const cotton = document.getElementById("cotton");

  if (!cotton) return;

  const movement = Math.min(
    250,
    level * 2.5
  );

  cotton.style.transform =
    `translateX(${movement}px)`;

  setText(
    "blowProgress",
    Math.round(movement / 250 * 100) + "%"
  );
}


/* ==========================================
   14. МИКРОФОНДЫ ӨШІРУ
   ========================================== */

function stopMicrophone() {
  if (microphoneAnimation) {
    cancelAnimationFrame(microphoneAnimation);
    microphoneAnimation = null;
  }

  if (microphoneStream) {
    microphoneStream.getTracks().forEach(track => {
      track.stop();
    });

    microphoneStream = null;
  }

  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }

  setText("microphoneStatus", "Микрофон өшірулі");

  const bar = document.getElementById("volumeBar");

  if (bar) {
    bar.style.width = "0%";
  }

  const cotton = document.getElementById("cotton");

  if (cotton) {
    cotton.style.transform = "translateX(0)";
  }

  setText("blowProgress", "0%");
}


/* ==========================================
   15. ДЫБЫС ҮЛГІСІН ОҚУ
   ========================================== */

function playSpeechSample() {
  const task = getCurrentTask();

  if (!task || !task.sample) {
    alert("Бұл тапсырмада дыбыс үлгісі жоқ.");
    return;
  }

  if (!("speechSynthesis" in window)) {
    alert("Бұл браузер мәтінді дыбыстауды қолдамайды.");
    return;
  }

  stopSpeechSample();

  const utterance =
    new SpeechSynthesisUtterance(task.sample);

  utterance.lang = "kk-KZ";
  utterance.rate = 0.8;
  utterance.pitch = 1;

  window.speechSynthesis.speak(utterance);
}

function stopSpeechSample() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}


/* ==========================================
   16. СЕРГІТУ СӘТІ
   ========================================== */

const relaxationActivities = [
  {
    title: "Күнге созыл",
    visual: "☀️",
    instruction: "Қолдарыңды жоғары көтеріп, күнге созылғандай керіл."
  },
  {
    title: "Көбелек",
    visual: "🦋",
    instruction: "Қолдарыңды көбелектің қанатындай баяу қозға."
  },
  {
    title: "Ағаш",
    visual: "🌳",
    instruction: "Тік тұрып, денеңді оңға және солға ақырын бұр."
  },
  {
    title: "Жаңбыр",
    visual: "🌧️",
    instruction: "Саусақтарыңмен үстелді жеңіл тықылдат."
  },
  {
    title: "Құстар",
    visual: "🐦",
    instruction: "Қолдарыңды екі жаққа жайып, құс сияқты қимылда."
  }
];

let relaxationIndex = 0;

function renderRelaxationMenu() {
  const menu = document.getElementById("relaxationMenu");

  if (!menu) return;

  menu.innerHTML = "";

  relaxationActivities.forEach((activity, index) => {
    const button = document.createElement("button");

    button.className = "activity-card";

    button.textContent =
      activity.visual + " " + activity.title;

    button.onclick = () => {
      relaxationIndex = index;
      startRelaxationGame();
    };

    menu.appendChild(button);
  });
}

function startRelaxationGame() {
  const activity =
    relaxationActivities[relaxationIndex];

  showSection("relaxationGame", true);

  setText("relaxationTitle", activity.title);
  setText("relaxationVisual", activity.visual);
  setText("relaxationInstruction", activity.instruction);
}

function nextRelaxationActivity() {
  relaxationIndex++;

  if (relaxationIndex >= relaxationActivities.length) {
    relaxationIndex = 0;
  }

  startRelaxationGame();
}


/* ==========================================
   17. ҰСАҚ МОТОРИКА
   ========================================== */

const motorActivities = [
  {
    title: "Саусақ жаттығуы",
    visual: "🖐️",
    instruction: "Әр саусағыңды бас бармақпен кезекпен түйістір."
  },
  {
    title: "Моншақ тізу",
    visual: "📿",
    instruction: "Моншақтарды түсіне қарай ретімен орналастыр."
  },
  {
    title: "Суретті құрастыр",
    visual: "🧩",
    instruction: "Бөлшектерді біріктіріп, суретті құрастыр."
  },
  {
    title: "Оң және сол",
    visual: "🤚",
    instruction: "Оң қолыңмен және сол қолыңмен кезекпен қимыл жаса."
  },
  {
    title: "Саусақпен сана",
    visual: "🔢",
    instruction: "Саусақтарыңды пайдаланып, бірден беске дейін сана."
  }
];

let motorIndex = 0;

function renderMotorMenu() {
  const menu = document.getElementById("motorMenu");

  if (!menu) return;

  menu.innerHTML = "";

  motorActivities.forEach((activity, index) => {
    const button = document.createElement("button");

    button.className = "activity-card";

    button.textContent =
      activity.visual + " " + activity.title;

    button.onclick = () => {
      motorIndex = index;
      startMotorGame();
    };

    menu.appendChild(button);
  });
}

function startMotorGame() {
  const activity = motorActivities[motorIndex];

  showSection("motorGame", true);

  setText("motorTitle", activity.title);
  setText("motorVisual", activity.visual);
  setText("motorInstruction", activity.instruction);
  setText("motorResult", "");
}

function checkMotorGame() {
  setText(
    "motorResult",
    "Жарайсың! Жаттығуды орындадың."
  );
}

function nextMotorGame() {
  motorIndex++;

  if (motorIndex >= motorActivities.length) {
    motorIndex = 0;
  }

  startMotorGame();
}


/* ==========================================
   18. БАҒАЛАУ БӨЛІМІ
   ========================================== */

function renderAssessment() {
  const totalCompleted =
    document.getElementById("totalCompleted");

  const totalScore =
    document.getElementById("totalScore");

  const totalProgress =
    document.getElementById("totalProgress");

  const totalProgressBar =
    document.getElementById("totalProgressBar");

  const completedCount = completedTasks.length;

  const scoreValues =
    Object.values(selectedScores);

  const scoreSum = scoreValues.reduce(
    (sum, value) => sum + Number(value),
    0
  );

  const progress = getTotalProgress();

  if (totalCompleted) {
    totalCompleted.textContent =
      completedCount + " / 400";
  }

  if (totalScore) {
    totalScore.textContent =
      scoreSum + " балл";
  }

  if (totalProgress) {
    totalProgress.textContent =
      progress + "%";
  }

  if (totalProgressBar) {
    totalProgressBar.style.width =
      progress + "%";
  }

  renderSoundResults();
}

function renderSoundResults() {
  const container =
    document.getElementById("soundResults");

  if (!container) return;

  container.innerHTML = "";

  SOUND_ORDER.forEach(key => {
    const sound = speechTasks[key];

    let soundScore = 0;
    let scoreCount = 0;

    sound.stages.forEach(stage => {
      stage.tasks.forEach(task => {
        const value =
          selectedScores[key + "-" + task.id];

        if (value !== undefined) {
          soundScore += Number(value);
          scoreCount++;
        }
      });
    });

    const card = document.createElement("div");

    card.className = "result-card";

    card.innerHTML = `
      <h3>${soundLabels[key]} дыбысы</h3>
      <p>Орындалуы: ${getSoundProgress(key)}%</p>
      <p>Бағаланған тапсырма: ${scoreCount}/40</p>
      <p>Жиналған балл: ${soundScore}</p>
    `;

    container.appendChild(card);
  });
}


/* ==========================================
   19. ДИПЛОМ
   ========================================== */

function openDiploma() {
  const page = document.getElementById("diplomaPage");

  if (!page) return;

  showPage("diplomaPage");

  const progress = getTotalProgress();

  setText(
    "diplomaProgress",
    progress + "%"
  );

  setText(
    "diplomaDate",
    new Date().toLocaleDateString("kk-KZ")
  );
}

function printDiploma() {
  window.print();
}


/* ==========================================
   20. БАҒДАРЛАМАНЫ ІСКЕ ҚОСУ
   ========================================== */

document.addEventListener("DOMContentLoaded", () => {
  if (typeof speechTasks === "undefined") {
    console.error("data.js файлы жүктелмеген!");
    return;
  }

  if (typeof SOUND_ORDER === "undefined") {
    console.error("SOUND_ORDER табылмады!");
    return;
  }

  renderSoundMenu();

  console.log("Сөйлеу әлеміне саяхат іске қосылды.");
  console.log("Дыбыстар саны:", SOUND_ORDER.length);
});
