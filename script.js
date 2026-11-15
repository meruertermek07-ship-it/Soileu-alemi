"use strict";

/* =========================================
   1. БАҒДАРЛАМАНЫҢ НЕГІЗГІ ДЕРЕКТЕРІ
========================================= */

const STORAGE_KEY = "soileuSayahatyProgress";

let currentSound = null;
let currentStage = 0;
let currentTask = 0;

let selectedScore = null;

let progressData = JSON.parse(
  localStorage.getItem(STORAGE_KEY) || "{}"
);

let cameraStream = null;
let microphoneStream = null;
let microphoneAnimation = null;


/* =========================================
   2. КӨМЕКШІ ФУНКЦИЯЛАР
========================================= */

function getElement(id) {
  return document.getElementById(id);
}

function saveProgress() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(progressData)
  );
}

function getSoundData(soundKey) {
  return speechTasks[soundKey];
}

function getCurrentTaskData() {
  const sound = getSoundData(currentSound);

  if (!sound || !sound.stages[currentStage]) {
    return null;
  }

  return sound.stages[currentStage].tasks[currentTask];
}

function getTaskKey(sound, stage, task) {
  return `${sound}_${stage}_${task}`;
}

function getTaskRecord(sound, stage, task) {
  const key = getTaskKey(sound, stage, task);

  return progressData[key] || {
    completed: false,
    score: null
  };
}

function setTaskRecord(sound, stage, task, record) {
  const key = getTaskKey(sound, stage, task);

  progressData[key] = record;

  saveProgress();
}

function countCompletedTasks(soundKey, stageIndex) {
  const sound = getSoundData(soundKey);

  if (!sound) return 0;

  let count = 0;

  sound.stages[stageIndex].tasks.forEach((task, index) => {
    const record = getTaskRecord(
      soundKey,
      stageIndex,
      index
    );

    if (record.completed) count++;
  });

  return count;
}

function countSoundCompleted(soundKey) {
  const sound = getSoundData(soundKey);

  if (!sound) return 0;

  let count = 0;

  sound.stages.forEach((stage, stageIndex) => {
    stage.tasks.forEach((task, taskIndex) => {
      const record = getTaskRecord(
        soundKey,
        stageIndex,
        taskIndex
      );

      if (record.completed) count++;
    });
  });

  return count;
}

function countAllCompleted() {
  let total = 0;

  SOUND_ORDER.forEach(soundKey => {
    total += countSoundCompleted(soundKey);
  });

  return total;
}


