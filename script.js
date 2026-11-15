// =====================================================
// СӨЙЛЕУ ӘЛЕМІНЕ САЯХАТ
// НЕГІЗГІ БАСҚАРУ ЖҮЙЕСІ
// =====================================================


// 1. ДЫБЫСТАР ТІЗІМІ

const soundList = [
    { key: "R", symbol: "Р", title: "Р дыбысы", icon: "🚀" },
    { key: "L", symbol: "Л", title: "Л дыбысы", icon: "🌸" },
    { key: "G", symbol: "Г", title: "Г дыбысы", icon: "🎈" },
    { key: "GH", symbol: "Ғ", title: "Ғ дыбысы", icon: "🌳" },
    { key: "K", symbol: "К", title: "К дыбысы", icon: "🔑" },
    { key: "Q", symbol: "Қ", title: "Қ дыбысы", icon: "🏰" },
    { key: "SH", symbol: "Ш", title: "Ш дыбысы", icon: "🦋" },
    { key: "ZH", symbol: "Ж", title: "Ж дыбысы", icon: "☀️" },
    { key: "Z", symbol: "З", title: "З дыбысы", icon: "🐝" },
    { key: "S", symbol: "С", title: "С дыбысы", icon: "⭐" }
];


// 2. КЕЗЕҢДЕР

const defaultStages = [
    {
        title: "Дайындық кезеңі",
        description: "Артикуляциялық жаттығулар мен тыныс алуды дамыту",
        icon: "👄"
    },
    {
        title: "Дыбысты қою кезеңі",
        description: "Дұрыс дыбыстауды қалыптастыру",
        icon: "🎯"
    },
    {
        title: "Автоматтандыру кезеңі",
        description: "Дыбысты буында, сөзде және сөйлемде бекіту",
        icon: "🗣️"
    },
    {
        title: "Дифференциация кезеңі",
        description: "Ұқсас дыбыстарды ажырату",
        icon: "🧠"
    }
];


// 3. ЖҰМЫС ЖАҒДАЙЫ

let currentSound = null;
let currentStageIndex = 0;
let currentTaskIndex = 0;
let currentTasks = [];

let completedTasks = [];

try {
    const saved = JSON.parse(
        localStorage.getItem("soileuCompletedTasks") || "[]"
    );

    if (Array.isArray(saved)) {
        completedTasks = saved.map(String);
    }
} catch (error) {
    completedTasks = [];
}


// 4. HTML ЭЛЕМЕНТТЕРІ

function el(id) {
    return document.getElementById(id);
}

function setText(id, value) {
    const element = el(id);

    if (element) {
        element.textContent =
            value === undefined || value === null
                ? ""
                : String(value);
    }
}


// 5. DATA.JS ТЕКСЕРУ

function checkData() {
    if (typeof speechTasks === "undefined") {
        console.error("ҚАТЕ: speechTasks табылмады. data.js файлын тексер!");
        return false;
    }

    return true;
}


// 6. ДЫБЫС ДЕРЕГІН АЛУ

function getSoundData(soundKey) {
    if (!checkData()) return null;

    return speechTasks[soundKey] || null;
}


// 7. КЕЗЕҢДЕРДІ АЛУ

function getStages(soundKey) {
    const soundData = getSoundData(soundKey);

    if (!soundData || !soundData.stages) {
        return [];
    }

    if (Array.isArray(soundData.stages)) {
        return soundData.stages;
    }

    return Object.values(soundData.stages);
}


// 8. КЕЗЕҢНІҢ ТАПСЫРМАЛАРЫН АЛУ

function getTasksFromStage(stage) {
    if (!stage) return [];

    // Кезең тікелей массив болса
    if (Array.isArray(stage)) {
        return stage;
    }

    // Кезең ішінде tasks массиві болса
    if (Array.isArray(stage.tasks)) {
        return stage.tasks;
    }

    return [];
}


// 9. БАРЛЫҚ ТАПСЫРМАЛАРДЫ АЛУ

function getAllTasksForSound(soundKey) {
    const stages = getStages(soundKey);

    let result = [];

    stages.forEach(stage => {
        result = result.concat(getTasksFromStage(stage));
    });

    return result;
}


// 10. БЕТТЕРДІ АУЫСТЫРУ

