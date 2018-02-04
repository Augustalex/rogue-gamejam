import Sprites from './sprites.js';

const constants = {
    bulletSpeed: 1000,
    enemyBulletSpeed: 500,
    timeToShoot: .5,
    enemyTimeToShoot: 30,
    playerSize: 10,
    fallingBullets: true,
    bulletGravity: 1,
};

let playerObjectsById = {};
setInterval(() => {
    playerObjectsById = {}
}, Math.round(Math.random() * 5000) + 5000);

export default function fysik(localStore, store, delta) {
    for (let playerId of Object.keys(store.state.playersById)) {
        let player = playerObjectsById[playerId];
        if (!playerObjectsById[playerId]) {
            player = Player({ localStore, store, playerId });
            playerObjectsById[playerId] = Player({ localStore, store, playerId })
        }
        player.fysik(delta)
    }

    for (let entityId in store.state.entitiesById) {
        if (store.state.entitiesById.hasOwnProperty(entityId)) {
            store.state.entitiesById[entityId].fysik(delta);
        }
    }

    bulletFysik({ localStore, store }, delta);

    for (let bulletId of Object.keys(store.state.bullets)) {
        let bullet = store.state.bullets[bulletId];
        let newPos = {
            x: bullet.x + bullet.direction.x * constants.bulletSpeed * delta,
            y: bullet.y + bullet.direction.y * constants.bulletSpeed * delta
        };
        if (constants.fallingBullets) {
            newPos.y += constants.bulletGravity * delta;
            newPos.height = bullet.height - constants.bulletGravity * delta;
            if (newPos.height <= 0) {
                localStore.commit('REMOVE_BULLET', bulletId);
                localStore.commit('ADD_BURN', newPos);
                continue
            }
        }

        for (let entityId in store.state.entitiesById) {
            if (!store.state.entitiesById.hasOwnProperty(entityId)) return;
            if (entityId === bullet.shooterId) continue;
            let boss = store.state.entitiesById[entityId];
            let x = boss.getPosition().x;
            let y = boss.getPosition().y;

            let bulletLength = 8;
            let startPos = {
                x: bullet.x - bullet.direction.x * bulletLength * 2,
                y: bullet.y - bullet.direction.y * bulletLength * 2
            };
            let endPos = {
                x: newPos.x + bullet.direction.x * bulletLength * 2,
                y: newPos.y + bullet.direction.y * bulletLength * 2
            };
            let b = getBossBoundingBox();
            let leftLine = [x + b.left, y + b.top, x + b.left, y + b.bottom];
            let rightLine = [x + b.right, y + b.top, x + b.right, y + b.bottom];
            let topLine = [x + b.left, y + b.top, x + b.right, y + b.top];
            let bottomLine = [x + b.left, y + b.bottom, x + b.right, y + b.bottom];

            let boxLines = [
                leftLine,
                rightLine,
                topLine,
                bottomLine
            ];

            let intersects = boxLines.some(line => {
                return intersect(line[0], line[1], line[2], line[3], startPos.x, startPos.y, endPos.x, endPos.y)
            });
            if (intersects) {
                let damage = store.state.presentDimension ? 80 : 160;
                localStore.commit('REMOVE_BULLET', bulletId);
                store.dispatch('entityShot', {
                    id: entityId,
                    damage: damage
                })
            }
        }

        localStore.commit('SET_BULLET_POS', Object.assign({ id: bulletId }, newPos))
    }
}

