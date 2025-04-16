const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let drawing = false;
let erasing = false;
let currentColor = "#000000";
let brushSize = 5;
let usingGray = true;

const grayPalette = ["#000000", "#444444", "#888888", "#BBBBBB", "#EEEEEE"];
const colorPalette = ["#ff0000", "#00ff00", "#0000ff", "#ffa500", "#800080"];

let strokes = []; // Массив мазков

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

    // Сохраняем мазок
    strokes.push({
        from: { x: lastX, y: lastY },
        to: { x: e.offsetX, y: e.offsetY },
        color: strokeColor,
        size: brushSize
    });

    lastX = e.offsetX;
    lastY = e.offsetY;
});

// Переключение палитры
document.getElementById("toggle-palette").addEventListener("click", () => {
    const oldPalette = usingGray ? grayPalette : colorPalette;
    const newPalette = usingGray ? colorPalette : grayPalette;
    usingGray = !usingGray;

    // Перекрасим все мазки
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

    // Обновляем палитру и цвет
    renderPalette(newPalette);
    const currentIndex = oldPalette.indexOf(currentColor);
    currentColor = newPalette[currentIndex !== -1 ? currentIndex : 0];

    // Перерисовываем холст
    redrawCanvas();
});

// Резинка
document.getElementById("eraser").addEventListener("click", () => {
    erasing = true;
});

// Очистка холста
document.getElementById("clear").addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokes = [];
});

// Сохранение
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

// Размер кисти
const sizeInput = document.getElementById("size");
const sizeValue = document.getElementById("size-value");

sizeInput.addEventListener("input", () => {
    brushSize = parseInt(sizeInput.value);
    sizeValue.textContent = brushSize;
});

// Отображение кисти
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

// Первичная инициализация
renderPalette(grayPalette);
currentColor = grayPalette[0];