function showPage(pageId) {
    const pages = [
        "homePage",
        "soundSection",
        "stagePage",
        "taskPage",
        "diplomaPage"
    ];

    pages.forEach(id => {
        const page = el(id);

        if (page) {
            page.classList.add("hidden");
        }
    });

    const selected = el(pageId);

    if (selected) {
        selected.classList.remove("hidden");
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// 11. САЯХАТТЫ БАСТАУ

function startJourney() {
    if (!checkData()) {
        alert("data.js файлы жүктелмеді. Файлдардың ретін тексер!");
        return;
    }

    showPage("soundSection");
    createSoundMenu();
}


// 12. ДЫБЫСТАР МӘЗІРІ

function createSoundMenu() {
    const menu = el("soundMenu");

    if (!menu) {
        console.error("soundMenu элементі табылмады!");
        return;
    }

    menu.innerHTML = "";

    soundList.forEach(sound => {
        const data = getSoundData(sound.key);

        if (!data) {
            console.error("Дерек табылмады:", sound.key);
            return;
        }

        const allTasks = getAllTasksForSound(sound.key);

        const done = allTasks.filter(task =>
            completedTasks.includes(String(task.id))
        ).length;

        const button = document.createElement("button");

        button.type = "button";
        button.className = "sound-button";

        button.innerHTML = `
            <span class="sound-icon">${sound.icon}</span>
            <span class="sound-symbol">${sound.symbol}</span>
            <span class="sound-title">${sound.title}</span>
            <span class="sound-progress">${done}/${allTasks.length} тапсырма</span>
        `;

        button.addEventListener("click", () => {
            selectSound(sound.key);
        });

        menu.appendChild(button);
    });
}


// 13. ДЫБЫСТЫ ТАҢДАУ

function selectSound(soundKey) {
    const data = getSoundData(soundKey);

    if (!data) {
        alert("Бұл дыбыстың деректері табылмады!");
        return;
    }

    currentSound = soundKey;
    currentStageIndex = 0;
    currentTaskIndex = 0;

    showPage("stagePage");
    createStageMenu();
}


// 14. АҒЫМДАҒЫ КЕЗЕҢДІ АЛУ

function getCurrentStage() {
    const stages = getStages(currentSound);

    return stages[currentStageIndex] || null;
}


// 15. КЕЗЕҢ ТАПСЫРМАЛАРЫН АЛУ

function getStageTasks(stageIndex) {
    const stages = getStages(currentSound);

    return getTasksFromStage(stages[stageIndex]);
}


// 16. КЕЗЕҢ АТАУЫН АЛУ

function getStageTitle(stage, index) {
    if (stage && stage.title) return stage.title;
    if (stage && stage.name) return stage.name;

    return defaultStages[index]?.title || `Кезең ${index + 1}`;
}


// 17. КЕЗЕҢ СИПАТТАМАСЫН АЛУ

function getStageDescription(stage, index) {
    if (stage && stage.description) return stage.description;

    return defaultStages[index]?.description || "";
}


// 18. КЕЗЕҢДЕР МӘЗІРІН ҚҰРУ

function createStageMenu() {
    const menu = el("stageMenu");

    if (!menu) {
        console.error("stageMenu элементі табылмады!");
        return;
    }

    menu.innerHTML = "";

    const stages = getStages(currentSound);

    const sound = soundList.find(item =>
        item.key === currentSound
    );

    setText(
        "soundTitle",
        sound ? sound.title : "Дыбыс әлемі"
    );

    stages.forEach((stage, index) => {
        const tasks = getTasksFromStage(stage);

        const done = tasks.filter(task =>
            completedTasks.includes(String(task.id))
        ).length;

        const percent = tasks.length
            ? Math.round(done / tasks.length * 100)
            : 0;

        const button = document.createElement("button");

        button.type = "button";
        button.className = "stage-button";

        button.innerHTML = `
            <span class="stage-icon">
                ${defaultStages[index]?.icon || "🌟"}
            </span>

            <strong>${getStageTitle(stage, index)}</strong>

            <span class="stage-description">
                ${getStageDescription(stage, index)}
            </span>

            <span class="stage-task-count">
                ${tasks.length} тапсырма
            </span>

            <span class="stage-progress">
                ${done}/${tasks.length} орындалды
            </span>

            <span class="stage-percent">
                ${percent}% аяқталды
            </span>
        `;

        button.addEventListener("click", () => {
            selectStage(index);
        });

        menu.appendChild(button);
    });
}


// 19. КЕЗЕҢДІ ТАҢДАУ

function selectStage(stageIndex) {
    currentStageIndex = Number(stageIndex);
    currentTaskIndex = 0;

    currentTasks = getStageTasks(currentStageIndex);

    if (!currentTasks.length) {
        alert("Бұл кезеңде тапсырмалар табылмады!");
        return;
    }

    displayTask();
}


// 20. ТАПСЫРМАНЫ КӨРСЕТУ

function displayTask() {
    if (!currentTasks.length) return;

    const task = currentTasks[currentTaskIndex];

    if (!task) return;

    showPage("taskPage");

    const stage = getCurrentStage();

    setText(
        "stageTitle",
        getStageTitle(stage, currentStageIndex)
    );

    setText(
        "stageDescription",
        getStageDescription(stage, currentStageIndex)
    );

    setText(
        "taskNumber",
        `Тапсырма ${currentTaskIndex + 1}`
    );

    setText(
        "taskCounter",
        `${currentTaskIndex + 1}/${currentTasks.length}`
    );

    setText("taskCategory", task.category);
    setText("taskName", task.title);
    setText("taskGoal", task.goal);
    setText("taskInstruction", task.instruction);
    setText("taskExample", task.example);
    setText("taskVisual", task.visual);
    setText("taskCheck", task.check);
    setText("taskHint", task.help);

    updateProgress();
    updateNavigationButtons();

    const completeButton = el("completeButton");

    if (completeButton) {
        const done = completedTasks.includes(String(task.id));

        completeButton.disabled = done;

        completeButton.textContent = done
            ? "✓ Орындалды"
            : "✓ Тапсырманы орындадым";
    }

    // Жаңа тапсырмаға өткенде құралдарды тоқтату
    stopCamera();
    stopMicrophone();

    // Камера бөлімі бастапқыда жасырын болады
    const cameraSection = el("cameraSection");

    if (cameraSection) {
        cameraSection.classList.add("hidden");
    }
}


// 21. ПРОГРЕСТІ ЕСЕПТЕУ

function updateProgress() {
    const done = currentTasks.filter(task =>
        completedTasks.includes(String(task.id))
    ).length;

    const percent = currentTasks.length
        ? Math.round(done / currentTasks.length * 100)
        : 0;

    setText("progressText", `${percent}%`);

    const bar = el("progressBar");

    if (bar) {
        bar.style.width = `${percent}%`;
    }
}


// 22. ТАПСЫРМАНЫ ОРЫНДАЛДЫ ДЕП САҚТАУ

function completeTask() {
    const task = currentTasks[currentTaskIndex];

    if (!task) return;

    const id = String(task.id);

    if (!completedTasks.includes(id)) {
        completedTasks.push(id);

        localStorage.setItem(
            "soileuCompletedTasks",
            JSON.stringify(completedTasks)
        );
    }

    updateProgress();

    const button = el("completeButton");

    if (button) {
        button.disabled = true;
        button.textContent = "✓ Орындалды";
    }

    setTimeout(() => {
        if (currentTaskIndex < currentTasks.length - 1) {
            currentTaskIndex++;
            displayTask();
        } else {
            alert("Жарайсың! Бұл кезеңнің барлық тапсырмасы аяқталды!");
            showPage("stagePage");
            createStageMenu();
        }
    }, 400);
}


// 23. АЛДЫҢҒЫ ТАПСЫРМА

function previousTask() {
    if (currentTaskIndex > 0) {
        currentTaskIndex--;
        displayTask();
    }
}


// 24. КЕЛЕСІ ТАПСЫРМА

function nextTask() {
    if (currentTaskIndex < currentTasks.length - 1) {
        currentTaskIndex++;
        displayTask();
    }
}


// 25. НАВИГАЦИЯ БАТЫРМАЛАРЫ

function updateNavigationButtons() {
    const previous = el("previousButton");
    const next = el("nextButton");

    if (previous) {
        previous.disabled = currentTaskIndex === 0;
    }

    if (next) {
        next.disabled =
            currentTaskIndex === currentTasks.length - 1;
    }
}


// 26. КЕЗЕҢДЕРГЕ ҚАЙТУ

function goStages() {
    stopCamera();
    stopMicrophone();

    showPage("stagePage");
    createStageMenu();
}


// 27. БАСТЫ БЕТКЕ ҚАЙТУ

function goHome() {
    stopCamera();
    stopMicrophone();

    currentSound = null;
    currentTasks = [];

    showPage("homePage");
}


// 28. КАМЕРАНЫ ҚОСУ

let cameraStream = null;

async function startCamera() {
    const video = el("cameraVideo");
    const section = el("cameraSection");

    if (!navigator.mediaDevices?.getUserMedia) {
        alert("Камера бұл браузерде қолжетімсіз.");
        return;
    }

    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "user"
            },
            audio: false
        });

        if (video) {
            video.srcObject = cameraStream;
            video.style.transform = "scaleX(-1)";
            await video.play();
        }

        if (section) {
            section.classList.remove("hidden");
        }

    } catch (error) {
        console.error("Камера қатесі:", error);
        alert("Камераға рұқсат беріп, қайта көріңіз.");
    }
}