function Player({ localStore, store, playerId }) {
    let state = store.state.playersById[playerId];

    let lastPosition = { x: state.position.x, y: state.position.y };
    let currentPosition = { x: state.position.x, y: state.position.y };

    const timeBetweenSounds = .2;
    let timeToNextSound = 0;

    function shoot(player) {
        localStore.dispatch('firePlayerWeapon', {
            id: playerId,
            direction: player.shooting.direction,
        });
        if (state.hasTripleBow) {
            let bulletDir = Math.atan2(player.shooting.direction.y, player.shooting.direction.x);
            localStore.dispatch('firePlayerWeapon', {
                id: playerId,
                direction: {
                    x: Math.cos(bulletDir - Math.PI / 64),
                    y: Math.sin(bulletDir - Math.PI / 64),
                },
            });
            localStore.dispatch('firePlayerWeapon', {
                id: playerId,
                direction: {
                    x: Math.cos(bulletDir + Math.PI / 64),
                    y: Math.sin(bulletDir + Math.PI / 64),
                },
            });
            localStore.dispatch('firePlayerWeapon', {
                id: playerId,
                direction: {
                    x: Math.cos(bulletDir + Math.PI / 128),
                    y: Math.sin(bulletDir + Math.PI / 128),
                },
            });
        }
    }

    return {
        lastPosition,
        currentPosition,
        id: playerId,
        width: 12,
        height: 12,
        teleporting: false,
        teleportCursor: {
            x: 0,
            y: 0
        },
        fysik(delta) {
            let player = store.state.playersById[playerId];
            let aiming = player.shooting.direction.x || player.shooting.direction.y;
            let shooting = aiming && !player.teleporting;
            let x = player.position.x;
            let y = player.position.y;
            lastPosition.x = x;
            lastPosition.y = y;

            let speed = player.speed;
            if (shooting) {
                speed /= 2;
            }

            let moving = false;
            if (player.moving && player.moving.x) {
                moving = true;
                x += speed * delta * player.moving.x
            }
            if (player.moving && player.moving.y) {
                moving = true;
                y += speed * delta * player.moving.y
            }

            if (moving) {
                if (timeToNextSound <= 0) {
                    store.dispatch('playerMoveSound', { id: playerId, x, y });
                    let speedMultiplier = (player.moving.x > 1 || player.moving.y > 1) ? .6 : 1;
                    timeToNextSound = speedMultiplier + Math.random() * .01;
                }
                else {
                    timeToNextSound -= delta;
                }
            }
            else {
                timeToNextSound = 0;
            }

            let tileWidth = store.state.worldLayer.tileWidth;
            let layerPosX = Math.floor(x / tileWidth);
            let tileHeight = store.state.worldLayer.tileHeight;
            let layerPosY = Math.floor(y / tileHeight);
            let layerRealX = layerPosX * tileWidth;
            let layerRealY = layerPosY * tileHeight;
            let layer = store.state.worldLayer.layer;
            if (layer[layerPosY][layerPosX].steep) {
                if (x > layerRealX && x < layerRealX + tileWidth
                    && y > layerRealY && y < layerRealY + tileHeight) {
                    console.log('player fell to their death');
                    store.dispatch('playerFall', { id: playerId, x, y });
                }
            }

            localStore.dispatch('updateCurrentAudioZone');

            currentPosition.x = x;
            currentPosition.y = y;
            localStore.commit('SET_PLAYER_POS', { id: playerId, x, y });

            // BLOOD TRAILS
            // if (Math.random() < .2 * delta) {
            //     store.dispatch('addBloodTrail', playerId)
            // }

            if (player.teleporting) {
                let dist = player.teleportCursor.x * player.teleportCursor.x + player.teleportCursor.y * player.teleportCursor.y;
                dist = Math.min(Math.max(Math.sqrt(dist) / 10, 1), 2);
                player.teleportCursor.x += player.shooting.direction.x * 10 / dist;
                player.teleportCursor.y += player.shooting.direction.y * 10 / dist;
            }
            else if (shooting) {
                if (!player.shooting.timeToShoot) {
                    player.shooting.timeToShoot = constants.timeToShoot;
                    shoot(player);
                }
                let newTimeToShoot = player.shooting.timeToShoot - delta;
                if (newTimeToShoot <= 0) {
                    let overFlow = -newTimeToShoot;
                    newTimeToShoot = constants.timeToShoot - overFlow;
                    shoot(player);
                }
                localStore.commit('MERGE_PLAYER_SHOOTING', {
                    id: playerId,
                    shooting: {
                        timeToShoot: newTimeToShoot
                    }
                });
            }
            else {
                let newTimeToShoot = player.shooting.timeToShoot - delta;
                if (newTimeToShoot <= 0) {
                    newTimeToShoot = 0;
                }
                localStore.commit('MERGE_PLAYER_SHOOTING', {
                    id: playerId,
                    shooting: {
                        timeToShoot: newTimeToShoot
                    }
                });
            }

            if (player.teleporting) {
                if (Math.abs(player.teleportCursor.x) > 10) {
                    player.teleportCursor.x /= 1.01;
                }
                if (Math.abs(player.teleportCursor.y) > 10) {
                    player.teleportCursor.y /= 1.01;
                }
            }
        }
    }
}

