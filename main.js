import Blood from './Blood.js';
// import io from './node_modules/socket.io-client/dist/socket.io.slim.js';
import Store from './Store.js';
import StoreProxy from './StoreProxy.js';
import inputController from './inputController.js';
import inputLogic from './inputLogic.js';
import fysik from './fysik.js';
import draw from './draw.js';
import AudioEngine from './audio/AudioEngine.js';
import utils from './utils.js';
import Enemy from './enemy/Enemy.js';
import EnemyFactory from './enemy/EnemyFactory.js';

const { genId, rand255, rHue, rColor } = utils;

export default function () {
    let socket = io.connect(`${window.location.hostname}:3032`);
    console.log(window.location.hostname);
    //let socket = io.connect('http://192.168.1.106:3032');
    const color = rColor();
    const clientId = `${rand255()}${rand255()}`;
    console.log('clientId: ', clientId);

    let audioEngine = AudioEngine();
    audioEngine.play('background-0');

    const createOwnPlayer = () => {
        return {
            id: clientId,
            position: {
                x: rand255(),
                y: rand255(),
            },
            color,
            speed: 20,
            shooting: {
                direction: {
                    x: 0,
                    y: 0
                }
            },
            moving: {
                x: 0,
                y: 0
            },
            health: 100
        }
    };

    let localStore = Store({
        store: {
            state: {
                entitiesById: {},
                localPlayerDead: true,
                playersById: {},
                bullets: {},
                bulletsByShooterId: {},
                removeRequests: [],
                blood: null
            },
            getters: {},
            mutations: {
                SET_PLAYER_POS({ state }, { id, x, y }) { //TODO deprecate
                    if (!state.playersById[id]) {
                        throw new Error('Player for id does not exist!');
                    }
                    state.playersById[id].position.x = x;
                    state.playersById[id].position.y = y
                },
                SET_PLAYER_POSITION({ state }, { id, x, y }) {
                    if (state.playersById[id]) {
                        state.playersById[id].position.x = x;
                        state.playersById[id].position.y = y
                    }
                },
                SET_PLAYER_MOVING({ state }, { id, moving }) {
                    state.playersById[id].moving = moving
                },
                SET_PLAYER_SHOOTING({ state }, { id, shooting }) {
                    state.playersById[id].shooting = shooting
                },
                SET_PLAYER_SHOOTING_DIRECTION({ state }, { id, direction }) {
                    state.playersById[id].shooting.direction = direction
                },
                MERGE_PLAYER_SHOOTING({ state }, { id, shooting }) {
                    Object.assign(state.playersById[id].shooting, shooting)
                },
                SET_PLAYER_HEALTH({ state }, { id, health }) {
                    if (state.playersById[id]) {
                        state.playersById[id].health = health
                    }
                },
                ADD_PLAYER({ state }, player) {
                    state.playersById[player.id] = player;
                    if (player.id === clientId) {
                        console.log('ADDING LOCAL PLAYER');
                        state.localPlayerDead = false
                    }
                },
                ADD_ENTITY({ state }, entity) {
                    state.entitiesById[entity.id] = entity;
                },
                ADD_BULLET({ state }, bullet) {
                    state.bullets[bullet.id] = bullet
                },
                ADD_ENTITY_BULLET({ state }, { id, bullet }) {
                    state.bulletsByShooterId[id][bullet.id] = bullet;
                },
                REMOVE_ENTITY_BULLET({ state }, { bulletId, shooterId }) {
                    if (state.bulletsByShooterId[shooterId] && state.bulletsByShooterId[shooterId][bulletId]) {
                        state.removeRequests.push({
                            firstKey: 'bulletsByShooterId',
                            secondKey: shooterId,
                            thirdKey: bulletId
                        })
                    }
                },
                SET_BULLET_POS({ state }, { id, x, y, height }) {
                    state.bullets[id].x = x;
                    state.bullets[id].y = y;
                    state.bullets[id].height = height
                },
                START_PLAYER_TELEPORTING({ state }, { id }) {
                    let player = state.playersById[id];
                    player.teleporting = true;
                    player.teleportCursor = {
                        x: 0,
                        y: 0
                    };
                },
                FINISH_PLAYER_TELEPORTING({ state, commit }, { id }) {
                    let player = state.playersById[id];
                    player.teleporting = false;
                    player.position.x = player.position.x + player.teleportCursor.x;
                    player.position.y = player.position.y + player.teleportCursor.y;
                },
                SET_ENTITY_BULLET_POS({ state }, { id, bulletId, x, y, height }) {
                    state.bulletsByShooterId[id][bulletId].x = x;
                    state.bulletsByShooterId[id][bulletId].y = y;
                    state.bulletsByShooterId[id][bulletId].height = height
                },
                REMOVE_PLAYER({ state }, playerId) {
                    if (state.playersById[playerId]) {
                        state.removeRequests.push({
                            firstKey: 'playersById',
                            secondKey: playerId,
                            callback: () => {
                                if (playerId === clientId) {
                                    console.log('REMOVED LOCAL PLAYER');
                                    state.localPlayerDead = true
                                }
                            }
                        })
                    }
                },
                REMOVE_BULLET({ state }, bulletId) {
                    if (state.bullets[bulletId]) {
                        state.removeRequests.push({
                            firstKey: 'bullets',
                            secondKey: bulletId
                        })
                    }
                },
                SET_BLOOD_ENGINE({ state }, blood) {
                    state.blood = blood
                },
                ADD_BLOOD({ state }, { x, y }) {
                    if (state.blood) {
                        state.blood.add(x, y)
                    }
                },
                ADD_BURN({ state }, { x, y }) {
                    if (state.blood) {
                        state.blood.addBurn(x, y, 3)
                    }
                }
            },
            actions: {
                addBloodTrail({ state }, playerId) {
                    let { x, y } = state.playersById[playerId];
                    state.blood.addTrail(x, y);

                    const bleed = (time, size) => {
                        setTimeout(() => {
                            if (!state.playersById[playerId]) return;
                            let { x, y } = state.playersById[playerId];
                            state.blood.addTrail(x, y, size)
                        }, time)
                    };
                    bleed(20, 1.5);
                    bleed(30, 1.4);
                    bleed(40, 1.3);
                    bleed(50, 1.2);
                    bleed(90, 1);
                    bleed(120, 1);
                    bleed(200, 1);
                    bleed(300, 1);
                    bleed(320, 1);
                    bleed(340, 1.8);
                    bleed(360, 1.5);
                    bleed(380, 1.5);
                    bleed(400, 1);
                    bleed(420, 1);
                    bleed(440, 1);
                    bleed(460, 1);
                    bleed(480, 1);
                    bleed(500, 1)
                },
                killPlayer({ state, commit }, playerId) {
                    if (state.playersById[playerId]) {
                        let { x, y } = state.playersById[playerId];
                        commit('REMOVE_PLAYER', playerId);
                        commit('ADD_BLOOD', { x, y })
                    }
                },
                playerShot({ state, dispatch, commit }, { id: playerId, damage }) {
                    if (state.playersById[playerId]) {
                        let { x, y, health } = state.playersById[playerId];
                        let newHealth = health - damage;
                        if (newHealth <= 0) {
                            dispatch('killPlayer', playerId)
                        }
                        else {
                            commit('ADD_BLOOD', { x, y });
                            commit('SET_PLAYER_HEALTH', { id: playerId, health: newHealth })
                        }
                    }
                },
                firePlayerWeapon({ state, commit }, { id, direction }) {
                    let player = state.playersById[id];
                    let bulletId = genId();
                    let directionRad = Math.atan2(direction.y, direction.x);
                    let newDirectionRad = directionRad + (Math.random() * .05) - .025;
                    let newDirectionX = Math.cos(newDirectionRad);
                    let newDirectionY = Math.sin(newDirectionRad);
                    let shootDir = Math.atan2(player.shooting.direction.y, player.shooting.direction.x);
                    let gunPosX = player.position.x + Math.cos(shootDir + Math.PI / 4) * 9;
                    let gunPosY = player.position.y + Math.sin(shootDir + Math.PI / 4) * 9;

                    let bullet = {
                        x: gunPosX,
                        y: gunPosY,
                        id: bulletId,
                        shooterId: id,
                        direction: {
                            x: newDirectionX,
                            y: newDirectionY
                        },
                        height: 8 + Math.random(),
                        isEnemy: false
                    };
                    commit('ADD_BULLET', bullet);

                    setTimeout(() => {
                        if (!state.bullets[bulletId]) return;
                        let { x, y } = state.bullets[bulletId];
                        commit('REMOVE_BULLET', bulletId);
                        commit('ADD_BURN', { x, y });
                    }, Math.round(Math.random() * 200) + 1000);
                },
                fireEnemyWeapon({ state, commit }) {
                    let shadowDimension = Math.random() > 0.5;
                    let shots = 25 + Math.round(Math.random() * 2);
                    let randomPlayerId = Object.keys(state.playersById)[0];
                    let player = state.playersById[randomPlayerId];
                    let targetDir = Math.atan2(player.position.y - 400, player.position.x - 400);
                    for (let directionRad = targetDir - Math.PI / 40; directionRad < targetDir + Math.PI / 40; directionRad += (Math.PI / 10) / shots) {

                        let bulletId = genId();
                        let newDirectionX = Math.cos(directionRad);
                        let newDirectionY = Math.sin(directionRad);

                        let bullet = {
                            x: 400 + Math.random() * 1,
                            y: 400 + Math.random() * 1,
                            id: bulletId,
                            shooterId: null,
                            direction: {
                                x: newDirectionX * (0.5 + Math.random() * 0.2),
                                y: newDirectionY * (0.5 + Math.random() * 0.2)
                            },
                            isEnemy: true,
                            height: 22,
                            shadowDimension: shadowDimension
                        };
                        commit('ADD_BULLET', bullet);

                        setTimeout(() => {
                            if (!state.bullets[bulletId]) return;
                            let { x, y } = state.bullets[bulletId];
                            commit('REMOVE_BULLET', bulletId);
                            commit('ADD_BURN', { x, y })
                        }, Math.round(Math.random() * 200) + 5000);
                    }
                },
                fireWeapon({ state, commit }, { entity, isEnemy }) {
                    let id = entity.id;
                    let shadowDimension = Math.random() > 0.5;
                    let shots = 4 + Math.round(Math.random() * 2);
                    let randomPlayerId = Object.keys(state.playersById)[0];
                    let player = state.playersById[randomPlayerId];
                    let targetDir = Math.atan2(player.position.y - entity.y, player.position.x - entity.x);
                    for (let directionRad = targetDir - Math.PI /40; directionRad < targetDir + Math.PI /40; directionRad += (Math.PI /10) / shots) {

                        let bulletId = genId();
                        let newDirectionX = Math.cos(directionRad);
                        let newDirectionY = Math.sin(directionRad);

                        let bullet = {
                            x: entity.x + Math.random() * 1,
                            y: entity.y + Math.random() * 1,
                            id: bulletId,
                            shooterId: null,
                            direction: {
                                x: newDirectionX * (0.5 + Math.random() * 0.1),
                                y: newDirectionY * (0.5 + Math.random() * 0.1)
                            },
                            isEnemy: true,
                            height: 22,
                            shadowDimension: shadowDimension
                        };
                        commit('ADD_BULLET', bullet);
                        //commit('ADD_ENTITY_BULLET', {id, bullet});  LAGGY

                        setTimeout(() => {
                            if (!state.bullets[bulletId]) return;
                            let { x, y } = state.bullets[bulletId];
                            commit('REMOVE_BULLET', bulletId);
                            //commit('REMOVE_ENTITY_BULLET', bulletId); LAGGY
                            commit('ADD_BURN', { x, y })
                        }, Math.round(Math.random() * 200) + 5000);
                    }
                },
                createEnemy({ state, commit }, enemyState) {
                    let enemy = Enemy({ store, localStore }, enemyState);
                    commit('ADD_ENTITY', enemy);
                    enemy.loadSprite();
                }
            }
        }
    });

    let store = StoreProxy({
        socket,
        store: localStore
    });
    store.commit('ADD_PLAYER', createOwnPlayer());
    let enemyFactory = EnemyFactory({ localStore, store });
    enemyFactory.createEnemy();

    let canvas = document.createElement('canvas');
    canvas.width = window.innerWidth - 32;
    canvas.height = window.innerHeight - 32;
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;
    document.body.appendChild(canvas);
    let context = canvas.getContext('2d');
    localStore.commit('SET_BLOOD_ENGINE', Blood(canvas, context));
    let inputHookDependencies = { store, clientId };
    inputController.addHook(inputLogic);

    let respawning = false;
    let lastTime = 0;
    const loop = time => {
        let delta = ((time - lastTime) * .01) || .16;
        lastTime = time;
        inputController.updateInput(inputHookDependencies);
        // input(store, clientId);
        fysik(localStore, store, delta);
        draw(canvas, context, store, localStore, clientId);

        gc();
        if (!respawning && store.state.localPlayerDead) {
            respawning = true;
            console.log('RESPAWN IN 3 SECONDS');
            setTimeout(() => {
                let player = createOwnPlayer();
                store.commit('ADD_PLAYER', player);
                respawning = false
            }, 3000);
        }

        requestAnimationFrame(loop)
    };
    loop();

    function gc() {
        for (let { firstKey, secondKey, thirdKey, callback } of store.state.removeRequests) {
            if (thirdKey) {
                delete store.state[firstKey][secondKey][thirdKey]
            }
            else if (secondKey) {
                delete store.state[firstKey][secondKey]
            }
            else {
                delete store.state[firstKey]
            }
            if (callback) {
                callback()
            }
        }
        store.state.removeRequests = []
    }
}