/* =========================================
   3. БЕТТЕРДІ АУЫСТЫРУ
========================================= */

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  const target = getElement(pageId);

  if (target) {
    target.classList.add("active");
    target.classList.remove("hidden");
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function toggleMenu() {
  const menu = getElement("mainMenu");

  if (menu) {
    menu.classList.toggle("hidden");
  }
}


/* =========================================
   4. БАСТЫ БЕТТЕН ДЫБЫСТАРҒА ӨТУ
========================================= */

function startJourney() {
  renderSoundMenu();
  showPage("soundPage");
}


/* =========================================
   5. ДЫБЫСТАР МӘЗІРІ
========================================= */

function renderSoundMenu() {
  const page = getElement("soundPage");

  if (!page) return;

  let container = getElement("soundGrid");

  if (!container) {
    container = document.createElement("div");
    container.id = "soundGrid";
    container.className = "sound-grid";
    page.appendChild(container);
  }

  container.innerHTML = "";

  SOUND_ORDER.forEach(soundKey => {
    const sound = getSoundData(soundKey);

    if (!sound) return;

    const completed = countSoundCompleted(soundKey);
    const percent = Math.round((completed / 40) * 100);

    const card = document.createElement("button");

    card.className = "sound-card";
    card.type = "button";

    card.innerHTML = `
      <span class="sound-letter">${sound.sound}</span>
      <span class="sound-name">${sound.title}</span>
      <span class="sound-progress">${percent}%</span>
      <span class="sound-count">${completed}/40 тапсырма</span>
    `;

    card.addEventListener("click", () => {
      openSound(soundKey);
    });

    container.appendChild(card);
  });
}


/* =========================================
   6. ТАҢДАЛҒАН ДЫБЫСТЫ АШУ
========================================= */

function openSound(soundKey) {
  const sound = getSoundData(soundKey);

  if (!sound) {
    alert("Бұл дыбыс деректерден табылмады.");
    return;
  }

  currentSound = soundKey;

  renderStages();

  showPage("stagePage");
}


/* =========================================
   7. КЕЗЕҢДЕРДІ КӨРСЕТУ
========================================= */

function renderStages() {
  const sound = getSoundData(currentSound);

  if (!sound) return;

  const page = getElement("stagePage");

  if (!page) return;

  let container = getElement("stageGrid");

  if (!container) {
    container = document.createElement("div");
    container.id = "stageGrid";
    container.className = "stage-grid";
    page.appendChild(container);
  }

  container.innerHTML = "";

  const title = getElement("stageSoundTitle");

  if (title) {
    title.textContent = sound.title;
  }

  sound.stages.forEach((stage, index) => {
    const completed = countCompletedTasks(
      currentSound,
      index
    );

    const percent = completed * 10;

    const card = document.createElement("button");

    card.className = "stage-card";
    card.type = "button";

    card.innerHTML = `
      <span class="stage-number">${index + 1}</span>
      <span class="stage-name">${stage.name}</span>
      <span class="stage-progress">${percent}%</span>
      <span class="stage-count">${completed}/10 тапсырма</span>
      <span class="stage-bar">
        <span style="width:${percent}%"></span>
      </span>
    `;

    card.addEventListener("click", () => {
      openStage(index);
    });

    container.appendChild(card);
  });
}


/* =========================================
   8. КЕЗЕҢДІ АШУ
========================================= */

function openStage(stageIndex) {
  const sound = getSoundData(currentSound);

  if (!sound || !sound.stages[stageIndex]) return;

  currentStage = stageIndex;
  currentTask = 0;

  openTask();
}


/* =========================================
   9. ТАПСЫРМАНЫ КӨРСЕТУ
========================================= */

function openTask() {
  const sound = getSoundData(currentSound);

  if (!sound) return;

  const stage = sound.stages[currentStage];

  if (!stage) return;

  const task = stage.tasks[currentTask];

  if (!task) return;

  selectedScore = null;

  const record = getTaskRecord(
    currentSound,
    currentStage,
    currentTask
  );

  if (record.completed) {
    selectedScore = record.score;
  }

  showPage("taskPage");

  setText("taskCounter",
    `Тапсырма ${currentTask + 1} / 10`
  );

  setText("stageTitle", stage.name);
  setText("taskCategory", task.category || "");
  setText("taskName", task.title || "");
  setText("taskGoal", task.goal || "");
  setText("taskMaterials", task.materials || "");
  setText("taskExercise", task.exercise || "");
  setText("taskExample", task.example || "");
  setText("taskHint", task.help || "");
  setText("taskEvaluation", task.evaluation || "");

  setText(
    "taskInstruction",
    Array.isArray(task.instruction)
      ? task.instruction.join("\n")
      : task.instruction || ""
  );

  setText("taskVisual", task.visual || "");

  renderTaskProgress();
  renderTaskScore();
  renderTaskExtras(task);
}

function setText(id, value) {
  const element = getElement(id);

  if (element) {
    element.textContent = value;
  }
}


/* =========================================
   10. ТАПСЫРМА ПРОГРЕСІ
========================================= */

function renderTaskProgress() {
  const completed = countCompletedTasks(
    currentSound,
    currentStage
  );

  const percent = completed * 10;

  const bar = getElement("progressBar");

  if (bar) {
    bar.style.width = `${percent}%`;
  }

  setText("progressText", `${percent}%`);
}


/* =========================================
   11. БАҒАЛАУ ШКАЛАСЫ
========================================= */

function setTaskScore(score) {
  if (![0, 1, 2, 3].includes(score)) return;

  selectedScore = score;

  document.querySelectorAll("[data-score]").forEach(button => {
    button.classList.remove("selected");

    if (Number(button.dataset.score) === score) {
      button.classList.add("selected");
    }
  });

  const messages = {
    3: "Өздігінен орындады ⭐⭐⭐",
    2: "Аздаған көмекпен орындады ⭐⭐",
    1: "Көп көмекті қажет етті ⭐",
    0: "Қайталап орындау қажет"
  };

  setText("scoreMessage", messages[score]);
}

function renderTaskScore() {
  document.querySelectorAll("[data-score]").forEach(button => {
    button.classList.remove("selected");

    if (
      selectedScore !== null &&
      Number(button.dataset.score) === selectedScore
    ) {
      button.classList.add("selected");
    }
  });
}


/* =========================================
   12. ТАПСЫРМАНЫ АЯҚТАУ
========================================= */

function completeTask() {
  if (selectedScore === null) {
    alert("Алдымен бағалау шкаласынан ұпай таңда.");
    return;
  }

  setTaskRecord(
    currentSound,
    currentStage,
    currentTask,
    {
      completed: true,
      score: selectedScore
    }
  );

  renderTaskProgress();

  const sound = getSoundData(currentSound);
  const stage = sound.stages[currentStage];

  if (currentTask < stage.tasks.length - 1) {
    currentTask++;
    openTask();
  } else {
    renderStages();

    alert(
      "Кезеңдегі 10 тапсырма аяқталды! Жарайсың!"
    );

    showPage("stagePage");
  }
}


/* =========================================
   13. АЛДЫҢҒЫ ЖӘНЕ КЕЛЕСІ ТАПСЫРМА
========================================= */

function nextTask() {
  const sound = getSoundData(currentSound);

  if (!sound) return;

  const stage = sound.stages[currentStage];

  if (currentTask < stage.tasks.length - 1) {
    currentTask++;
    openTask();
  }
}

function previousTask() {
  if (currentTask > 0) {
    currentTask--;
    openTask();
  }
}


/* =========================================
   14. БАҒАЛАУ БЕТІ
========================================= */

function openAssessment() {
  renderAssessment();
  showPage("assessmentPage");
}

function renderAssessment() {
  const total = countAllCompleted();

  const percent = Math.round((total / 400) * 100);

  setText("totalCompleted", `${total}/400`);
  setText("totalScore", `${percent}%`);
  setText("totalProgress", `${percent}%`);

  const bar = getElement("totalProgressBar");

  if (bar) {
    bar.style.width = `${percent}%`;
  }

  const results = getElement("soundResults");

  if (!results) return;

  results.innerHTML = "";

  SOUND_ORDER.forEach(soundKey => {
    const sound = getSoundData(soundKey);

    if (!sound) return;

    const completed = countSoundCompleted(soundKey);
    const percent = Math.round((completed / 40) * 100);

    const row = document.createElement("div");

    row.className = "result-row";

    row.innerHTML = `
      <strong>${sound.sound}</strong>
      <span>${completed}/40</span>
      <span>${percent}%</span>
    `;

    results.appendChild(row);
  });
}


/* =========================================
   15. ДИПЛОМ
========================================= */

function openDiploma() {
  const completed = countAllCompleted();

  const percent = Math.round((completed / 400) * 100);

  setText("diplomaProgress", `${percent}%`);

  const date = new Date().toLocaleDateString("kk-KZ");

  setText("diplomaDate", date);

  showPage("diplomaPage");
}

function printDiploma() {
  window.print();
}


/* =========================================
   16. ҚОСЫМША БЕТТЕР
========================================= */

function openRelaxation() {
  showPage("relaxationPage");
}

function openMotorSkills() {
  showPage("motorPage");
}

function openRelaxationCategory(category) {
  const menu = getElement("relaxationMenu");
  const game = getElement("relaxationGame");

  if (menu) menu.classList.add("hidden");
  if (game) game.classList.remove("hidden");

  const titles = {
    dance: "Би сергіту сәті",
    sing: "Ән айту сәті",
    movement: "Қимылды ойын",
    animals: "Жануарларға еліктеу"
  };

  setText("relaxationTitle", titles[category] || "Сергіту сәті");

  setText(
    "relaxationInstruction",
    "Қимылды асықпай орында. Қажет болса, үзіліс жаса."
  );
}

function nextRelaxationActivity() {
  setText(
    "relaxationInstruction",
    "Келесі сергіту жаттығуына өт!"
  );
}


/* =========================================
   17. БЕТКЕ ҚАЙТУ
========================================= */

function backToSounds() {
  renderSoundMenu();
  showPage("soundPage");
}

function backToStages() {
  renderStages();
  showPage("stagePage");
}
// ==========================================
// 2-БӨЛІМ. АРТИКУЛЯЦИЯ, КАМЕРА, МИКРОФОН
// ==========================================


// Қосымша бөлімдерді көрсету немесе жасыру
function setSectionVisible(id, visible) {
    const section = document.getElementById(id);

    if (section) {
        section.style.display = visible ? "block" : "none";
    }
}


// Мәтінді қауіпсіз шығару
function setOptionalText(id, value, fallback = "") {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value || fallback;
    }
}


