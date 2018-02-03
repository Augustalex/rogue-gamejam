import World from './world.js';
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
let preRenderSurface = null;
let tileCanvases = [];
let backgroundCanvas = null;
let initial = true;
let first = true;

export default async function draw(finalCanvas, finalContext, store, localStore, clientId) {
    if (!preRenderSurface) {
        preRenderSurface = document.createElement('canvas');
        preRenderSurface.width = finalCanvas.width;
        preRenderSurface.height = finalCanvas.height;
    }
    if (vignetteImage.complete && !vignetteCanvas) {
        vignetteCanvas = document.createElement('canvas');
        vignetteCanvas.width = finalCanvas.width;
        vignetteCanvas.height = finalCanvas.height
    }
    if(first){
        first = false;
        heavyBrickLefts = await loadHeavyBricks('Left');
        heavyBrickRights = await loadHeavyBricks('Right');
        await Sprites.loadResources();
    }
    let canvas = preRenderSurface;
    let context = preRenderSurface.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    let tilesHor = World.width / 32;
    let tilesVert = World.height / 32;
    context.imageSmoothingEnabled = false;
    if (backgroundImage.complete) {
        if (initial) {
            for (let x = 0; x < 5; x++) {
                for (let y = 1; y < 5; y++) {
                    let canvas = document.createElement('canvas');
                    canvas.width = 32;
                    canvas.height = 32;
                    let context = canvas.getContext('2d');
                    context.imageSmoothingEnabled = false;
                    context.drawImage(backgroundImage, x * 16, y * 16, 16, 16, 0, 0, 32, 32);
                    tileCanvases.push(canvas);
                }
            }

            if (!backgroundCanvas) {
                backgroundCanvas = document.createElement('canvas');
                backgroundCanvas.width = finalCanvas.width;
                backgroundCanvas.height = finalCanvas.height;
                let context = backgroundCanvas.getContext('2d');
                context.imageSmoothingEnabled = false;
                for (let x = -128; x < 32 * tilesHor; x += 32) {
                    for (let y = -128; y < 32 * tilesVert; y += 32) {
                        let i = parseInt(Math.random() * 20);
                        context.drawImage(tileCanvases[i], x, y, 32, 32);
                    }
                }
                for(let brick of World.bricks){
                    context.drawImage(heavyBrickLefts[parseInt(Math.random() * 4)], brick.x, brick.y - 2, 32, 32);
                    context.drawImage(heavyBrickRights[parseInt(Math.random() * 4)], brick.x + 32, brick.y - 2, 32, 32);
                }
            }
            initial = false;
        }
        context.drawImage(backgroundCanvas, 0, 0, backgroundCanvas.width, backgroundCanvas.height);
        //context.globalAlpha = 0.5;
        //context.fillStyle = "black";
        //context.fillRect(0, 0, canvas.width, canvas.height);
        //context.globalAlpha = 1;
    }
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
    let zoom = 1.5;
    //context.drawImage(zoomCanvas, -players[0].x*zoom + canvas.width/2, -players[0].y*zoom + canvas.height/2, canvas.width*zoom, canvas.height*zoom);
    let sx = players[0].position.x - (canvas.width / zoom) / 2;
    let sy = players[0].position.y - (canvas.height / zoom) / 2;
    //context.FillRect(0, 0, canvas.width, canvas.height);
    finalContext.fillStyle = "black";
    finalContext.imageSmoothingEnabled = false;
    finalContext.fillRect(0, 0, canvas.width, canvas.height);
    finalContext.drawImage(preRenderSurface, sx, sy, canvas.width / zoom, canvas.height / zoom, 0, 0, canvas.width, canvas.height);

    if (vignetteCanvas && !store.state.localPlayerDead) {
        applyVignette(store, clientId, finalCanvas, finalContext);
    }

    if (store.state.localPlayerDead) {
        applyDarkScreenEffect(finalCanvas, finalContext)
    }
    else {
        applyBloom(finalContext);
    }

    function drawPlayer(context, {
        position: { x, y },
        color,
        moving,
        shooting,
        teleporting,
        teleportCursor
    }) {
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
            context.fillStyle = 'black';
            context.globalAlpha = 0.5;
            fillRectRot(x, y + 12, 10, 10, dir);
            context.filter = "none";
        }
        context.globalAlpha = 1;
        context.drawImage(Sprites.character, x - 6 , y - 30);
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
            fillRectRot(bullet.x + Math.cos(dir)*arrowLength/2, bullet.y + Math.sin(dir)*6, 2, 3, dir);
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
}

function loadHeavyBricks(side){
    let promises = [];
    for(let i = 1; i < 5; i++){
        promises.push(loadImageAsync(`./sprites/heavy/sprite_Tile_HeavyBrick${side}00${i}.png`));
    }
    return Promise.all(promises);
}

function loadImageAsync(path){
    var image = new Image();
    image.src = path;
    return new Promise(function (resolve){
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