const sameSign = (a, b) => (a * b) > 0;

function intersect(x1, y1, x2, y2, x3, y3, x4, y4) {

    var a1, a2, b1, b2, c1, c2;
    var r1, r2, r3, r4;
    var denom, offset, num;

    // Compute a1, b1, c1, where line joining points 1 and 2
    // is "a1 x + b1 y + c1 = 0".
    a1 = y2 - y1;
    b1 = x1 - x2;
    c1 = (x2 * y1) - (x1 * y2);

    // Compute r3 and r4.
    r3 = ((a1 * x3) + (b1 * y3) + c1);
    r4 = ((a1 * x4) + (b1 * y4) + c1);

    // Check signs of r3 and r4. If both point 3 and point 4 lie on
    // same side of line 1, the line segments do not intersect.
    if ((r3 !== 0) && (r4 !== 0) && sameSign(r3, r4)) {
        return 0; //return that they do not intersect
    }

    // Compute a2, b2, c2
    a2 = y4 - y3;
    b2 = x3 - x4;
    c2 = (x4 * y3) - (x3 * y4);

    // Compute r1 and r2
    r1 = (a2 * x1) + (b2 * y1) + c2;
    r2 = (a2 * x2) + (b2 * y2) + c2;

    // Check signs of r1 and r2. If both point 1 and point 2 lie
    // on same side of second line segment, the line segments do
    // not intersect.
    if ((r1 !== 0) && (r2 !== 0) && (sameSign(r1, r2))) {
        return 0; //return that they do not intersect
    }
    //Line segments intersect: compute intersection point.
    denom = (a1 * b2) - (a2 * b1);

    if (denom === 0) {
        return 1; //collinear
    }

    // lines_intersect
    return 1; //lines intersect, return true
}

let spriteScale = 2;

//TODO: move to player.js
function getPlayerBoundingBox() {
    return {
        left: -Sprites.character.width * spriteScale / 2,
        right: Sprites.character.width * spriteScale / 2,
        top: -Sprites.character.height * spriteScale,
        bottom: 0,
    }
}

//TODO: move to boss.js
function getBossBoundingBox() {
    return {
        left: -Sprites.boss.width * spriteScale / 2,
        right: Sprites.boss.width * spriteScale / 2,
        top: -Sprites.boss.height * spriteScale,
        bottom: 0
    }
}

