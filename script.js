function startJourney() {
    document.querySelector("header").style.display = "none";
    document.getElementById("menu").style.display = "block";
}

const soundList = [
    "Р", "Л", "Г", "Ғ", "К",
    "Қ", "Ш", "Ж", "З", "С"
];

const soundsContainer = document.getElementById("sounds");

soundList.forEach(sound => {
    const button = document.createElement("button");

    button.className = "sound-button";
    button.textContent = sound;

    button.onclick = function() {
        openSound(sound);
    };

    soundsContainer.appendChild(button);
});

function openSound(sound) {
    alert("Сен " + sound + " дыбысын таңдадың!");
}
