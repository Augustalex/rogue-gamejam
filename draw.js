import Sprites from './sprites.js';

var backgroundImage = new Image();
backgroundImage.src = './sprites/sprite_Tile_Edge.png';
var vignetteImage = new Image();
vignetteImage.src = './sprites/vignette.png';
var towerImage = new Image();
towerImage.src = './sprites/tower.png';

var heavyBrickLefts;
var heavyBrickRights = [];

let shadows = true; // Also enable fallingBullets in fysik.js
let perspective = true;

let colorByShooterId = {};
setInterval(() => {
    colorByShooterId = {}
}, 30000);

let vignetteCanvas = null;
let first = true;

let previousClientPosition = null;
let rain = null;

export default async function draw({ canvas: finalCanvas, context: finalContext }, { store, localStore, clientId }) {
    // var t0 = performance.now();
    if (first) {
        first = false;
        heavyBrickLefts = await loadHeavyBricks('Left');
        heavyBrickRights = await loadHeavyBricks('Right');
        await Sprites.loadResources();
        rain = Rain(finalCanvas, finalContext);
    }
    let worldLayer = store.state.worldLayer.layer;

    let zoom = 1;
    let clientPlayer = store.state.playersById[store.state.clientId];
    let clientPlayerPosition = clientPlayer && clientPlayer.position;
    if (!clientPlayer && previousClientPosition) {
        clientPlayerPosition = previousClientPosition;
    }
    previousClientPosition = clientPlayerPosition;

    let camera = {
        x: Math.round(clientPlayerPosition.x - (finalCanvas.width / zoom) * .5),
        y: Math.round(clientPlayerPosition.y - (finalCanvas.height / zoom) * .5),
        w: finalCanvas.width,
        h: finalCanvas.height
    };

    let preRenderSurface = document.createElement('canvas');
    preRenderSurface.width = camera.w;
    preRenderSurface.height = camera.h;
    let preRenderContext = preRenderSurface.getContext('2d');
    preRenderContext.translate(-camera.x, -camera.y);

    if (vignetteImage.complete && !vignetteCanvas) {
        vignetteCanvas = document.createElement('canvas');
        vignetteCanvas.width = finalCanvas.width;
        vignetteCanvas.height = finalCanvas.height
    }
    let context = preRenderContext;
    context.imageSmoothingEnabled = false;

    // store.state.blood.animateAndDraw(context);
    context.globalAlpha = 0.3;
    context.fillStyle = "black";
    context.fillRect(351, 6555, 52, 32);
    context.globalAlpha = 1;
    context.drawImage(Sprites.chest, 346, 6551, 64, 32);

    let players = Object.keys(store.state.playersById).map(key => store.state.playersById[key]);
    for (let player of players) {
        drawPlayer(context, player, camera);
        colorByShooterId[player.id] = player.color
    }

    for (let bulletId of Object.keys(store.state.bullets)) {
        let bullet = store.state.bullets[bulletId];
        drawBullet(context, bullet, colorByShooterId[bullet.shooterId])
    }

    for (let entityId in store.state.entitiesById) {
        if (store.state.entitiesById.hasOwnProperty(entityId)) {
            store.state.entitiesById[entityId].render({ context, canvas: preRenderSurface, camera });
        }
    }

    // context.globalAlpha = 1;

    //Final draw to the visible canvas (the camera)
    // finalContext.fillStyle = "#2C2E33";
    if (localStore.state.presentDimension) {
        finalContext.fillStyle = "#77b3e0";
    }
    else {
        finalContext.fillStyle = "#2f3c50";
    }
    finalContext.imageSmoothingEnabled = false;
    finalContext.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

    const tileWidth = 32;
    const tileHeight = 32;
    for (let y = 0; y < worldLayer.length; y++) {
        let tileY = y * tileHeight;
        for (let x = 0; x < worldLayer[y].length; x++) {
            let { tile, presentTile } = worldLayer[y][x] || {};
            if (presentTile && store.state.presentDimension) {
                tile = presentTile;
            }
            if (!tile || tile === 'EMPTY') continue;

            let tileX = x * tileWidth;
            if (tileX > camera.x + camera.w || tileX + tileWidth < camera.x
                || tileY > camera.y + camera.h || tileY + tileHeight < camera.y) {
                continue;
            }
            finalContext.drawImage(tile, (tileX) - camera.x, tileY - camera.y, tileWidth, tileHeight);
        }
    }

    finalContext.drawImage(preRenderSurface, 0, 0, finalCanvas.width, finalCanvas.height);
    if (!localStore.state.presentDimension) {
        rain.draw();
    }

    if (vignetteCanvas && !store.state.localPlayerDead) {
        applyVignette(store, clientId, finalCanvas, finalContext);
    }

    if (store.state.localPlayerDead) {
        applyDarkScreenEffect(finalCanvas, finalContext)
    }
    else {
        if (!store.state.presentDimension) {
            applyBloom(finalContext, finalCanvas);
        }
    }

    // var t1 = performance.now();
    // console.log("Call to Draw.js took " + (t1 - t0) + " milliseconds.")
}

