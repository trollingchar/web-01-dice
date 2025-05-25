console.warn("I hate JavaScript!");

const canvas = document.getElementById("gridCanvas");
const ctx = canvas.getContext("2d");
const outputBox = document.getElementById("outputBox");

const X_MIN = -15;
const X_MAX = 55;
const Y_MIN = -5;
const Y_MAX = 35;

const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;

const GRID_WIDTH = X_MAX - X_MIN;
const GRID_HEIGHT = Y_MAX - Y_MIN;

const CELL_SIZE_X = CANVAS_WIDTH / GRID_WIDTH;
const CELL_SIZE_Y = CANVAS_HEIGHT / GRID_HEIGHT;

const pointRadius = 4;

const weights = [58, 166, 262, 346, 418, 478, 526, 562, 586, 598, 598, 586, 562, 526, 478, 418, 346, 262, 166, 58];

let points = [[10, 10], [20, 15]];

let draggingPointIndex = null;

function gridToScreenX(x) {
    return (x - X_MIN) * CELL_SIZE_X;
}

function gridToScreenY(y) {
    return (Y_MAX - y) * CELL_SIZE_Y;
}

function gridToScreen(x, y) {
    return [gridToScreenX(x), gridToScreenY(y)];
}

function drawGrid() {
    ctx.strokeStyle = "#95daf0";
    ctx.lineWidth = 1;

    ctx.beginPath();
    for (let gx = X_MIN; gx <= X_MAX; gx++) {
        const x = gridToScreenX(gx);
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
    }
    for (let gy = Y_MIN; gy <= Y_MAX; gy++) {
        const y = gridToScreenY(gy);
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
    }
    ctx.stroke();
}

function drawAxes() {
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;

    ctx.beginPath();
    const [axisX, axisY] = gridToScreen(0, 0);
    ctx.moveTo(0, axisY);
    ctx.lineTo(CANVAS_WIDTH, axisY);
    ctx.moveTo(axisX, 0);
    ctx.lineTo(axisX, CANVAS_HEIGHT);
    ctx.stroke();
}

function labelAxes() {
    const [axisX, axisY] = gridToScreen(0, 0);

    ctx.fillStyle = "white";
    ctx.font = "8px ObelixPro";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    for (let gx = X_MIN; gx <= X_MAX; gx++) {
        const x = gridToScreenX(gx);
        if (gx !== 0) ctx.fillText(gx, x, axisY + 5);
    }

    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    for (let gy = Y_MIN; gy <= Y_MAX; gy++) {
        const y = gridToScreenY(gy);
        if (gy !== 0) ctx.fillText(gy, axisX - 5, y);
    }
}

function drawPoints() {
    ctx.font = "14px ObelixPro";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    points.forEach(([px, py], _) => {
        const [x, y] = gridToScreen(px, py);

        ctx.beginPath();
        ctx.arc(x, y, pointRadius, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill();
        ctx.strokeStyle = "black";
        ctx.stroke();

        ctx.fillStyle = "white";
        ctx.fillText(`(${px}, ${py})`, x + 8, y + 8);
    });
}

function drawLines() {
    const [x1, y1] = gridToScreen(...points[0]);
    const [x2, y2] = gridToScreen(...points[1]);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const tValues = [
        ...(dx !== 0 ? [(0 - x1) / dx, (CANVAS_WIDTH  - x1) / dx] : []),
        ...(dy !== 0 ? [(0 - y1) / dy, (CANVAS_HEIGHT - y1) / dy] : []),
    ].filter(t => isFinite(t));
    const tMin = Math.min(...tValues);
    const tMax = Math.max(...tValues);
    const xStart = x1 + tMin * dx;
    const yStart = y1 + tMin * dy;
    const xEnd = x1 + tMax * dx;
    const yEnd = y1 + tMax * dy;

    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(xStart, yStart);
    ctx.lineTo(xEnd, yEnd);
    let x, y;
    y = gridToScreenY(0.5);
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    y = gridToScreenY(20.5);
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    y = gridToScreenY(points[0][1] - 0.5);
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    ctx.moveTo(x2, 0);
    ctx.lineTo(x2, CANVAS_HEIGHT);
    x = gridToScreenX(0);
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_HEIGHT);
    ctx.stroke();
}

function drawBarsAndCalculateOutput() {
    ctx.fillStyle = "white";
    const axisX = gridToScreenX(0);
    const [x1, y1] = points[0];
    const [x2, y2] = points[1];
    let total = 0;
    for (let y = Math.max(1, y1); y <= 20; y++) {
        const x = y1 >= y2 || x1 >= x2 ? x2 : Math.min(x2, x1 + (x2 - x1) * (y - y1) / (y2 - y1));
        if (x <= 0) continue;
        total += x * weights[y - 1];
        const thickness = CELL_SIZE_Y * weights[y - 1] / 598;
        ctx.fillRect(axisX, gridToScreenY(y) - thickness * 0.5, x * CELL_SIZE_X, thickness);
    }
    total /= 8000;
    outputBox.textContent = `${y1}:${x1}-${y2}:${x2} = ${total.toFixed(2)}`;
}

function isSamePoint([x1, y1], [x2, y2]) {
    return x1 === x2 && y1 === y2;
}

function getGridCoordinates(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const xRatio = (clientX - rect.left) / CANVAS_WIDTH;
    const yRatio = (clientY - rect.top) / CANVAS_HEIGHT;

    const gridX = X_MIN + xRatio * GRID_WIDTH;
    const gridY = Y_MAX - yRatio * GRID_HEIGHT;

    return [Math.round(gridX), Math.round(gridY)];
}

canvas.addEventListener("mousedown", (e) => {
    const mousePos = getGridCoordinates(e.clientX, e.clientY);

    for (let i = 0; i < points.length; i++) {
        if (!isSamePoint(points[i], mousePos)) continue;
        draggingPointIndex = i;
        break;
    }
});

canvas.addEventListener("mousemove", (e) => {
    if (draggingPointIndex === null) return;

    const pos = getGridCoordinates(e.clientX, e.clientY);
    const otherPoint = points[draggingPointIndex ^ 1];
    if (isSamePoint(pos, points[draggingPointIndex]) || isSamePoint(pos, otherPoint)) return;
    points[draggingPointIndex] = pos;
    // const randomValue = (Math.random() * 1000).toFixed(2);
    // outputBox.textContent = `Результат вычисления: ${randomValue}`;
    drawAll();
});

canvas.addEventListener("mouseup", () => {
    draggingPointIndex = null;
});

outputBox.addEventListener("click", () => {
    navigator.clipboard.writeText(outputBox.textContent).then(_ => {});
});

function drawAll() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawAxes();
    drawBarsAndCalculateOutput();
    drawLines();
    labelAxes();
    drawPoints();
}

(async () => {
    await document.fonts.ready;
    drawAll();
})();