// Тапсырмаға қосымша материалдарды шығару
function renderTaskExtras(task) {

    // Алдыңғы камераны тоқтату
    stopCamera();

    // Алдыңғы микрофонды тоқтату
    stopMicrophone();

    // Барлық қосымша бөлімдерді бастапқыда жасыру
    [
        "articulationSection",
        "cameraSection",
        "audioSection",
        "microphoneSection",
        "breathingSection"
    ].forEach(id => setSectionVisible(id, false));


    // 1. Артикуляциялық үлгі
    if (task.articulation) {

        setSectionVisible("articulationSection", true);

        setOptionalText(
            "articulationDescription",
            task.articulation,
            "Айна алдында логопедтің нұсқауын орында."
        );

        setOptionalText(
            "articulationVisual",
            task.visual,
            "Артикуляциялық қалыпты мұқият бақыла."
        );

        setOptionalText(
            "cameraArticulationModel",
            task.help,
            "Ерін мен тілдің қалпын айна арқылы бақыла."
        );
    }


    // 2. Камера
    if (
        task.type === "camera" ||
        task.type === "articulation" ||
        task.articulation
    ) {
        setSectionVisible("cameraSection", true);
    }


    // 3. Аудио үлгі
    setSectionVisible("audioSection", true);

    const audioElement = document.getElementById("speechAudio");

    if (audioElement) {
        audioElement.pause();
        audioElement.removeAttribute("src");
        audioElement.load();
    }

    const audioUrl = task.audio || task.audioUrl || "";

    if (audioUrl && audioElement) {
        audioElement.src = audioUrl;

        setOptionalText(
            "audioStatus",
            "Аудио үлгі дайын. Тыңдау батырмасын бас."
        );

        const sampleButton = document.getElementById("speechSample");

        if (sampleButton) {
            sampleButton.onclick = () => {
                audioElement.play().catch(() => {
                    setOptionalText(
                        "audioStatus",
                        "Аудионы ойнату мүмкін болмады. Қайта көр."
                    );
                });
            };
        }

    } else {
        setOptionalText(
            "audioStatus",
            "Бұл тапсырмаға жеке аудио үлгі тіркелмеген. Логопедтің дыбыстау үлгісін пайдалан."
        );
    }


    // 4. Микрофон
    if (
        task.type === "microphone" ||
        task.type === "breathing" ||
        task.type === "voice"
    ) {
        setSectionVisible("microphoneSection", true);
    }


    // 5. Тыныс алу жаттығуы
    if (
        task.type === "breathing" ||
        task.breathing
    ) {
        setSectionVisible("breathingSection", true);

        setOptionalText(
            "blowMessage",
            task.breathing || "Мұрынмен дем алып, ауыз арқылы баяу дем шығар."
        );
    }


    // Бағалау батырмаларын бастапқы күйге келтіру
    selectedScore = null;

    document.querySelectorAll("[data-score]").forEach(button => {
        button.classList.remove("selected");
    });
}



// ==========================================
// КАМЕРА
// ==========================================

async function startCamera() {

    const video = document.getElementById("cameraVideo");
    const status = document.getElementById("cameraStatus");

    if (!video) {
        return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {

        if (status) {
            status.textContent =
                "Камера бұл браузерде қолжетімді емес. HTTPS арқылы ашып көр.";
        }

        return;
    }

    try {

        stopCamera();

        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "user"
            },
            audio: false
        });

        video.srcObject = cameraStream;

        video.muted = true;
        video.playsInline = true;

        await video.play();

        if (status) {
            status.textContent =
                "Камера қосылды. Айнадан ерін мен тілдің қалпын бақыла.";
        }

    } catch (error) {

        console.error("Камера қатесі:", error);

        if (status) {
            status.textContent =
                "Камераға рұқсат берілмеді. Браузер баптауынан камераға рұқсат бер.";
        }
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
        video.pause();
        video.srcObject = null;
    }
}