function drawPlayer(context, { position: { x, y }, color, moving, shooting, teleporting, teleportCursor, id, sprite }, camera) {
    if (x > camera.x + camera.w || x < camera.x
        || y > camera.y + camera.h || y < camera.y) {
        return;
    }

    if (teleporting) {
        context.beginPath();
        context.arc(Math.floor(x + teleportCursor.x), Math.floor(y + teleportCursor.y), 8, 0, 2 * Math.PI, false);
        context.lineWidth = 2;
        context.strokeStyle = 'red';
        context.stroke();
    }
    context.fillStyle = color;
    // let dir = Math.atan2(aimVector.y, aimVector.x);
    if (shadows) {
        // context.globalAlpha = 0.5;
        context.fillStyle = 'rgba(0,0,0,0.2)';
        drawCircle(context, Math.floor(x), Math.floor(y - 2), 10);
        // context.filter = "none";
    }
    context.globalAlpha = 1;
    let scale = 2;
    context.imageSmoothingEnabled = false;
    if(!sprite) {
        //console.log('!SPRITE');
    }
    if (!sprite) return;
    context.drawImage(sprite, Math.floor(x - sprite.width * scale / 2), Math.floor(y - sprite.height * scale), sprite.width * scale, sprite.height * scale);
}

function drawBullet(context, bullet, color) {
    if (bullet.isLaser) {
        let dir = Math.atan2(bullet.direction.y, bullet.direction.x);
        context.fillStyle = `hsl(${bullet.hue},${80}%,80%)`;
        fillRectRot(context, bullet.x, bullet.y, 64, 64, dir);
    }
    else if (bullet.isEnemy) {
        if (shadows) {
            context.beginPath();
            context.arc(Math.floor(bullet.x), Math.floor(bullet.y + bullet.height / 1.1 + 1), 8 + bullet.height / 4, 0, 2 * Math.PI, false);
            context.fillStyle = 'black';
            context.globalAlpha = Math.max(1.1 - bullet.height / 22, 0);
            context.fill();
            context.globalAlpha = 1;
        }

        context.beginPath();
        context.arc(Math.floor(bullet.x), Math.floor(bullet.y), 8, 0, 2 * Math.PI, false);
        context.fillStyle = 'white';
        context.fill();
        context.lineWidth = 2;
        context.strokeStyle = '#ac00ff';
        context.stroke();
    }
    else {
        let dir = Math.atan2(bullet.direction.y, bullet.direction.x);
        if (shadows) {
            context.fillStyle = 'black';
            context.globalAlpha = 0.5;
            fillRectRot(context, Math.floor(bullet.x), Math.floor(bullet.y + bullet.height + 2), 12, 2, dir)
        }
        context.globalAlpha = 0.5;
        context.fillStyle = 'brown';
        let arrowLength = 16;
        fillRectRot(context, bullet.x, bullet.y, arrowLength, 2, dir);
        context.globalAlpha = 1;
        context.fillStyle = 'white';
        fillRectRot(context, bullet.x + Math.cos(dir) * arrowLength / 2, bullet.y + Math.sin(dir) * 6, 2, 3, dir);
        context.fillStyle = 'red';
        //fillRectRot(bullet.x + Math.cos(dir + Math.PI)*arrowLength/2, bullet.y + Math.sin(dir + Math.PI)*arrowLength/2, 2, 3, dir);
    }
}

