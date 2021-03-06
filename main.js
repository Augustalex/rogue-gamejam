import Blood from './Blood.js';
import World from './world.js';
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
import Boss from './enemy/Boss.js';
import Friend from './enemy/Friend.js';
import PastFriend from './enemy/PastFriend.js';
import EnemyFactory from './enemy/EnemyFactory.js';
import ItemFactory from './entities/ItemFactory.js';
import ItemFactoryDispatcher from './entities/ItemFactoryDispatcher.js';
import WorldMaker from "./mapLoader/WorldMaker.js";
import worldData from "./mapLoader/world1Data.js";

const { genId, rand255, rHue, rColor } = utils;

let clientId = localStorage.getItem('clientId');
if (!clientId) {
    clientId = `${rand255()}${rand255()}`;
    localStorage.setItem('clientId', clientId);
}
console.log('clientId: ', clientId);

let beamHue = 329;
let ballHue = 340;
let hueDir = 1;

export default async function () {
    let socket = io();
    console.log(window.location.hostname);

    socket.emit('login', { clientId });
    socket.on('setup', async () => {
        console.log('got setup command from server');
        const setup = await start({ socket, clientId, alreadyCreated: false });
        console.log('start done');
        setup();
    });
    socket.on('start', ({ alreadyCreated }) => {
        console.log('got start command from server', { alreadyCreated });
        start({ socket, clientId, alreadyCreated });
    });
}