// ==========================================
// МИКРОФОН
// ==========================================

let audioContext = null;
let microphoneAnalyser = null;
let microphoneSource = null;


async function startMicrophone() {

    const status = document.getElementById("microphoneStatus");
    const message = document.getElementById("microphoneMessage");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {

        setOptionalText(
            "microphoneStatus",
            "Микрофон бұл браузерде қолжетімді емес."
        );

        return;
    }

    try {

        stopMicrophone();

        microphoneStream = await navigator.mediaDevices.getUserMedia({
            audio: true
        });

        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) {
            throw new Error("AudioContext қолжетімсіз");
        }

        audioContext = new AudioContextClass();

        if (audioContext.state === "suspended") {
            await audioContext.resume();
        }

        microphoneAnalyser = audioContext.createAnalyser();
        microphoneAnalyser.fftSize = 256;

        microphoneSource =
            audioContext.createMediaStreamSource(microphoneStream);

        microphoneSource.connect(microphoneAnalyser);

        if (status) {
            status.textContent = "Микрофон қосылды.";
        }

        if (message) {
            message.textContent =
                "Микрофон тек дыбыс деңгейін көрсетеді. Дыбыстың дұрыс айтылғанын өзі анықтамайды.";
        }

        updateMicrophoneLevel();

    } catch (error) {

        console.error("Микрофон қатесі:", error);

        if (status) {
            status.textContent =
                "Микрофонға рұқсат берілмеді. Браузер баптауын тексер.";
        }
    }
}


function updateMicrophoneLevel() {

    if (!microphoneAnalyser) {
        return;
    }

    const data = new Uint8Array(
        microphoneAnalyser.frequencyBinCount
    );

    microphoneAnalyser.getByteFrequencyData(data);

    let total = 0;

    for (let i = 0; i < data.length; i++) {
        total += data[i];
    }

    const average = total / data.length;

    const percentage = Math.min(
        100,
        Math.round(average * 1.8)
    );

    const volumeBar = document.getElementById("volumeBar");

    if (volumeBar) {
        volumeBar.style.width = percentage + "%";
    }

    const status = document.getElementById("microphoneStatus");

    if (status) {

        if (percentage < 10) {
            status.textContent = "Дыбыс деңгейі төмен.";
        } else if (percentage < 45) {
            status.textContent = "Дыбыс деңгейі орташа.";
        } else {
            status.textContent = "Дыбыс деңгейі жоғары.";
        }
    }

    microphoneAnimation =
        requestAnimationFrame(updateMicrophoneLevel);
}


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

    if (microphoneSource) {
        microphoneSource.disconnect();
        microphoneSource = null;
    }

    if (audioContext) {
        audioContext.close().catch(() => {});
        audioContext = null;
    }

    microphoneAnalyser = null;

    const volumeBar = document.getElementById("volumeBar");

    if (volumeBar) {
        volumeBar.style.width = "0%";
    }
}



// ==========================================
// ТЫНЫС АЛУ ЖАТТЫҒУЫ
// ==========================================

let breathingTimer = null;


function startBreathingExercise() {

    const cotton = document.getElementById("cotton");
    const progress = document.getElementById("blowProgress");
    const message = document.getElementById("blowMessage");

    if (!cotton) {
        return;
    }

    clearInterval(breathingTimer);

    let position = 0;
    let direction = 1;

    if (message) {
        message.textContent =
            "Мұрынмен дем ал. Енді ауыз арқылы баяу дем шығар.";
    }

    breathingTimer = setInterval(() => {

        position += direction * 3;

        if (position >= 180) {
            direction = -1;
        }

        if (position <= 0) {
            direction = 1;
        }

        cotton.style.transform =
            `translateX(${position}px)`;

        if (progress) {
            progress.style.width =
                Math.round((position / 180) * 100) + "%";
        }

    }, 50);
}


function stopBreathingExercise() {

    clearInterval(breathingTimer);
    breathingTimer = null;

    const cotton = document.getElementById("cotton");
    const progress = document.getElementById("blowProgress");

    if (cotton) {
        cotton.style.transform = "translateX(0)";
    }

    if (progress) {
        progress.style.width = "0%";
    }
}



// ==========================================
// ҚОСЫМША ҚҰРАЛДАРДЫ ТОҚТАТУ
// ==========================================

function stopAllMedia() {

    stopCamera();
    stopMicrophone();
    stopBreathingExercise();
}
// ==========================================
// 3-БӨЛІМ. ҰСАҚ МОТОРИКА ОЙЫНДАРЫ
// ==========================================

let currentMotorGame = "";
let motorScore = 0;
let motorSelection = null;
let motorMemoryCards = [];
let motorMatchedCards = [];
let motorMazePosition = { x: 0, y: 0 };
let motorDotStep = 0;
let motorCanvas = null;
let motorCanvasContext = null;
let motorColor = "#e74c3c";

const motorGameNames = {
    puzzle: "Пазл құрастыру",
    maze: "Лабиринт",
    dots: "Сандарды қосып сурет сал",
    coloring: "Суретті боя",
    memory: "Есте сақтау ойыны",
    sorting: "Заттарды сұрыптау",
    difference: "Айырмашылықты тап",
    treasure: "Қазынаға жол"
};


