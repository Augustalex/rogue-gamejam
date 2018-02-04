import World from './world.js';
import Sprites from './sprites.js';
import worldData from './mapLoader/worldData2.js';
import WorldMaker from './mapLoader/WorldMaker.js';

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
let preRenderSurface = null;
let first = true;
let worldMaker = WorldMaker(worldData);
let worldCanvas = null;

export default async function draw(finalCanvas, finalContext, store, localStore, clientId) {
    if (first) {
        first = false;
        heavyBrickLefts = await loadHeavyBricks('Left');
        heavyBrickRights = await loadHeavyBricks('Right');
        await Sprites.loadResources();
        worldCanvas = await worldMaker.make();
    }
    if (!preRenderSurface) {
        preRenderSurface = document.createElement('canvas');
        preRenderSurface.width = worldCanvas.width;
        preRenderSurface.height = worldCanvas.height;
    }
    if (vignetteImage.complete && !vignetteCanvas) {
        vignetteCanvas = document.createElement('canvas');
        vignetteCanvas.width = finalCanvas.width;
        vignetteCanvas.height = finalCanvas.height
    }

    let canvas = preRenderSurface;
    let context = preRenderSurface.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = false;

    store.state.blood.animateAndDraw(context);

    let players = Object.keys(store.state.playersById).map(key => store.state.playersById[key]);
    for (let player of players) {
        drawPlayer(context, player);
        colorByShooterId[player.id] = player.color
    }

    for (let bulletId of Object.keys(store.state.bullets)) {
        let bullet = store.state.bullets[bulletId];
        drawBullet(context, bullet, colorByShooterId[bullet.shooterId])
    }

    for (let entityId in store.state.entitiesById) {
        if (store.state.entitiesById.hasOwnProperty(entityId)) {
            store.state.entitiesById[entityId].render(context);
        }
    }

    context.globalAlpha = 1;
    let zoom = 1;
    let clientPlayer = store.state.playersById[store.state.clientId];
    //context.drawImage(zoomCanvas, -players[0].x*zoom + canvas.width/2, -players[0].y*zoom + canvas.height/2, canvas.width*zoom, canvas.height*zoom);
    let sx = Math.round(clientPlayer.position.x - (finalCanvas.width / zoom) / 2);
    let sy = Math.round(clientPlayer.position.y - (finalCanvas.height / zoom) / 2);
    //context.FillRect(0, 0, canvas.width, canvas.height);

    //Final draw to the visible canvas (the camera)
    finalContext.fillStyle = "black";
    finalContext.imageSmoothingEnabled = false;
    finalContext.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

    let wsx = Math.round(clientPlayer.position.x - (finalCanvas.width / zoom) / 2);
    let wsy = Math.round(clientPlayer.position.y - (finalCanvas.height / zoom) / 2);
    let sw = finalCanvas.width / zoom;
    let sh = finalCanvas.height / zoom;
    finalContext.drawImage(worldCanvas, wsx, wsy, sw, sh, 0, 0, finalCanvas.width, finalCanvas.height);
    finalContext.drawImage(preRenderSurface, sx, sy, finalCanvas.width / zoom, finalCanvas.height / zoom, 0, 0, finalCanvas.width, finalCanvas.height);

    if (vignetteCanvas && !store.state.localPlayerDead) {
        applyVignette(store, clientId, finalCanvas, finalContext);
    }

    if (store.state.localPlayerDead) {
        applyDarkScreenEffect(finalCanvas, finalContext)
    }
    else {
        applyBloom(finalContext);
    }

    function drawPlayer(context, { position: { x, y }, color, moving, shooting, teleporting, teleportCursor }) {
        if (teleporting) {
            context.beginPath();
            context.arc(x + teleportCursor.x, y + teleportCursor.y, 8, 0, 2 * Math.PI, false);
            context.lineWidth = 2;
            context.strokeStyle = 'red';
            context.stroke();
        }
        context.fillStyle = color;
        let aimVector = moving;
        if (shooting.direction.x || shooting.direction.y) {
            aimVector = shooting.direction
        }
        let dir = Math.atan2(aimVector.y, aimVector.x);
        if (shadows) {
            // context.globalAlpha = 0.5;
            context.fillStyle = 'black';
            drawCircle(x, y, 10);
            // context.filter = "none";
        }
        context.globalAlpha = 1;
        let scale = 2;
        context.imageSmoothingEnabled = false;
        context.drawImage(Sprites.character, x - Sprites.character.width * scale / 2, y - Sprites.character.height * scale, Sprites.character.width * scale, Sprites.character.height * scale);
    }

    function drawBullet(context, bullet, color) {
        if (bullet.isEnemy) {
            if (shadows) {
                context.beginPath();
                context.arc(bullet.x, bullet.y + bullet.height / 1.1 + 1, 8 + bullet.height / 4, 0, 2 * Math.PI, false);
                context.fillStyle = 'black';
                context.globalAlpha = Math.max(1.1 - bullet.height / 22, 0);
                context.fill();
                context.globalAlpha = 1;
            }

            context.beginPath();
            context.arc(bullet.x, bullet.y, 8, 0, 2 * Math.PI, false);
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
                fillRectRot(bullet.x, bullet.y + bullet.height + 2, 12, 2, dir)
            }
            context.globalAlpha = 0.5;
            context.fillStyle = 'brown';
            let arrowLength = 16;
            fillRectRot(bullet.x, bullet.y, arrowLength, 2, dir);
            context.globalAlpha = 1;
            context.fillStyle = 'white';
            fillRectRot(bullet.x + Math.cos(dir) * arrowLength / 2, bullet.y + Math.sin(dir) * 6, 2, 3, dir);
            context.fillStyle = 'red';
            //fillRectRot(bullet.x + Math.cos(dir + Math.PI)*arrowLength/2, bullet.y + Math.sin(dir + Math.PI)*arrowLength/2, 2, 3, dir);
        }
    }

    function fillRectRot(x, y, width, height, dir) {
        context.save();
        context.translate(x, y);
        context.rotate(dir);
        context.fillRect(-width / 2, -height / 2, width, height);
        context.restore()
    }

    function drawCircle(x, y, radius) {
        context.beginPath();
        context.arc(x, y, radius, 0, 2 * Math.PI);
        context.fill();
    }
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
    finalContext.drawImage(canvas, 0, 0);
    finalContext.filter = "none";
    finalContext.globalCompositeOperation = "source-over";
}

function applyBloom(finalContext) {
    finalContext.filter = "brightness(" + 1.0 + ") blur(" + 8 + "px)";
    finalContext.globalCompositeOperation = "lighten";
    finalContext.globalAlpha = 0.6;
    //finalContext.drawImage(canvas, 0, 0);
    finalContext.filter = "none";
    finalContext.globalCompositeOperation = "source-over";
}

function applyVignette(store, clientId, finalCanvas, finalContext) {
    let playerHealth = store.state.playersById[clientId].health;
    let vignetteContext = vignetteCanvas.getContext('2d');
    vignetteContext.clearRect(0, 0, vignetteCanvas.width, vignetteCanvas.height);
    finalContext.globalAlpha = 0.8;
    vignetteContext.globalCompositeOperation = 'source-over';
    vignetteContext.drawImage(vignetteImage, 0, 0, vignetteCanvas.width, vignetteCanvas.height);
    vignetteContext.globalCompositeOperation = 'source-in';
    vignetteContext.fillStyle = `rgb(${255 * ((100 - playerHealth) / 100)},0,0)`;
    vignetteContext.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
    finalContext.drawImage(vignetteCanvas, 0, 0, finalCanvas.width, finalCanvas.height);
    finalContext.globalAlpha = 1;
}