async function start({ socket, clientId, alreadyCreated }) {
    const color = rColor();

    let worldMaker = WorldMaker(worldData);
    console.log('PARSING WORLD');
    let worldLayer = await worldMaker.makeLayer();
    let audioEngine = AudioEngine();
    let itemFactory = ItemFactory({});

    const createOwnPlayer = () => {
        return {
            id: clientId,
            position: {
                x: World.playerSpawn.x,
                y: World.playerSpawn.y,
            },
            abilities: {
                sprint: true
            },
            color,
            speed: 220,
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
            hasTripleBow: false,
            hasLaser: false,
            health: 100,
            sprite: null
        }
    };

    let localStore = Store({
        store: {
            state: {
                //TODO should be called "worldLayers"
                worldLayer,
                clientId,
                //TODO should be called "entityById"
                entitiesById: {},
                localPlayerDead: true,
                playersById: {},
                bullets: [],
                bulletsByShooterId: {},
                removeRequests: [],
                blood: null,
                presentDimension: true
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
                SET_PLAYER_INTERACTING({ state }, { id, interacting }) {
                    state.playersById[id].interacting = interacting;
                },
                ADD_PLAYER_ABILITY({ state }, { id, ability }) {
                    state.playersById[id].abilities[ability] = true;
                },
                SET_ENTITY_HEALTH({ state }, { id, health }) {
                    if (state.entitiesById[id]) {
                        state.entitiesById[id].health = health;
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
                        });
                    }
                },
                REMOVE_ENTITY({ state }, id) {
                    if (state.entitiesById[id]) {
                        state.removeRequests.push({
                            firstKey: 'entitiesById',
                            secondKey: id
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
                CHANGE_DIMENSION({ state }) {
                    state.presentDimension = !state.presentDimension;
                },
                FINISH_PLAYER_TELEPORTING({ state, dispatch }, { id }) {
                    let player = state.playersById[id];
                    player.teleporting = false;
                    player.position.x = player.position.x + player.teleportCursor.x;
                    player.position.y = player.position.y + player.teleportCursor.y;
                    dispatch('playPlayerTeleport');
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
                },
                SET_ENTITY_MOVING({ state }, { id, x, y }) {
                    state.entitiesById[id].setMoving(x, y);
                },
                SET_ENTITY_POS({ state }, { id, x, y }) {
                    state.entitiesById[id].setPosition(x, y);
                }
            },
            actions: {
                createItem({ commit }, itemState) {
                    let item = itemFactory.createItem({ localStore, store }, itemState);
                    commit('ADD_ENTITY', item);
                },
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
                killEntity({ state, commit }, entityId) {
                    if (state.entitiesById[entityId]) {
                        let { x, y } = state.entitiesById[entityId];
                        commit('REMOVE_ENTITY', entityId);
                        commit('ADD_BLOOD', { x, y })
                    }
                },
                playerFall({ state, commit, dispatch }, { id, x, y }) {
                    commit('SET_PLAYER_POS', { id, x, y });
                    audioEngine.play('playerFall2');
                    setTimeout(() => {
                        audioEngine.play('playerFall3', { volume: .2 });
                        audioEngine.play('playerFall');
                    }, 200);
                    dispatch('killPlayer', id);
                },
                playerMoveSound() {
                    let sounds = [
                        // 'playerStep1',
                        'playerStep2',
                        // 'playerStep3',
                        'playerStep4',
                        // 'playerStep5',
                        'playerStep6'
                    ];
                    let sound = sounds[Math.round(Math.random() * (sounds.length - 1))];
                    audioEngine.play(sound, { volume: .02 });
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
                            dispatch('playPlayerImpact')
                        }
                    }
                },
                entityShot({ state, dispatch, commit }, { id, damage }) {
                    if (state.entitiesById[id]) {
                        let { x, y } = state.entitiesById[id];
                        let health = state.entitiesById[id].getState().health;
                        let newHealth = health - damage;
                        if (newHealth <= 0) {
                            dispatch('killEntity', id)
                        }
                        else {
                            commit('ADD_BLOOD', { x, y });
                            state.entitiesById[id].setEntityHealth(newHealth);
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
                    let gunPosY = player.position.y - 64 + Math.sin(shootDir + Math.PI / 4) * 9;

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

                    audioEngine.play('arrow');

                    setTimeout(() => {
                        if (!state.bullets[bulletId]) return;
                        let { x, y } = state.bullets[bulletId];
                        commit('REMOVE_BULLET', bulletId);
                        commit('ADD_BURN', { x, y });
                    }, Math.round(Math.random() * 200) + 2000);
                },
                playerSlash({ state, commit }, { id, direction }) {
                    let player = state.playersById[id];
                    let bulletId = genId();
                    let directionRad = Math.atan2(direction.y, direction.x);
                    let newDirectionRad = directionRad + (Math.random() * .05) - .025;
                    let newDirectionX = Math.cos(newDirectionRad);
                    let newDirectionY = Math.sin(newDirectionRad);
                    let shootDir = Math.atan2(player.shooting.direction.y, player.shooting.direction.x);
                    let gunPosX = player.position.x + Math.cos(shootDir + Math.PI / 4) * 9;
                    let gunPosY = player.position.y - 64 + Math.sin(shootDir + Math.PI / 4) * 9;

                    let bullet = {
                        x: gunPosX,
                        y: gunPosY,
                        id: bulletId,
                        shooterId: id,
                        direction: {
                            x: newDirectionX,
                            y: newDirectionY
                        },
                        height: 8,
                        isEnemy: false,
                        damage: 200,
                        type: 'sword'
                    };
                    commit('ADD_BULLET', bullet);

                    audioEngine.play('playerTeleport');

                    setTimeout(() => {
                        if (!state.bullets[bulletId]) return;
                        let { x, y } = state.bullets[bulletId];
                        commit('REMOVE_BULLET', bulletId);
                        commit('ADD_BURN', { x, y });
                    }, 25);
                },
                entityFireArrow({ state, commit, dispatch }, { id: entityId, x, y, damage }) {
                    let id = entityId;
                    let entity = state.entitiesById[entityId];
                    let randomPlayerId = Object.keys(state.playersById)[0];
                    let player = state.playersById[randomPlayerId];
                    let entityPos = entity.getPosition();
                    let targetDir = Math.atan2(player.position.y - entityPos.y, player.position.x - entityPos.x);
                    let directionRad = targetDir - Math.PI / 40;
                    let bulletId = genId();
                    let newDirectionX = Math.cos(directionRad);
                    let newDirectionY = Math.sin(directionRad);

                    let bullet = {
                        x: x,
                        y: y,
                        damage,
                        id: bulletId,
                        shooterId: null,
                        direction: {
                            x: newDirectionX * (0.5 + Math.random() * 0.1),
                            y: newDirectionY * (0.5 + Math.random() * 0.1)
                        },
                        isEnemy: false,
                        height: 8 + Math.random()
                    };
                    commit('ADD_ENTITY_BULLET', { id, bullet });
                    audioEngine.play('arrow');

                    setTimeout(() => {
                        if (!state.bulletsByShooterId[id][bulletId]) return;
                        let { x, y } = state.bulletsByShooterId[id][bulletId];
                        commit('REMOVE_ENTITY_BULLET', { shooterId: id, bulletId });
                        commit('ADD_BURN', { x, y })
                    }, Math.round(Math.random() * 200) + 2000);
                },
                fireSmallBlast({ state, commit }, { id: entityId, x, y }) {
                    let id = entityId;
                    let entity = state.entitiesById[entityId];
                    let shots = 15 + Math.round(Math.random() * 2);
                    let randomPlayerId = Object.keys(state.playersById)[0];
                    let player = state.playersById[randomPlayerId];
                    let entityPos = entity.getPosition();
                    let targetDir = Math.atan2(player.position.y - entityPos.y, player.position.x - entityPos.x);
                    for (let directionRad = targetDir - Math.PI / 40; directionRad < targetDir + Math.PI / 40; directionRad += (Math.PI / 10) / shots) {
                        let bulletId = genId();
                        let newDirectionX = Math.cos(directionRad);
                        let newDirectionY = Math.sin(directionRad);

                        let bullet = {
                            x: x,
                            y: y,
                            id: bulletId,
                            shooterId: null,
                            direction: {
                                x: newDirectionX * (0.5 + Math.random() * 0.1),
                                y: newDirectionY * (0.5 + Math.random() * 0.1)
                            },
                            isEnemy: true,
                            height: 22,
                            presentDimension: true,
                            hue: ballHue + Math.random() * 40
                        };
                        commit('ADD_ENTITY_BULLET', { id, bullet });

                        setTimeout(() => {
                            if (!state.bulletsByShooterId[id][bulletId]) return;
                            let { x, y } = state.bulletsByShooterId[id][bulletId];
                            commit('REMOVE_ENTITY_BULLET', { shooterId: id, bulletId });
                            commit('ADD_BURN', { x, y })
                        }, Math.round(Math.random() * 200) + 2000);
                    }
                },
                fireBulletCircle({ state, commit }, { id: entityId, x, y }) {
                    let id = entityId;
                    let shots = 400;
                    let hue = ballHue;
                    for (let directionRad = 0; directionRad < Math.PI * 2; directionRad += (Math.PI * 2) / shots) {
                        let bulletId = genId();
                        let newDirectionX = Math.cos(directionRad);
                        let newDirectionY = Math.sin(directionRad);

                        let bullet = {
                            x: x,
                            y: y,
                            id: bulletId,
                            shooterId: null,
                            direction: {
                                x: newDirectionX * (0.5 + Math.random() * 0.1) * 0.7,
                                y: newDirectionY * (0.5 + Math.random() * 0.1) * 0.7
                            },
                            isEnemy: true,
                            height: 22,
                            presentDimension: true,
                            hue: hue
                        };
                        commit('ADD_ENTITY_BULLET', { id, bullet });

                        setTimeout(() => {
                            if (!state.bulletsByShooterId[id][bulletId]) return;
                            let { x, y } = state.bulletsByShooterId[id][bulletId];
                            commit('REMOVE_ENTITY_BULLET', { shooterId: id, bulletId });
                            commit('ADD_BURN', { x, y })
                        }, Math.round(Math.random() * 200) + 2000);
                        hue += 40 / shots;
                    }
                },
                fireMinigunInCircle({ state, commit }, { id: entityId, x, y }) {
                    let id = entityId;
                    let shots = 100;
                    let directionRad = Math.PI * 2 * Math.random();
                    let startDir = directionRad;
                    let hue = ballHue;
                    ballHue += 20;
                    if (ballHue > 360) {
                        ballHue = 300;
                    }
                    let shootFun = () => {
                        let bulletId = genId();
                        let newDirectionX = Math.cos(directionRad);
                        let newDirectionY = Math.sin(directionRad);
                        let bullet = {
                            x: x,
                            y: y,
                            id: bulletId,
                            shooterId: null,
                            direction: {
                                x: newDirectionX * (0.5 + Math.random() * 0.1) * 1.3,
                                y: newDirectionY * (0.5 + Math.random() * 0.1) * 1.2
                            },
                            isEnemy: true,
                            height: 22,
                            presentDimension: true,
                            hue: hue
                        };
                        commit('ADD_ENTITY_BULLET', { id, bullet });
                        setTimeout(() => {
                            if (!state.bulletsByShooterId[id][bulletId]) return;
                            let { x, y } = state.bulletsByShooterId[id][bulletId];
                            commit('REMOVE_ENTITY_BULLET', { shooterId: id, bulletId });
                            commit('ADD_BURN', { x, y })
                        }, Math.round(Math.random() * 200) + 2000);
                        directionRad += Math.PI / shots;
                        if (directionRad < startDir + Math.PI * 2) {
                            setTimeout(() => {
                                shootFun();
                            }, 50);
                        }
                    };
                    shootFun();
                },
                createEnemy({ state, commit }, enemyState) {
                    let enemy = Enemy({ store, localStore }, enemyState);
                    commit('ADD_ENTITY', enemy);
                    enemy.loadSprite();
                },
                createBoss({ state, commit }, enemyState) {
                    let enemy = Boss({ store, localStore }, enemyState);
                    commit('ADD_ENTITY', enemy);
                    enemy.loadSprite();
                },
                createFriend({ state, commit }, enemyState) {
                    let enemy = Friend({ store, localStore }, enemyState);
                    commit('ADD_ENTITY', enemy);
                    enemy.loadSprite();
                },
                createPastFriend({ commit }, enemyState) {
                    let enemy = PastFriend({ store, localStore }, enemyState);
                    commit('ADD_ENTITY', enemy);
                    enemy.loadSprite();
                },
                fireLaser({ state, commit }, {
                    id: entityId,
                    x,
                    y,
                    targetDir,
                }) {
                    let id = entityId;
                    for (let speed = 0.8; speed < 1.8; speed += 0.025) {
                        beamHue += hueDir * 3;
                        if (beamHue > 340) {
                            beamHue = 340;
                            hueDir = -hueDir
                        }
                        if (beamHue < 200) {
                            beamHue = 200;
                            hueDir = -hueDir
                        }
                        let bulletId = genId();
                        let directionX = Math.cos(targetDir);
                        let directionY = Math.sin(targetDir);

                        audioEngine.play('bossLaser', { type: 'ambient', volume: .08 });
                        let bullet = {
                            x: x,
                            y: y,
                            id: bulletId,
                            shooterId: null,
                            direction: {
                                x: directionX * speed / 5,
                                y: directionY * speed / 5
                            },
                            isEnemy: true,
                            isLaser: true,
                            height: 22,
                            hue: beamHue,
                            presentDimension: false
                        };
                        commit('ADD_ENTITY_BULLET', { id, bullet });

                        setTimeout(() => {
                            if (!state.bulletsByShooterId[id][bulletId]) return;
                            let { x, y } = state.bulletsByShooterId[id][bulletId];
                            commit('REMOVE_ENTITY_BULLET', { shooterId: id, bulletId });
                            commit('ADD_BURN', { x, y })
                        }, Math.round(Math.random() * 200) + 2000);
                    }
                },
                firePlayerLaser({ state, commit }, {
                    id: entityId,
                    x,
                    y,
                    targetDir,
                }) {
                    let id = entityId;
                    for (let speed = 1; speed < 1.8; speed += 0.05) {
                        beamHue += hueDir * 0.5;
                        if (beamHue > 360) {
                            beamHue = 0;
                            hueDir = -hueDir
                        }
                        if (beamHue < 0) {
                            beamHue = 0;
                            hueDir = -hueDir
                        }
                        let bulletId = genId();
                        let directionX = Math.cos(targetDir);
                        let directionY = Math.sin(targetDir);

                        let bullet = {
                            x: x,
                            y: y,
                            id: bulletId,
                            shooterId: null,
                            direction: {
                                x: directionX * speed,
                                y: directionY * speed
                            },
                            isEnemy: true,
                            isLaser: true,
                            height: 22,
                            hue: beamHue,
                            presentDimension: false
                        };
                        commit('ADD_BULLET', bullet);

                        setTimeout(() => {
                            if (!state.bullets[bulletId]) return;
                            let { x, y } = state.bullets[bulletId];
                            commit('REMOVE_BULLET', bulletId);
                            commit('ADD_BURN', { x, y })
                        }, Math.round(Math.random() * 200) + 2000);
                    }
                },
                async bossFightSound() {
                    await audioEngine.play('bossFight-0', { type: 'background' });
                },
                async updateCurrentAudioZone({ state }) {
                    let localPlayer = state.playersById[state.clientId];
                    await audioEngine.changeSongIfNewZone(state.worldLayer, {
                        x: localPlayer.position.x,
                        y: localPlayer.position.y,
                        presentDimension: state.presentDimension
                    })
                },
                async playBossStepSound() {
                    let bossSteps = [
                        'bossStep-1',
                        'bossStep-2',
                        'bossStep-3'
                    ];
                    let step = bossSteps[Math.round(Math.random() * (bossSteps.length - 1))];
                    await audioEngine.play(step, { type: 'ambient', volume: .2 });
                },
                async playBossScream() {
                    await audioEngine.play('bossScream', { type: 'ambient' });
                },
                async playBossImpact() {
                    await audioEngine.play('genericImpact', { type: 'ambient', volume: .1 });
                },
                async playPlayerTeleport({ dispatch }) {
                    await audioEngine.play('playerTeleport', { type: 'ambient', volume: .03 });
                    dispatch('playerMoveSound')
                },
                async playPlayerImpact() {
                    await audioEngine.play('genericImpact', { type: 'ambient', volume: .1 });
                    await audioEngine.play('playerFall3', { type: 'ambient', volume: .05 });
                },
                placeEnemiesFromWorldLayer() {
                    // console.log('placed enemies')
                    // worldLayer.enemyFactories.forEach(f => {
                    //     f({ localStore, store, controllerId: clientId })
                    // });
                    // console.log('entity count: ' + Object.keys(store.state.entitiesById).length)
                }
            }
        }
    });

    let store = StoreProxy({
        socket,
        store: localStore
    });

    if (!alreadyCreated) {
        store.commit('ADD_PLAYER', createOwnPlayer());
    }

    startLoop();
    socket.emit('reload');

    return () => {
        console.log('CREATING ENEMIES');
        let itemFactoryDispatcher = ItemFactoryDispatcher({ localStore, store }, { controllerId: clientId })
        let enemyFactory = EnemyFactory({ localStore, store }, { controllerId: clientId });
        enemyFactory.createBoss({
            x: World.boss.x,
            y: World.boss.y,
        });
        worldLayer.enemyFactories.forEach(f => {
            f({ localStore, store, controllerId: clientId })
        });
        itemFactoryDispatcher.createItem({
            controllerId: clientId,
            x: World.playerSpawn.x + 430,
            y: World.playerSpawn.y - 200,
            ability: 'teleport'
        });
        itemFactoryDispatcher.createItem({
            controllerId: clientId,
            x: World.playerSpawn.x + 230,
            y: World.playerSpawn.y,
            ability: 'crossbow'
        })
        // itemFactoryDispatcher.createItem({
        //     controllerId: clientId,
        //     x: World.playerSpawn.x + 500,
        //     y: World.playerSpawn.y,
        //     ability: 'time'
        // })
        // enemyFactory.createFriend({
        //     x: 2300,
        //     y: 8000,
        // });
        // enemyFactory.createFriend({
        //     x: 2600,
        //     y: 8300,
        // });
        // enemyFactory.createFriend({
        //     x: 2000,
        //     y: 8600,
        // });
    };

    function startLoop() {
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
        const loop = async time => {
            let clientPlayer = store.state.playersById[store.state.clientId];
            if (clientPlayer) {
                let delta = ((time - lastTime) * .001) || .16;
                lastTime = time;
                inputController.updateInput(inputHookDependencies);

                fysik(localStore, store, delta);
                await draw({ canvas, context }, { store, localStore, clientId });

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
            }

            requestAnimationFrame(loop)
        };
        loop();
    }

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
