import utils from '../utils.js';

const { genId, rand255, rHue, rColor } = utils;
const HITBOX_INFLATION = 3
const DEBUG_SHOW_HITBOX_INFLATION = false

function Item(storeDependencies, state) {
    let { store, localStore } = storeDependencies;

    let dead = false;

    state.speed = 20;

    let {
        id,
        color,
        controllerId
    } = state;

    let towerImage = new Image();
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
            if (state.position.x > camera.x + camera.w || state.position.x < camera.x
                || state.position.y > camera.y + camera.h || state.position.y < camera.y) {
                return
            }
            context.fillStyle = state.color;
            context.fillRect(state.position.x, state.position.y, state.dimensions.width, state.dimensions.height);

            if (DEBUG_SHOW_HITBOX_INFLATION) {
                fillBox(inflateBox(getItemBoundingBox(state), HITBOX_INFLATION), context)
            }
        },
        fysik(delta) {
            if (dead) return;

            let clientId = store.state.clientId
            let player = store.state.playersById[clientId]
            if (player && player.interacting) {
                let position = player.position;
                if (isInside(position, inflateBox(getItemBoundingBox(state), HITBOX_INFLATION))) {
                    if (state.ability === 'time') {
                        store.commit('CHANGE_DIMENSION');
                    }
                    store.commit('ADD_PLAYER_ABILITY', { id: clientId, ability: state.ability });
                    store.commit('REMOVE_ENTITY', id);
                    store.dispatch('placeEnemiesFromWorldLayer');
                    dead = true;
                }
            }
        },
        getState() {
            return {
                health: state.health
            }
        }
    };
}

function inflateBox(box, factor) {
    let newHeight = box.height * factor;
    let newWidth = box.width * factor;
    return {
        x: box.x - (newWidth - box.width) * .5,
        y: box.y - (newHeight - box.height) * .5,
        width: newWidth,
        height: newHeight
    }
}

function getItemBoundingBox(itemState) {
    return {
        x: itemState.position.x,
        y: itemState.position.y,
        width: itemState.dimensions.width,
        height: itemState.dimensions.height
    }
}

function isInside(point, box2) {
    return box2.x <= point.x && point.x <= box2.x + box2.width &&
        box2.y <= point.y && point.y <= box2.y + box2.height;
}

function fillBox(box, context) {
    context.fillStyle = 'rgba(255,255,0,0.3)'
    context.fillRect(box.x, box.y, box.width, box.height);
}

Item.createState = function ({ controllerId, x, y, ability = 'teleport' } = {}) {
    let abilityToColor = {
        teleport: 'red',
        time: 'blue',
        crossbow: 'maroon'
    };
    return {
        clone: false,
        id: genId(),
        color: abilityToColor[ability],
        maxHealth: 15000,
        health: 15000,
        ability,
        position: {
            x: x,
            y: y
        },
        dimensions: {
            width: 25,
            height: 25
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
export default Item;