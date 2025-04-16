const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let drawing = false;
let erasing = false;
let currentColor = "#000000";
let brushSize = 5;
let usingGray = true;

const grayPalette = ["#000000", "#444444", "#888888", "#BBBBBB", "#EEEEEE"];
let colorPalette = generateRandomColorPalette();

let strokes = [];

function generateRandomColorPalette(count = 5) {
    const palette = [];
    for (let i = 0; i < count; i++) {
        const color = `hsl(${Math.floor(Math.random() * 360)}, 100%, 50%)`;
        palette.push(color);
    }
    return palette;
}

function renderPalette(palette) {
    const paletteContainer = document.getElementById("palette");
    paletteContainer.innerHTML = "";
    palette.forEach((color, index) => {
        const btn = document.createElement("button");
        btn.className = "color";
        btn.dataset.index = index;
        btn.style.backgroundColor = color;
        paletteContainer.appendChild(btn);
    });
    updateColorEvents(palette);
}

function updateColorEvents(palette) {
    document.querySelectorAll(".color").forEach(btn => {
        btn.addEventListener("click", () => {
            const index = parseInt(btn.dataset.index);
            currentColor = palette[index];
            erasing = false;
        });
    });
}

function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokes.forEach(s => {
        ctx.beginPath();
        ctx.lineWidth = s.size;
        ctx.lineCap = "round";
        ctx.strokeStyle = s.color;
        ctx.moveTo(s.from.x, s.from.y);
        ctx.lineTo(s.to.x, s.to.y);
        ctx.stroke();
    });
}

let lastX = 0;
let lastY = 0;

canvas.addEventListener("mousedown", (e) => {
    drawing = true;
    lastX = e.offsetX;
    lastY = e.offsetY;
});

canvas.addEventListener("mouseup", () => {
    drawing = false;
});

canvas.addEventListener("mousemove", (e) => {
    if (!drawing) return;

    const strokeColor = erasing ? "#ffffff" : currentColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.strokeStyle = strokeColor;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();

    strokes.push({
        from: { x: lastX, y: lastY },
        to: { x: e.offsetX, y: e.offsetY },
        color: strokeColor,
        size: brushSize
    });

    lastX = e.offsetX;
    lastY = e.offsetY;
});

document.getElementById("toggle-palette").addEventListener("click", () => {
    const oldPalette = usingGray ? grayPalette : colorPalette;
    const newPalette = usingGray ? (colorPalette = generateRandomColorPalette()) : grayPalette;
    usingGray = !usingGray;

    strokes = strokes.map(stroke => {
        const index = oldPalette.indexOf(stroke.color);
        if (index !== -1) {
            return {
                ...stroke,
                color: newPalette[index]
            };
        }
        return stroke;
    });

    renderPalette(newPalette);

    const currentIndex = oldPalette.indexOf(currentColor);
    currentColor = newPalette[currentIndex !== -1 ? currentIndex : 0];

    redrawCanvas();
});

document.getElementById("eraser").addEventListener("click", () => {
    erasing = true;
});

document.getElementById("clear").addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokes = [];
});

document.getElementById("save").addEventListener("click", () => {
    const nickname = prompt("Введите ваш никнейм:");
    if (!nickname) return;

    const image = canvas.toDataURL("image/png");

    fetch("/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: image, nickname: nickname })
    })
    .then(res => res.json())
    .then(() => {
        alert("Изображение сохранено!");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        strokes = [];
    })
    .catch(err => {
        alert("Ошибка при сохранении.");
        console.error(err);
    });
});

const sizeInput = document.getElementById("size");
const sizeValue = document.getElementById("size-value");

sizeInput.addEventListener("input", () => {
    brushSize = parseInt(sizeInput.value);
    sizeValue.textContent = brushSize;
});

const preview = document.getElementById("brush-preview");

canvas.addEventListener("mousemove", (e) => {
    const x = e.pageX;
    const y = e.pageY;

    preview.style.left = `${x}px`;
    preview.style.top = `${y}px`;
    preview.style.width = `${brushSize}px`;
    preview.style.height = `${brushSize}px`;
    preview.style.background = erasing ? "#fff" : currentColor;
    preview.style.borderColor = "#000";
});

// Стартовая палитра
renderPalette(grayPalette);
currentColor = grayPalette[0];
