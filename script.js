// **1. Initialisierung von Canvas und Spielvariablen**
const canvas = document.getElementById('spielfeld');
const ctx = canvas.getContext('2d');
const punktestandAnzeige = document.getElementById('punktestand');
const highscoreAnzeige = document.getElementById('highscore');
const gameOverElement = document.getElementById('game-over');
const levelMessage = document.getElementById('level-message');

canvas.width = 400;
canvas.height = 400;
const blockGroesse = 20;

let schlange = [{ x: 10, y: 10 }];
let richtung = 'rechts';
let apfel = erzeugeApfel();
let punkte = 0;
let highscore = 0;
let hindernisse = [];
let spielLaeuft = false;
let spielInterval;
let currentLevel = 1;

if (localStorage.getItem('snakeHighscore')) {
    highscore = parseInt(localStorage.getItem('snakeHighscore'));
    highscoreAnzeige.textContent = `Highscore: ${highscore}`;
}

// **2. Generierung von Spielobjekten (Apfel, Hindernisse)**
function erzeugeApfel() {
    return {
        x: Math.floor(Math.random() * (canvas.width / blockGroesse)),
        y: Math.floor(Math.random() * (canvas.height / blockGroesse)),
    };
}

function erzeugeHindernisse(anzahl) {
    const neueHindernisse = [];
    for (let i = 0; i < anzahl; i++) {
        let hindernis;
        do {
            hindernis = {
                x: Math.floor(Math.random() * (canvas.width / blockGroesse)),
                y: Math.floor(Math.random() * (canvas.height / blockGroesse)),
            };
        } while (
            schlange.some(
                (segment) =>
                    segment.x === hindernis.x && segment.y === hindernis.y
            ) ||
            (apfel.x === hindernis.x && apfel.y === hindernis.y) ||
            neueHindernisse.some(
                (h) => h.x === hindernis.x && h.y === hindernis.y
            )
        );
        neueHindernisse.push(hindernis);
    }
    return neueHindernisse;
}

// **3. Level-Logik (Hindernisse und Geschwindigkeit)**
function setLevel(level) {
    hindernisse = [];
    clearInterval(spielInterval);
    currentLevel = level;

    switch (level) {
        case 1:
            hindernisse = [];
            break;
        case 2:
            hindernisse = erzeugeHindernisse(5);
            break;
        case 3:
            hindernisse = erzeugeHindernisse(10);
            break;
        case 4:
            hindernisse = erzeugeHindernisse(5);
            break;
        case 5:
            hindernisse = erzeugeHindernisse(15);
            break;
    }

    spielInterval = setInterval(spielLoop, 150);

    levelMessage.textContent = `Level ${level} gestartet!`;
    levelMessage.classList.add('show');
    setTimeout(() => {
        levelMessage.classList.remove('show');
    }, 3000);
}

// **4. Steuerung (Richtungsänderung und Neustart)**
function setDirection(neueRichtung) {
    if (!spielLaeuft) return;

    if (
        (neueRichtung === 'oben' && richtung !== 'unten') ||
        (neueRichtung === 'unten' && richtung !== 'oben') ||
        (neueRichtung === 'links' && richtung !== 'rechts') ||
        (neueRichtung === 'rechts' && richtung !== 'links')
    ) {
        richtung = neueRichtung;
    }
}

document.addEventListener('keydown', (event) => {
    if (
        gameOverElement.classList.contains('hidden') === false &&
        (event.key === ' ' || event.key === 'Enter')
    ) {
        startGame();
        return;
    }

    switch (event.key) {
        case 'ArrowUp':
            setDirection('oben');
            break;
        case 'ArrowDown':
            setDirection('unten');
            break;
        case 'ArrowLeft':
            setDirection('links');
            break;
        case 'ArrowRight':
            setDirection('rechts');
            break;
    }
});

// **5. Hauptspiel-Logik (Bewegung, Kollisionsprüfung)**
function spielLoop() {
    const kopf = { ...schlange[0] };

    switch (richtung) {
        case 'oben':
            kopf.y--;
            break;
        case 'unten':
            kopf.y++;
            break;
        case 'links':
            kopf.x--;
            break;
        case 'rechts':
            kopf.x++;
            break;
    }

    if (kopf.x < 0) kopf.x = canvas.width / blockGroesse - 1;
    if (kopf.x >= canvas.width / blockGroesse) kopf.x = 0;
    if (kopf.y < 0) kopf.y = canvas.height / blockGroesse - 1;
    if (kopf.y >= canvas.height / blockGroesse) kopf.y = 0;

    if (
        schlange.some((segment) => segment.x === kopf.x && segment.y === kopf.y)
    ) {
        spielEnde();
        return;
    }

    if (
        hindernisse.some(
            (hindernis) => hindernis.x === kopf.x && hindernis.y === kopf.y
        )
    ) {
        spielEnde();
        return;
    }

    if (kopf.x === apfel.x && kopf.y === apfel.y) {
        punkte += 10;
        punktestandAnzeige.textContent = `Punkte: ${punkte}`;
        apfel = erzeugeApfel();
    } else {
        schlange.pop();
    }

    schlange.unshift(kopf);
    zeichneSpielfeld();
}

// **6. Rendering (Zeichnen des Spielfelds und Objekte)**
function zeichneSpielfeld() {
    ctx.fillStyle = '#1a1a2d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ff007f';
    ctx.beginPath();
    ctx.arc(
        apfel.x * blockGroesse + blockGroesse / 2,
        apfel.y * blockGroesse + blockGroesse / 2,
        blockGroesse / 2,
        0,
        Math.PI * 2
    );
    ctx.fill();

    ctx.fillStyle = '#00fff7';
    schlange.forEach((segment) => {
        ctx.beginPath();
        ctx.arc(
            segment.x * blockGroesse + blockGroesse / 2,
            segment.y * blockGroesse + blockGroesse / 2,
            blockGroesse / 2,
            0,
            Math.PI * 2
        );
        ctx.fill();
    });

    ctx.fillStyle = '#00ff00';
    hindernisse.forEach((hindernis) => {
        ctx.fillRect(
            hindernis.x * blockGroesse,
            hindernis.y * blockGroesse,
            blockGroesse,
            blockGroesse
        );
    });
}

// **7. Spiel-Ende (Spielstatus und Highscore speichern)**
function spielEnde() {
    spielLaeuft = false;
    clearInterval(spielInterval);
    gameOverElement.classList.remove('hidden');

    if (punkte > highscore) {
        highscore = punkte;
        localStorage.setItem('snakeHighscore', highscore.toString());
        highscoreAnzeige.textContent = `Highscore: ${highscore}`;
    }
}

// **8. Spiel starten**
function startGame() {
    gameOverElement.classList.add('hidden');
    schlange = [{ x: 10, y: 10 }];
    richtung = 'rechts';
    punkte = 0;
    punktestandAnzeige.textContent = 'Punkte: 0';
    apfel = erzeugeApfel();
    setLevel(currentLevel);
    spielLaeuft = true;
}

// **Initialisierung**
startGame();
