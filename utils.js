export default {
    rand255,
    genId,
    rHue,
    rColor
}

function rand255() {
    return Math.round(Math.random() * 255);
}

function genId() {
    return `${rand255()}${rand255()}${rand255()}`;
}

function rHue() {
    return Math.round(Math.random() * 360);
}

function rColor() {
    return `hsl(${rHue()},100%,80%)`;
}