function bulletFysik({ store, localStore }, delta) {
    // var t0 = performance.now();
    for (let shooterId in store.state.bulletsByShooterId) {
        if (!store.state.bulletsByShooterId.hasOwnProperty(shooterId)) continue;
        if (!store.state.bulletsByShooterId[shooterId]) continue;

        for (let bulletId in store.state.bulletsByShooterId[shooterId]) {
            if (!store.state.bulletsByShooterId[shooterId].hasOwnProperty(bulletId)) continue;
            let bullet = store.state.bulletsByShooterId[shooterId][bulletId];
            if (bullet.isLaser) {
                if (bullet.direction.x < 3) {
                    bullet.direction.x *= 1.1;
                    bullet.direction.y *= 1.1;
                }
            }
            let newPos = {
                x: bullet.x + bullet.direction.x * constants.enemyBulletSpeed * delta,
                y: bullet.y + bullet.direction.y * constants.enemyBulletSpeed * delta
            };
            if (constants.fallingBullets) {
                newPos.y += constants.bulletGravity * delta;
                newPos.height = bullet.height - constants.bulletGravity * delta;
                if (newPos.height <= 0) {
                    localStore.commit('REMOVE_ENTITY_BULLET', { shooterId, bulletId });
                    localStore.commit('ADD_BURN', newPos);
                    return
                }
            }

            let collidableObjects = Object.keys(playerObjectsById).map(k => playerObjectsById[k]);
            for (let collidable of collidableObjects) {
                if (collidable.id === bullet.shooterId) continue;
                if (bullet.presentDimension !== store.state.presentDimension) continue;

                let x = collidable.currentPosition.x;
                let y = collidable.currentPosition.y;
                let b = getPlayerBoundingBox();
                let leftLine = [x + b.left, y + b.top, x + b.left, y + b.bottom];
                let rightLine = [x + b.right, y + b.top, x + b.right, y + b.bottom];
                let topLine = [x + b.left, y + b.top, x + b.right, y + b.top];
                let bottomLine = [x + b.left, y + b.bottom, x + b.right, y + b.bottom];

                let boxLines = [
                    leftLine,
                    rightLine,
                    topLine,
                    bottomLine
                ];

                let bulletSize = 8;
                let startPos = {
                    x: bullet.x - bullet.direction.x * bulletSize * 2,
                    y: bullet.y - bullet.direction.y * bulletSize * 2
                };
                let endPos = {
                    x: newPos.x + bullet.direction.x * bulletSize * 2,
                    y: newPos.y + bullet.direction.y * bulletSize * 2
                };
                let bulletDir = Math.atan2(bullet.direction.y, bullet.direction.x);
                let bulletTopDir = bulletDir - Math.PI / 2;
                let bulletBottomDir = bulletDir + Math.PI / 2;
                let bulletTopLine = [
                    startPos.x + Math.cos(bulletTopDir) * bulletSize, startPos.y + Math.sin(bulletTopDir) * bulletSize,
                    endPos.x + Math.cos(bulletTopDir) * bulletSize, endPos.y + Math.sin(bulletTopDir) * bulletSize
                ];
                let bulletBottomLine = [
                    startPos.x + Math.cos(bulletBottomDir) * bulletSize, startPos.y + Math.sin(bulletBottomDir) * bulletSize,
                    endPos.x + Math.cos(bulletBottomDir) * bulletSize, endPos.y + Math.sin(bulletBottomDir) * bulletSize
                ];
                let intersects = boxLines.some(line => {
                    return intersect(line[0], line[1], line[2], line[3], bulletTopLine[0], bulletTopLine[1], bulletTopLine[2], bulletTopLine[3]) ||
                        intersect(line[0], line[1], line[2], line[3], bulletBottomLine[0], bulletBottomLine[1], bulletBottomLine[2], bulletBottomLine[3])
                });
                if (intersects) {
                    if (bullet.isLaser) {
                        store.dispatch('playerShot', {
                            id: collidable.id,
                            damage: 0.2
                        })
                    }
                    else {
                        localStore.commit('REMOVE_ENTITY_BULLET', { shooterId, bulletId });
                        store.dispatch('playerShot', {
                            id: collidable.id,
                            damage: 5
                        })
                    }
                }
            }

            localStore.commit('SET_ENTITY_BULLET_POS', { id: shooterId, bulletId, x: newPos.x, y: newPos.y });
        }
    }
    // var t1 = performance.now();
    // console.log("Call to ENTITY BULLETS took " + (t1 - t0) + " milliseconds.")
}