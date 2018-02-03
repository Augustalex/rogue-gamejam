import options from '../options.js'
import utils from '../utils.js';
import BossFysik from './BossFysik.js';

const { genId, rand255, rHue, rColor } = utils;

export default function (storeDependencies, state) {
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
        render(context) {
            for (let bulletId of Object.keys(store.state.bulletsByShooterId[id])) {
                drawBullet(context, store.state.bulletsByShooterId[id][bulletId], color)
            }

            if (towerImage.complete) {
                context.drawImage(towerImage, state.position.x - 34 / 2, state.position.y - 34 / 2, 34, 34)
            }
        },
        fysik(delta) {
            bossFysik(delta)
        }
    }
}

function drawBullet(context, bullet, color) {
    if (bullet.isEnemy) {
        if (options.useShadows) {
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
}