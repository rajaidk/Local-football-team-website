function loadTheme() {
    let savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
        document.body.classList.add("darkMode");
    } else {
        document.body.classList.remove("darkMode");
    }
}

function updateButtonText() {
    let button = document.getElementById("themeBtn");

    if (button) {
        if (document.body.classList.contains("darkMode")) {
            button.textContent = "☀️ Light Mode";
        } else {
            button.textContent = "🌙 Dark Mode";
        }
    }
}
function toggleTheme() {
    document.body.classList.toggle("darkMode");

    if (document.body.classList.contains("darkMode")) {
        localStorage.setItem("theme", "dark");
    } else {
        localStorage.setItem("theme", "light");
    }

    updateButtonText();
}

function setupButton() {
    let button = document.getElementById("themeBtn");

    if (button) {
        button.onclick = toggleTheme;
    }
}

loadTheme();
updateButtonText();
setupButton();