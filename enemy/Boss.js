import options from '../options.js'
import utils from '../utils.js';
import BossFysik from './BossFysik.js';
import Sprites from '../sprites.js';

const { genId, rand255, rHue, rColor } = utils;

function Boss(storeDependencies, state) {
    let { store, localStore } = storeDependencies;

    state.speed = 20;

    let {
        id,
        color,
        controllerId
    } = state;

    let towerImage = new Image();
    let bossFysik = BossFysik(storeDependencies, state);
    localStore.state.bulletsByShooterId[id] = {};

    return {
        id,
        controllerId,
        setPosition(x, y) {
            state.position.x = x;
            state.position.y = y;
        },
        getPosition() {
            return { x: state.position.x, y: state.position.y };
        },
        setMoving(x, y) {
            state.moving.x = x;
            state.moving.y = y;
        },
        async loadSprite() {
            await new Promise(resolve => {
                towerImage.onload = resolve;
                towerImage.src = './sprites/tower.png';
            });
        },
        setEntityHealth(health) {
            state.health = health;
        },
        render({ context, canvas, camera }) {
            let bullets = Object.keys(store.state.bulletsByShooterId[id]).map(bulletId => store.state.bulletsByShooterId[id][bulletId])
            if (state.position.x > camera.x + camera.w || state.position.x < camera.x
                || state.position.y > camera.y + camera.h || state.position.y < camera.y) {
                for (let bullet of bullets) {
                    drawBullet(context, bullet, color);
                }
                return;
            }
            let behindBoss = bullets.filter(b => b.y <= state.position.y - 80); // todo make variable shoot offset and use in fysik
            let inFrontOffBoss = bullets.filter(b => b.y > state.position.y - 80); // todo make variable shoot offset and use in fysik
            for (let bullet of behindBoss) {
                drawBullet(context, bullet, color)
            }
            if (Sprites.boss.complete) {
                let scale = 2;
                if (state.isMoving) {
                    state.currentFrame += 0.5;
                    if (state.currentFrame > 23.5) {
                        state.currentFrame = 0;
                    }
                }
                let frame = Math.floor(state.currentFrame);
                let sprite = Sprites.bossPast;
                if (store.state.presentDimension) {
                    sprite = Sprites.bossPresent;
                }
                let subImage = sprite[frame];
                context.drawImage(subImage, Math.floor(state.position.x - Sprites.boss.width * scale / 2), Math.floor(state.position.y - Sprites.boss.height * scale), Sprites.boss.width * scale, Sprites.boss.height * scale);
            }
            for (let bullet of inFrontOffBoss) {
                drawBullet(context, bullet, color);
            }

            if (state.playerInRange) {
                drawHealthBar(context, canvas, camera, state);
                drawTitle(context, canvas, camera);
            }
        },
        fysik(delta) {
            bossFysik(delta);
        },
        getState() {
            return {
                health: state.health
            }
        }
    };

    function drawHealthBar(context, canvas, camera) {
        let inset = 64;
        context.fillStyle = 'white';
        context.globalAlpha = 0.15;
        let height = 20;
        context.fillRect(camera.x + inset, camera.y + camera.h - inset / 2 - height, canvas.width - inset * 2, height);
        context.globalAlpha = 0.8;
        let multiPlyer = state.health / state.maxHealth;
        context.fillRect(camera.x + inset, camera.y + camera.h - inset / 2 - height, (canvas.width - inset * 2) * multiPlyer, height);
    }

    function drawTitle(context, canvas, camera) {
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.font = '22px sans serif';
        let w = 80;
        context.globalAlpha = 0.4;
        context.fillRect(camera.x + camera.w / 2 - w, camera.y + 20, w * 2, 2);
        context.globalAlpha = 0.3;
        context.fillRect(camera.x + camera.w / 2 - w, camera.y + 80, w * 2, 2);
        context.globalAlpha = 1;
        context.fillText('Jättegammel sten monster', camera.x + camera.w / 2, camera.y + 60);
    }

    function drawBullet(context, bullet, color) {
        if (bullet.isLaser) {
            let dir = Math.atan2(bullet.direction.y, bullet.direction.x);
            context.fillStyle = `hsl(${bullet.hue},${sat}%,80%)`;
            fillRectRot(context, bullet.x, bullet.y, 32, 16, dir);
        }
        else {
            if (options.useShadows) {
                context.beginPath();
                context.arc(Math.floor(bullet.x), Math.floor(bullet.y + bullet.height / 1.1 + 1), 8 + bullet.height / 4, 0, 2 * Math.PI, false);
                context.fillStyle = 'black';
                context.globalAlpha = Math.max(1.1 - bullet.height / 22, 0);
                context.fill();
                context.globalAlpha = 1;
            }

            if(bullet.presentDimension === store.state.presentDimension){
                context.beginPath();
                context.arc(Math.floor(bullet.x), Math.floor(bullet.y), 8, 0, 2 * Math.PI, false);
                context.fillStyle = `hsl(${bullet.hue},100%,70%)`;
                context.fill();
                context.lineWidth = 2;
                context.strokeStyle = `hsl(${bullet.hue},100%,58%)`;
                context.stroke();
            }else {
                context.beginPath();
                context.arc(Math.floor(bullet.x), Math.floor(bullet.y), 8, 0, 2 * Math.PI, false);
                context.globalAlpha = 0.5;
                context.fillStyle = '#442f33';
                context.fill();
                context.globalAlpha = 1;
            }
        }
    }
};
Boss.createState = function ({ controllerId, x, y }) {
    return {
        clone: false,
        id: genId(),
        color: rColor(),
        maxHealth: 15000,
        health: 15000,
        position: {
            x: x,
            y: y
        },
        moving: {
            x: 0,
            y: 0
        },
        isMoving: true,
        currentFrame: 0,
        speed: 100,
        controllerId
    };
};
export default Boss;

let sat = 50;



function fillRectRot(context, x, y, width, height, dir) {
    context.save();
    context.translate(Math.floor(x), Math.floor(y));
    context.rotate(dir);
    context.fillRect(-width / 2, -height / 2, width, height);
    context.restore()
}