// Ойын бастау
function startMotorGame(gameName) {

    currentMotorGame = gameName;
    motorScore = 0;
    motorSelection = null;

    const menu = document.getElementById("motorMenu");
    const game = document.getElementById("motorGame");

    if (menu) menu.style.display = "none";
    if (game) game.style.display = "block";

    setOptionalText(
        "motorTitle",
        motorGameNames[gameName] || "Ұсақ моторика ойыны"
    );

    setOptionalText(
        "motorResult",
        "Ойынды бастап көр!"
    );

    const area = document.getElementById("motorPlayArea");

    if (!area) {
        alert("motorPlayArea элементі index.html ішінде жоқ.");
        return;
    }

    area.innerHTML = "";

    switch (gameName) {
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

        case "difference":
            createDifferenceGame(area);
            break;

        case "treasure":
            createTreasureGame(area);
            break;

        default:
            area.textContent = "Ойын табылмады.";
    }
}


// ==========================================
// 1. ПАЗЛ ҚҰРАСТЫРУ
// ==========================================

let puzzleTiles = [];
let puzzleEmpty = 8;

function createPuzzleGame(area) {

    const instruction = document.getElementById("motorInstruction");

    if (instruction) {
        instruction.textContent =
            "Сандарды ретімен орналастыр. Бос ұяшыққа көршілес тұрған санды жылжыт.";
    }

    puzzleTiles = [1, 2, 3, 4, 5, 6, 7, 8, 0];

    // Орындарын араластыру
    for (let i = 0; i < 100; i++) {

        const neighbors = getPuzzleNeighbors(puzzleEmpty);
        const randomIndex =
            neighbors[Math.floor(Math.random() * neighbors.length)];

        [puzzleTiles[puzzleEmpty], puzzleTiles[randomIndex]] =
            [puzzleTiles[randomIndex], puzzleTiles[puzzleEmpty]];

        puzzleEmpty = randomIndex;
    }

    renderPuzzle(area);
}


function getPuzzleNeighbors(index) {

    const row = Math.floor(index / 3);
    const col = index % 3;

    const result = [];

    if (row > 0) result.push(index - 3);
    if (row < 2) result.push(index + 3);
    if (col > 0) result.push(index - 1);
    if (col < 2) result.push(index + 1);

    return result;
}


function renderPuzzle(area) {

    area.innerHTML = "";

    const board = document.createElement("div");
    board.className = "puzzle-board";

    puzzleTiles.forEach((number, index) => {

        const tile = document.createElement("button");

        tile.className = "puzzle-tile";
        tile.textContent = number === 0 ? "" : number;

        if (number === 0) {
            tile.classList.add("puzzle-empty");
        }

        tile.onclick = () => movePuzzleTile(index, area);

        board.appendChild(tile);
    });

    area.appendChild(board);

    const hint = document.createElement("p");
    hint.textContent = "Мақсат: 1-ден 8-ге дейінгі сандарды ретімен орналастыр.";
    area.appendChild(hint);
}


function movePuzzleTile(index, area) {

    if (!getPuzzleNeighbors(puzzleEmpty).includes(index)) {
        return;
    }

    [puzzleTiles[index], puzzleTiles[puzzleEmpty]] =
        [puzzleTiles[puzzleEmpty], puzzleTiles[index]];

    puzzleEmpty = index;

    renderPuzzle(area);

    if (puzzleTiles.every((value, index) => value === (index + 1) % 9)) {
        setMotorSuccess("Жарайсың! Пазлды дұрыс құрастырдың!");
    }
}



// ==========================================
// 2. ЛАБИРИНТ
// ==========================================

const mazeMap = [
    [0, 1, 0, 0, 0, 0, 0],
    [0, 1, 0, 1, 1, 1, 0],
    [0, 0, 0, 1, 0, 0, 0],
    [1, 1, 0, 1, 0, 1, 0],
    [0, 0, 0, 0, 0, 1, 0],
    [0, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 1, 1, 1, 0]
];

function createMazeGame(area) {

    motorMazePosition = { x: 0, y: 0 };

    const instruction = document.getElementById("motorInstruction");

    if (instruction) {
        instruction.textContent =
            "Кейіпкерді лабиринттен шығарып, белгіленген есікке жеткіз.";
    }

    renderMaze(area);
}


function renderMaze(area) {

    area.innerHTML = "";

    const board = document.createElement("div");
    board.className = "maze-board";

    mazeMap.forEach((row, y) => {

        row.forEach((cell, x) => {

            const box = document.createElement("div");
            box.className = "maze-cell";

            if (cell === 1) {
                box.classList.add("maze-wall");
            }

            if (
                motorMazePosition.x === x &&
                motorMazePosition.y === y
            ) {
                box.textContent = "🙂";
                box.classList.add("maze-player");
            } else if (x === 6 && y === 6) {
                box.textContent = "🚪";
            } else {
                box.textContent = "";
            }

            board.appendChild(box);
        });
    });

    area.appendChild(board);

    const controls = document.createElement("div");
    controls.className = "maze-controls";

    [
        ["⬆️", 0, -1],
        ["⬅️", -1, 0],
        ["⬇️", 0, 1],
        ["➡️", 1, 0]
    ].forEach(([label, dx, dy]) => {

        const button = document.createElement("button");
        button.textContent = label;

        button.onclick = () => {
            moveMazePlayer(dx, dy, area);
        };

        controls.appendChild(button);
    });

    area.appendChild(controls);
}