// 29. КАМЕРАНЫ ӨШІРУ

function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }

    const video = el("cameraVideo");

    if (video) {
        video.srcObject = null;
    }
}


// 30. МИКРОФОНДЫ ҚОСУ

let microphoneStream = null;
let audioContext = null;
let microphoneAnimation = null;

async function startMicrophone() {
    if (!navigator.mediaDevices?.getUserMedia) {
        alert("Микрофон бұл браузерде қолжетімсіз.");
        return;
    }

    try {
        microphoneStream = await navigator.mediaDevices.getUserMedia({
            audio: true
        });

        audioContext = new (
            window.AudioContext ||
            window.webkitAudioContext
        )();

        await audioContext.resume();

        const source =
            audioContext.createMediaStreamSource(microphoneStream);

        const analyser = audioContext.createAnalyser();

        analyser.fftSize = 256;

        source.connect(analyser);

        const data = new Uint8Array(analyser.frequencyBinCount);

        function measure() {
            if (!analyser) return;

            analyser.getByteFrequencyData(data);

            let sum = 0;

            for (let i = 0; i < data.length; i++) {
                sum += data[i];
            }

            const average = sum / data.length;

            if (average < 10) {
                setText("microphoneStatus", "🔈 Дыбыс деңгейі: төмен");
            } else if (average < 35) {
                setText("microphoneStatus", "🔉 Дыбыс деңгейі: орташа");
            } else {
                setText("microphoneStatus", "🔊 Дыбыс деңгейі: жоғары");
            }

            microphoneAnimation =
                requestAnimationFrame(measure);
        }

        measure();

    } catch (error) {
        console.error("Микрофон қатесі:", error);
        alert("Микрофонға рұқсат беріңіз.");
    }
}


