var backgroundImage = new Image();
backgroundImage.src = './sprites/tile_brick.png';
var vignetteImage = new Image();
vignetteImage.src = './sprites/vignette.png';
var towerImage = new Image();
towerImage.src = './sprites/tower.png';

let shadows = true; // Also enable fallingBullets in fysik.js
let perspective = true;

let colorByShooterId = {};
setInterval(() => {
    colorByShooterId = {}
}, 30000);

let vignetteCanvas = null;
let preRenderSurface = null;

export default function draw(finalCanvas, finalContext, store, localStore, clientId) {
    if (!preRenderSurface) {
        preRenderSurface = document.createElement('canvas');
        preRenderSurface.width = finalCanvas.width;
        preRenderSurface.height = finalCanvas.height
    }
    if (vignetteImage.complete && !vignetteCanvas) {
        vignetteCanvas = document.createElement('canvas');
        vignetteCanvas.width = finalCanvas.width;
        vignetteCanvas.height = finalCanvas.height
    }

    let canvas = preRenderSurface;
    let context = preRenderSurface.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    let tilesHor = canvas.width / 32;
    let tilesVert = canvas.height / 32;

    //context.mozImageSmoothingEnabled = false;
    //context.webkitImageSmoothingEnabled = false;
    //context.msImageSmoothingEnabled = false;

    context.imageSmoothingEnabled = false;
    if (backgroundImage.complete) {
        for (let x = -128; x < 32 * tilesHor; x += 32) {
            for (let y = -128; y < 32 * tilesVert; y += 32) {
                context.drawImage(backgroundImage, x, y, 32, 32);
            }
        }
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

    if (towerImage.complete) {
        context.drawImage(towerImage, 400 - 34 / 2, 400 - 34 / 2, 34, 34)
    }

    context.globalAlpha = 1;
    let zoom = 1.5;
    //context.drawImage(zoomCanvas, -players[0].x*zoom + canvas.width/2, -players[0].y*zoom + canvas.height/2, canvas.width*zoom, canvas.height*zoom);
    let sx = players[0].position.x - (canvas.width / zoom) / 2;
    let sy = players[0].position.y - (canvas.height / zoom) / 2;
    //context.FillRect(0, 0, canvas.width, canvas.height);
    finalContext.fillStyle = "black";
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

    function drawPlayer(context, { position: { x, y }, color, moving, shooting }) {
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

        context.fillStyle = color;
        if (perspective) {
            let horMult = Math.sin(dir + Math.PI / 4);
            let vertMult = Math.cos(dir + Math.PI / 4);
            if (dir === 0 || (dir / (Math.PI / 2) % 1 === 0)) {
                horMult = Math.sin(dir);
                vertMult = Math.cos(dir);
            }
            var gradient = context.createLinearGradient(0, 0, horMult * 8, vertMult * 8);
            context.globalAlpha = 1;
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, "black");
            for (let yy = y + 10; yy > y; yy -= 1) {
                context.fillStyle = gradient;
                fillRectRot(x, yy, 10, 10, dir)
            }
            context.globalAlpha = 1;
            gradient = context.createLinearGradient(0, 0, horMult * 12, vertMult * 12);
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, "black");
            context.fillStyle = gradient
        }
        context.globalAlpha = 1;
        fillRectRot(x, y, 10, 10, dir);
        context.fillStyle = color;
        let gunPosX = x + Math.cos(dir + Math.PI / 4) * 9;
        let gunPosY = y + Math.sin(dir + Math.PI / 4) * 9;
        fillRectRot(gunPosX, gunPosY, 8, 3, dir)
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
                context.globalAlpha = 0.8;
                fillRectRot(bullet.x, bullet.y + bullet.height + 2, 12, 4, dir)
            }
            context.globalAlpha = bullet.height;
            context.fillStyle = color;
            fillRectRot(bullet.x, bullet.y, 12, 4, dir);
            context.globalAlpha = 1;
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