function moveMazePlayer(dx, dy, area) {

    const newX = motorMazePosition.x + dx;
    const newY = motorMazePosition.y + dy;

    if (
        newX < 0 ||
        newY < 0 ||
        newX >= 7 ||
        newY >= 7
    ) {
        return;
    }

    if (mazeMap[newY][newX] === 1) {
        setOptionalText("motorResult", "Бұл жол жабық. Басқа бағытты таңда.");
        return;
    }

    motorMazePosition.x = newX;
    motorMazePosition.y = newY;

    renderMaze(area);

    if (newX === 6 && newY === 6) {
        setMotorSuccess("Тамаша! Лабиринттен шықтың!");
    }
}



// ==========================================
// 3. НҮКТЕЛЕРДІ САНМЕН ҚОСУ
// ==========================================

const dotPoints = [
    [150, 35],
    [230, 100],
    [210, 200],
    [150, 250],
    [90, 200],
    [70, 100],
    [150, 35]
];


function createDotsGame(area) {

    motorDotStep = 0;

    const instruction = document.getElementById("motorInstruction");

    if (instruction) {
        instruction.textContent =
            "Нүктелерді 1, 2, 3... ретімен басып қос. Соңында сурет пайда болады.";
    }

    const canvas = document.createElement("canvas");

    canvas.width = 300;
    canvas.height = 300;
    canvas.className = "dot-canvas";

    area.appendChild(canvas);

    const context = canvas.getContext("2d");

    drawDotPoints(context);

    canvas.onclick = event => {

        const rect = canvas.getBoundingClientRect();

        const x = (event.clientX - rect.left) *
            (canvas.width / rect.width);

        const y = (event.clientY - rect.top) *
            (canvas.height / rect.height);

        const point = dotPoints[motorDotStep];

        if (!point) return;

        const distance = Math.hypot(
            x - point[0],
            y - point[1]
        );

        if (distance < 22) {

            if (motorDotStep > 0) {

                const previous = dotPoints[motorDotStep - 1];

                context.beginPath();
                context.moveTo(previous[0], previous[1]);
                context.lineTo(point[0], point[1]);
                context.strokeStyle = "#6c42c2";
                context.lineWidth = 4;
                context.stroke();
            }

            motorDotStep++;

            drawDotLabels(context);

            if (motorDotStep === dotPoints.length) {
                setMotorSuccess("Керемет! Суретті аяқтадың!");
            }

        } else {
            setOptionalText(
                "motorResult",
                "Келесі нүктені мұқият таңда."
            );
        }
    };
}


function drawDotPoints(context) {

    context.clearRect(0, 0, 300, 300);

    dotPoints.forEach((point, index) => {

        context.beginPath();
        context.arc(point[0], point[1], 9, 0, Math.PI * 2);

        context.fillStyle = "#f3b13f";
        context.fill();

        context.fillStyle = "#222";
        context.font = "14px Arial";
        context.fillText(index + 1, point[0] + 10, point[1] - 10);
    });
}


function drawDotLabels(context) {

    context.fillStyle = "#222";
    context.font = "bold 18px Arial";

    context.fillText(
        "Жалғастыр!",
        105,
        285
    );
}



// ==========================================
// 4. СУРЕТТІ БОЯУ
// ==========================================