// 31. МИКРОФОНДЫ ӨШІРУ

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

    setText("microphoneStatus", "Микрофон өшірулі");
}


// 32. ЖАЛПЫ ПРОГРЕСТІ ЕСЕПТЕУ

function checkAllProgress() {
    let total = 0;
    let done = 0;

    soundList.forEach(sound => {
        const tasks = getAllTasksForSound(sound.key);

        total += tasks.length;

        done += tasks.filter(task =>
            completedTasks.includes(String(task.id))
        ).length;
    });

    return {
        total,
        done,
        percent: total
            ? Math.round(done / total * 100)
            : 0
    };
}


// 33. ДИПЛОМДЫ КӨРСЕТУ

function showDiploma() {
    const progress = checkAllProgress();

    if (progress.total !== 400 || progress.done < 400) {
        alert(
            `Диплом алу үшін барлық тапсырманы аяқта!\nОрындалғаны: ${progress.done}/${progress.total}`
        );

        return;
    }

    showPage("diplomaPage");

    const diploma = el("diplomaPage");

    if (!diploma) return;

    diploma.innerHTML = `
        <div class="diploma-card">

            <div class="diploma-icon">🏆</div>

            <h1>ҚҰТТЫҚТАЙМЫЗ!</h1>

            <h2>ДЫБЫСТАР ШЕБЕРІ</h2>

            <p>
                Сен «Сөйлеу әлеміне саяхат»
                бағдарламасындағы 400 тапсырманы
                сәтті аяқтадың!
            </p>

            <div class="diploma-stars">
                ⭐ ⭐ ⭐ ⭐ ⭐
            </div>

            <h3>Жарайсың!</h3>

            <button onclick="goHome()">
                Басты бетке оралу
            </button>

        </div>
    `;
}


// 34. БАРЛЫҚ ФУНКЦИЯЛАРДЫ HTML-ГЕ ҚОСУ

window.startJourney = startJourney;
window.createSoundMenu = createSoundMenu;
window.selectSound = selectSound;
window.selectStage = selectStage;
window.displayTask = displayTask;
window.completeTask = completeTask;
window.previousTask = previousTask;
window.nextTask = nextTask;
window.goStages = goStages;
window.goHome = goHome;
window.startCamera = startCamera;
window.stopCamera = stopCamera;
window.startMicrophone = startMicrophone;
window.stopMicrophone = stopMicrophone;
window.showDiploma = showDiploma;


// 35. БАҒДАРЛАМАНЫ ТЕКСЕРУ

document.addEventListener("DOMContentLoaded", function() {
    console.log("🌍 Сөйлеу әлеміне саяхат іске қосылды!");

    if (!checkData()) {
        console.error("data.js файлын жүктеу қатесі!");
        return;
    }

    let total = 0;

    soundList.forEach(sound => {
        const tasks = getAllTasksForSound(sound.key);

        console.log(
            sound.symbol + " дыбысы:",
            tasks.length,
            "тапсырма"
        );

        total += tasks.length;
    });

    console.log("Жалпы тапсырма саны:", total);

    if (total !== 400) {
        console.warn(
            "Ескерту: 400 тапсырма табылмады. data.js құрылымын тексер!"
        );
    }
});
