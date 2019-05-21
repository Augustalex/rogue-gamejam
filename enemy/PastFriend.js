import utils from '../utils.js';
import Sprites from '../sprites.js';

const { genId, rand255, rHue, rColor } = utils;
const enemyTimeToShoot = 1;

function PastFriend(storeDependencies, state) {
    let entityState = state;
    let { store, localStore } = storeDependencies;

    state.speed = 20;

    let {
        id,
        color,
        controllerId
    } = state;

    localStore.state.bulletsByShooterId[id] = {};

    let lastTime = 0;

    let inPosition = false;

    let timeSinceLastAction = 0;
    let lastPosition = {
        x: entityState.position.x,
        y: entityState.position.y
    };
    let targetPlayerPosition;

    let step = 0;
    let pattern = [
        { x: 1650, y: 2000 },
        { x: 1450, y: 1000 },
        { x: 1800, y: 1500 },
        { x: 800, y: 200 }
    ];
    const getNextTargetLocation = () => {
        if (step === pattern.length) {
            step = 0;
        }
        return pattern[step++];
    };

    const move = () => {
        let target = getNextTargetLocation();
        let entityPos = entityState.position;
        let targetDir = Math.atan2(target.y - entityPos.y, target.x - entityPos.x);
        let directionRad = targetDir - Math.PI / 40;
        let movingX = Math.cos(directionRad) * Math.random();
        let movingY = Math.sin(directionRad) * Math.random();
        let c = Math.sqrt(movingX * movingX + movingY * movingY);
        movingX /= c;
        movingY /= c;

        let data = {
            id: entityState.id,
            x: -movingX,
            y: -movingY
        };
        store.commit('SET_ENTITY_MOVING', data);
    };

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
        },
        setEntityHealth(health) {
            state.health = health;
        },
        render({ context, canvas, camera }) {
            if (store.state.presentDimension) return;

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
                context.drawImage(Sprites.pastFriend, Math.floor(x - Sprites.pastFriend.width * scale / 2), Math.floor(y - Sprites.pastFriend.height * scale), Sprites.pastFriend.width * scale, Sprites.pastFriend.height * scale);
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
            if (!inPosition) {
                move();
                inPosition = true;
            }

            let playerInRange = false;
            for (let playerId in store.state.playersById) {
                if (!store.state.playersById.hasOwnProperty(playerId)) continue;

                let player = store.state.playersById[playerId];
                let dist = Math.sqrt(Math.pow(player.position.x - entityState.position.x, 2) + Math.pow(player.position.y - entityState.position.y, 2));
                if (dist < 800) {
                    playerInRange = true;
                }
            }
            entityState.playerInRange = playerInRange;

            if (!playerInRange) return;

            timeSinceLastAction += delta;
            if (entityState.controllerId === localStore.state.clientId) {
                if (timeSinceLastAction > 2) {
                    if (!entityState.isMoving) {
                        entityState.isMoving = true;
                        move();
                        timeSinceLastAction = 0;
                    }
                    else {
                        entityState.moving.x = 0;
                        entityState.moving.y = 0;
                        entityState.isMoving = false;
                        timeSinceLastAction = 0;
                        let randomPlayerId = Object.keys(store.state.playersById)[0];
                        targetPlayerPosition = store.state.playersById[randomPlayerId].position;
                    }
                }
            }

            if (!entityState.isMoving) {
                lastTime += delta;
                if (lastTime > enemyTimeToShoot && !store.state.presentDimension) {
                    localStore.dispatch('entityFireArrow', {
                        id: entityState.id,
                        x: entityState.position.x,
                        y: entityState.position.y - 80,
                        damage: 25
                    });
                    lastTime = 0;
                    move();
                    entityState.isMoving = true;
                }
            }

            let x = entityState.position.x;
            let y = entityState.position.y;
            lastPosition.x = x;
            lastPosition.y = y;

            if (entityState.moving && entityState.moving.x) {
                x += entityState.speed * delta * entityState.moving.x
            }
            if (entityState.moving && entityState.moving.y) {
                y += entityState.speed * delta * entityState.moving.y
            }

            localStore.commit('SET_ENTITY_POS', { id: entityState.id, x, y });
        },
        getState() {
            return {
                health: state.health
            }
        }
    };
}

PastFriend.createState = function ({ controllerId, x, y }) {
    return {
        clone: false,
        id: genId(),
        color: rColor(),
        maxHealth: 150,
        health: 3000,
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
export default PastFriend;

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