function createColoringGame(area) {

    const instruction = document.getElementById("motorInstruction");

    if (instruction) {
        instruction.textContent =
            "Түсті таңда. Содан кейін суреттің ішіндегі бөліктерді боя.";
    }

    const palette = document.createElement("div");
    palette.className = "color-palette";

    const colors = [
        "#e74c3c",
        "#f1c40f",
        "#2ecc71",
        "#3498db",
        "#9b59b6",
        "#ff8c42",
        "#ffffff",
        "#333333"
    ];

    colors.forEach(color => {

        const button = document.createElement("button");

        button.style.background = color;
        button.className = "color-button";
        button.setAttribute("aria-label", color);

        button.onclick = () => {
            motorColor = color;
        };

        palette.appendChild(button);
    });

    area.appendChild(palette);

    const canvas = document.createElement("canvas");

    canvas.width = 320;
    canvas.height = 300;
    canvas.className = "coloring-canvas";

    area.appendChild(canvas);

    const ctx = canvas.getContext("2d");

    motorCanvas = canvas;
    motorCanvasContext = ctx;

    // Гүлдің қарапайым контуры
    function drawFlower() {

        ctx.clearRect(0, 0, 320, 300);

        ctx.lineWidth = 3;
        ctx.strokeStyle = "#222";

        // Күлтелер
        const petals = [
            [160, 85],
            [205, 125],
            [190, 180],
            [130, 180],
            [115, 125]
        ];

        petals.forEach(([x, y]) => {

            ctx.beginPath();
            ctx.arc(x, y, 34, 0, Math.PI * 2);
            ctx.stroke();
        });

        // Ортасы
        ctx.beginPath();
        ctx.arc(160, 135, 29, 0, Math.PI * 2);
        ctx.stroke();

        // Сабақ
        ctx.beginPath();
        ctx.moveTo(160, 210);
        ctx.lineTo(160, 275);
        ctx.stroke();

        // Жапырақтар
        ctx.beginPath();
        ctx.ellipse(125, 240, 30, 12, -0.4, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(195, 255, 30, 12, 0.4, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawFlower();

    canvas.addEventListener("click", event => {

        const rect = canvas.getBoundingClientRect();

        const x = (event.clientX - rect.left) *
            (canvas.width / rect.width);

        const y = (event.clientY - rect.top) *
            (canvas.height / rect.height);

        ctx.beginPath();
        ctx.arc(x, y, 13, 0, Math.PI * 2);
        ctx.fillStyle = motorColor;
        ctx.fill();
    });

    const clearButton = document.createElement("button");

    clearButton.textContent = "Қайта бояу";

    clearButton.onclick = drawFlower;

    area.appendChild(clearButton);

    setOptionalText(
        "motorResult",
        "Түстерді таңдап, суретті өз қалауыңша боя!"
    );
}



// ==========================================
// 5. ЕСТЕ САҚТАУ ОЙЫНЫ
// ==========================================

function createMemoryGame(area) {

    const instruction = document.getElementById("motorInstruction");

    if (instruction) {
        instruction.textContent =
            "Карточкаларды ашып, бірдей суреттерді тап.";
    }

    const icons = [
        "🍎", "🍎",
        "🐱", "🐱",
        "🌸", "🌸",
        "🚗", "🚗",
        "⭐", "⭐",
        "🐟", "🐟"
    ];

    motorMemoryCards = icons
        .map((value, index) => ({ value, index }))
        .sort(() => Math.random() - 0.5);

    motorMatchedCards = [];

    let opened = [];
    let locked = false;

    const grid = document.createElement("div");
    grid.className = "memory-grid";

    motorMemoryCards.forEach((card, index) => {

        const button = document.createElement("button");

        button.className = "memory-card";
        button.textContent = "?";

        button.onclick = () => {

            if (
                locked ||
                opened.includes(index) ||
                motorMatchedCards.includes(index)
            ) {
                return;
            }

            button.textContent = card.value;
            opened.push(index);

            if (opened.length === 2) {

                locked = true;

                const first = opened[0];
                const second = opened[1];

                if (
                    motorMemoryCards[first].value ===
                    motorMemoryCards[second].value
                ) {

                    motorMatchedCards.push(first, second);
                    opened = [];
                    locked = false;

                    if (motorMatchedCards.length === icons.length) {
                        setMotorSuccess("Жарайсың! Барлық жұпты таптың!");
                    }

                } else {

                    setTimeout(() => {

                        grid.children[first].textContent = "?";
                        grid.children[second].textContent = "?";

                        opened = [];
                        locked = false;

                    }, 800);
                }
            }
        };

        grid.appendChild(button);
    });

    area.appendChild(grid);
}



// ==========================================
// 6. ЗАТТАРДЫ СҰРЫПТАУ
// ==========================================

function createSortingGame(area) {

    const instruction = document.getElementById("motorInstruction");

    if (instruction) {
        instruction.textContent =
            "Әр затты дұрыс санатқа орналастыр. Затты басып, санатты таңда.";
    }

    const items = [
        { name: "Алма", icon: "🍎", type: "fruit" },
        { name: "Алмұрт", icon: "🍐", type: "fruit" },
        { name: "Сәбіз", icon: "🥕", type: "vegetable" },
        { name: "Қияр", icon: "🥒", type: "vegetable" },
        { name: "Мысық", icon: "🐱", type: "animal" },
        { name: "Ит", icon: "🐶", type: "animal" }
    ];

    let selectedItem = null;
    let sortedCount = 0;

    const itemArea = document.createElement("div");
    itemArea.className = "sorting-items";

    const categories = document.createElement("div");
    categories.className = "sorting-categories";

    items.forEach(item => {

        const button = document.createElement("button");

        button.className = "sorting-item";
        button.textContent = item.icon + " " + item.name;

        button.onclick = () => {

            selectedItem = item;

            setOptionalText(
                "motorResult",
                item.name + " таңдалды. Енді санатты таңда."
            );

            itemArea.querySelectorAll("button").forEach(btn => {
                btn.classList.remove("selected");
            });

            button.classList.add("selected");
        };

        itemArea.appendChild(button);
    });

    const categoryList = [
        { name: "Жемістер", type: "fruit" },
        { name: "Көкөністер", type: "vegetable" },
        { name: "Жануарлар", type: "animal" }
    ];

    categoryList.forEach(category => {

        const button = document.createElement("button");

        button.className = "drop-zone";
        button.textContent = category.name;

        button.onclick = () => {

            if (!selectedItem) {
                setOptionalText(
                    "motorResult",
                    "Алдымен бір затты таңда."
                );
                return;
            }

            if (selectedItem.type === category.type) {

                const selectedButton = [...itemArea.children].find(
                    btn => btn.textContent.includes(selectedItem.name)
                );

                if (selectedButton) {
                    selectedButton.disabled = true;
                    selectedButton.classList.add("sorted");
                }

                sortedCount++;

                setOptionalText(
                    "motorResult",
                    "Дұрыс! " + selectedItem.name +
                    " — " + category.name.toLowerCase() + "."
                );

                selectedItem = null;

                if (sortedCount === items.length) {
                    setMotorSuccess("Барлық затты дұрыс сұрыптадың!");
                }

            } else {

                setOptionalText(
                    "motorResult",
                    "Қайта ойланып көр. Бұл зат басқа санатқа жатады."
                );
            }
        };

        categories.appendChild(button);
    });

    area.appendChild(itemArea);
    area.appendChild(categories);
}



// ==========================================
// 7. АЙЫРМАШЫЛЫҚТЫ ТАП
// ==========================================

function createDifferenceGame(area) {

    const instruction = document.getElementById("motorInstruction");

    if (instruction) {
        instruction.textContent =
            "Екі кестені салыстыр. Оң жақтағы суреттен өзгеше тұрған ұяшықтарды тап.";
    }

    const leftPicture = [
        ["🌸", "🌳", "☀️"],
        ["🐦", "🌼", "☁️"],
        ["🌷", "🦋", "🌱"]
    ];

    const rightPicture = [
        ["🌸", "🌳", "🌙"],
        ["🐦", "🌼", "☁️"],
        ["🌷", "🐝", "🌱"]
    ];

    const differences = ["0-2", "2-1"];
    const found = [];

    const wrapper = document.createElement("div");
    wrapper.className = "difference-wrapper";

    [leftPicture, rightPicture].forEach((picture, pictureIndex) => {

        const grid = document.createElement("div");
        grid.className = "difference-grid";

        picture.forEach((row, y) => {

            row.forEach((icon, x) => {

                const cell = document.createElement("button");

                cell.textContent = icon;

                if (pictureIndex === 1) {

                    cell.onclick = () => {

                        const key = y + "-" + x;

                        if (differences.includes(key)) {

                            if (!found.includes(key)) {

                                found.push(key);

                                cell.classList.add("difference-found");

                                setOptionalText(
                                    "motorResult",
                                    "Дұрыс! Айырмашылық табылды."
                                );

                                if (found.length === differences.length) {
                                    setMotorSuccess("Екі айырмашылықты да таптың!");
                                }
                            }

                        } else {

                            setOptionalText(
                                "motorResult",
                                "Бұл ұяшық бірдей. Басқасын тексер."
                            );
                        }
                    };
                }

                grid.appendChild(cell);
            });
        });

        wrapper.appendChild(grid);
    });

    area.appendChild(wrapper);

    const labels = document.createElement("div");
    labels.textContent = "Сол жақтағы сурет   |   Оң жақтағы сурет";
    area.appendChild(labels);
}



// ==========================================
// 8. ҚАЗЫНАҒА ЖЕТУ
// ==========================================

const treasureMap = [
    [0, 0, 1, 0, 0, 0],
    [1, 0, 1, 0, 1, 0],
    [0, 0, 0, 0, 1, 0],
    [0, 1, 1, 0, 0, 0],
    [0, 0, 0, 1, 1, 0],
    [1, 1, 0, 0, 0, 0]
];

let treasurePosition = { x: 0, y: 0 };


function createTreasureGame(area) {

    treasurePosition = { x: 0, y: 0 };

    const instruction = document.getElementById("motorInstruction");

    if (instruction) {
        instruction.textContent =
            "Қазынаға жету үшін кедергілерден айналып өт.";
    }

    renderTreasureMap(area);
}


function renderTreasureMap(area) {

    area.innerHTML = "";

    const board = document.createElement("div");
    board.className = "maze-board";

    treasureMap.forEach((row, y) => {

        row.forEach((cell, x) => {

            const box = document.createElement("div");
            box.className = "maze-cell";

            if (cell === 1) {
                box.classList.add("maze-wall");
            }

            if (
                treasurePosition.x === x &&
                treasurePosition.y === y
            ) {
                box.textContent = "🙂";
            } else if (x === 5 && y === 5) {
                box.textContent = "💎";
            }

            board.appendChild(box);
        });
    });

    area.appendChild(board);

    const controls = document.createElement("div");
    controls.className = "maze-controls";

    [
        ["⬆️", 0, -1],
        ["⬅️", -1, 0],
        ["⬇️", 0, 1],
        ["➡️", 1, 0]
    ].forEach(([label, dx, dy]) => {

        const button = document.createElement("button");

        button.textContent = label;

        button.onclick = () => {
            moveTreasure(dx, dy, area);
        };

        controls.appendChild(button);
    });

    area.appendChild(controls);
}


function moveTreasure(dx, dy, area) {

    const x = treasurePosition.x + dx;
    const y = treasurePosition.y + dy;

    if (
        x < 0 || y < 0 ||
        x >= 6 || y >= 6 ||
        treasureMap[y][x] === 1
    ) {
        setOptionalText(
            "motorResult",
            "Бұл бағытта кедергі бар. Басқа жолды таңда."
        );
        return;
    }

    treasurePosition = { x, y };

    renderTreasureMap(area);

    if (x === 5 && y === 5) {
        setMotorSuccess("Құттықтаймын! Қазынаны таптың!");
    }
}



// ==========================================
// ОЙЫНДЫ АЯҚТАУ ЖӘНЕ КЕЛЕСІ ОЙЫН
// ==========================================

function setMotorSuccess(message) {

    motorScore++;

    setOptionalText(
        "motorResult",
        message
    );

    const result = document.getElementById("motorResult");

    if (result) {
        result.classList.add("motor-success");
    }
}


function checkMotorGame() {

    if (!currentMotorGame) {
        return;
    }

    setOptionalText(
        "motorResult",
        "Ойынды орындап көр. Әрекетіңді аяқтаған соң келесі ойынға өт."
    );
}


function nextMotorGame() {

    const games = Object.keys(motorGameNames);
    const currentIndex = games.indexOf(currentMotorGame);

    const nextIndex = currentIndex + 1;

    if (nextIndex >= games.length) {

        const game = document.getElementById("motorGame");
        const menu = document.getElementById("motorMenu");

        if (game) game.style.display = "none";
        if (menu) menu.style.display = "block";

        setOptionalText(
            "motorResult",
            "Барлық ұсақ моторика ойындарын қарап шықтың!"
        );

        currentMotorGame = "";
        return;
    }

    startMotorGame(games[nextIndex]);
}


function backToMotorMenu() {

    const game = document.getElementById("motorGame");
    const menu = document.getElementById("motorMenu");

    if (game) game.style.display = "none";
    if (menu) menu.style.display = "block";

    currentMotorGame = "";
}