function drawCircle(context, x, y, radius) {
    context.beginPath();
    context.arc(Math.floor(x), Math.floor(y), radius, 0, 2 * Math.PI);
    context.fill();
}

function fillRectRot(context, x, y, width, height, dir) {
    context.save();
    context.translate(Math.floor(x), Math.floor(y));
    context.rotate(dir);
    context.fillRect(-width * .5, -height * .5, width, height);
    context.restore()
}

function loadHeavyBricks(side) {
    let promises = [];
    for (let i = 1; i < 5; i++) {
        promises.push(loadImageAsync(`./sprites/heavy/sprite_Tile_HeavyBrick${side}00${i}.png`));
    }
    return Promise.all(promises);
}

function loadImageAsync(path) {
    var image = new Image();
    image.src = path;
    return new Promise(function (resolve) {
        image.addEventListener('load', () => {
            resolve(image);
        });
    });
}

function applyDarkScreenEffect(finalCanvas, finalContext) {
    finalContext.filter = "brightness(.2)";
    finalContext.globalAlpha = 1;
    finalContext.drawImage(finalCanvas, 0, 0);
    finalContext.filter = "none";
    finalContext.globalCompositeOperation = "source-over";
}

function applyBloom(finalContext, finalCanvas) {
    finalContext.filter = "brightness(" + 1.0 + ") blur(" + 8 + "px)";
    finalContext.globalCompositeOperation = "lighten";
    finalContext.globalAlpha = 0.5;
    finalContext.drawImage(finalCanvas, 0, 0);
    finalContext.filter = "none";
    finalContext.globalCompositeOperation = "source-over";
    finalContext.globalAlpha = 1;
}

function applyVignette(store, clientId, finalCanvas, finalContext) {
    let playerHealth = store.state.playersById[clientId].health;
    let vignetteContext = vignetteCanvas.getContext('2d');
    vignetteContext.clearRect(0, 0, vignetteCanvas.width, vignetteCanvas.height);
    finalContext.globalAlpha = 0.8;

    vignetteContext.globalCompositeOperation = 'source-over';
    vignetteContext.drawImage(vignetteImage, 0, 0, vignetteCanvas.width, vignetteCanvas.height);
    vignetteContext.globalCompositeOperation = 'source-in';
    vignetteContext.fillStyle = `rgba(163,209,242,.45)`;
    // vignetteContext.fillStyle = `rgba(${255 * ((100 - playerHealth) / 100)},0,0,.1)`;
    vignetteContext.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
    finalContext.drawImage(vignetteCanvas, 0, 0, finalCanvas.width, finalCanvas.height);
    finalContext.globalAlpha = 1;
}

function Rain(canvas, context) {
    var w = canvas.width;
    var h = canvas.height;
    context.strokeStyle = 'rgba(174,194,224,0.5)';
    context.lineWidth = 1;
    context.lineCap = 'round';

    var init = [];
    var maxParts = 250;
    for (var a = 0; a < maxParts; a++) {
        init.push({
            x: Math.random() * w,
            y: Math.random() * h,
            l: Math.random() * 1,
            xs: -4 + Math.random() + 2,
            ys: Math.random() * 10 + 10
        })
    }

    var particles = [];
    for (var b = 0; b < maxParts; b++) {
        particles[b] = init[b];
    }

    return {
        draw
    };

    function draw() {
        // context.clearRect(0, 0, w, h);
        for (var c = 0; c < particles.length; c++) {
            var p = particles[c];
            context.beginPath();
            context.lineWidth = 5;
            context.moveTo(p.x, p.y);
            context.lineTo(p.x + p.l * p.xs, p.y + p.l * p.ys);
            context.stroke();
        }
        move();
    }

    function move() {
        for (var b = 0; b < particles.length; b++) {
            var p = particles[b];
            p.x += p.xs;
            p.y += p.ys;
            if (p.x > w || p.y > h) {
                p.x = Math.random() * w;
                p.y = -20;
            }
        }
    }
}
