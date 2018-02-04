import options from '../options.js'
import utils from '../utils.js';
import FriendFysik from './FriendFysik.js';
import Sprites from '../sprites.js';

const { genId, rand255, rHue, rColor } = utils;

function Friend(storeDependencies, state) {
    let { store, localStore } = storeDependencies;

    state.speed = 20;

    let {
        id,
        color,
        controllerId
    } = state;

    let towerImage = new Image();
    let friendFysik = FriendFysik(storeDependencies, state);
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
            if (!store.state.presentDimension) return;

            let { position: { x, y }, color, id } = state;
            if (x < camera.x + camera.w && x > camera.x
                && y < camera.y + camera.h && y > camera.y) {
                context.fillStyle = color;
                // let dir = Math.atan2(aimVector.y, aimVector.x);
                // context.globalAlpha = 0.5;
                context.fillStyle = 'black';
                drawCircle(context, Math.floor(x), Math.floor(y), 10);
                // context.filter = "none";
                context.globalAlpha = 1;
                let scale = 2;
                context.imageSmoothingEnabled = false;
                context.drawImage(Sprites.friend, Math.floor(x - Sprites.friend.width * scale / 2), Math.floor(y - Sprites.friend.height * scale), Sprites.friend.width * scale, Sprites.friend.height * scale);
            }

            let bullets = Object.keys(store.state.bulletsByShooterId[id]).map(bulletId => store.state.bulletsByShooterId[id][bulletId]);
            let behindBoss = bullets.filter(b => b.y <= state.position.y - 80); // todo make variable shoot offset and use in fysik
            let inFrontOffBoss = bullets.filter(b => b.y > state.position.y - 80); // todo make variable shoot offset and use in fysik
            for (let bullet of behindBoss) {
                drawBullet(context, bullet, color)
            }

            for (let bullet of inFrontOffBoss) {
                drawBullet(context, bullet, color);
            }

            // if (state.playerInRange) {
            //     drawHealthBar(context, canvas, camera, state);
            //     drawTitle(context, canvas, camera, state);
            // }
        },
        fysik(delta) {
            friendFysik(delta);
        },
        getState() {
            return {
                health: state.health
            }
        }
    };
};
Friend.createState = function ({ controllerId, x, y }) {
    return {
        clone: false,
        id: genId(),
        color: rColor(),
        maxHealth: 150,
        health: 300,
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
export default Friend;

function drawBullet(context, bullet, color) {
    let dir = Math.atan2(bullet.direction.y, bullet.direction.x);
    context.fillStyle = 'black';
    context.globalAlpha = 0.5;
    fillRectRot(context, Math.floor(bullet.x), Math.floor(bullet.y + bullet.height + 2), 12, 8, dir)
    context.globalAlpha = 1;
    context.fillStyle = 'brown';
    let arrowLength = 16;
    fillRectRot(context, bullet.x, bullet.y, arrowLength, 2, dir);
    context.globalAlpha = 1;
    context.fillStyle = 'white';
    fillRectRot(context, bullet.x + Math.cos(dir) * arrowLength / 2, bullet.y + Math.sin(dir) * 6, 2, 3, dir);
    context.fillStyle = 'red';

}

function fillRectRot(context, x, y, width, height, dir) {
    context.save();
    context.translate(Math.floor(x), Math.floor(y));
    context.rotate(dir);
    context.fillRect(-width / 2, -height / 2, width, height);
    context.restore()
}

function drawCircle(context, x, y, radius) {
    context.beginPath();
    context.arc(Math.floor(x), Math.floor(y), radius, 0, 2 * Math.PI);
    context.fill();
}