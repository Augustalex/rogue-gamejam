const constants = {
    bulletSpeed: 60,
    timeToShoot: 9,
    enemyTimeToShoot: 50,
    playerSize: 10,
    fallingBullets: true,
    bulletGravity: 0.001,
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

        let collidableObjects = Object.keys(playerObjectsById).map(k => playerObjectsById[k]);
        for (let collidable of collidableObjects) {
            if (collidable.id === bullet.shooterId) continue;

            let playerPosition = collidable.currentPosition;

            let playerWidth = collidable.width;
            let playerHeight = collidable.height;
            if (bullet.isEnemy) {
                // hack to collide with bigger bullets
                playerWidth = playerWidth * 2;
                playerHeight = playerHeight * 2
            }
            let playerTopLeft = {
                x: playerPosition.x - (playerWidth / 2),
                y: playerPosition.y - (playerHeight / 2)
            };
            let playerLines = [
                [playerTopLeft.x, playerTopLeft.y, playerTopLeft.x + playerWidth, playerTopLeft.y],
                [playerTopLeft.x + playerWidth, playerTopLeft.y, playerTopLeft.x + playerWidth, playerTopLeft.y + playerHeight],
                [playerTopLeft.x + playerWidth, playerTopLeft.y + playerHeight, playerTopLeft.x, playerTopLeft.y + playerHeight],
                [playerTopLeft.x, playerTopLeft.y + playerHeight, playerTopLeft.x, playerTopLeft.y],
            ];

            let intersects = playerLines.some(line => {
                return intersect(line[0], line[1], line[2], line[3], bullet.x, bullet.y, newPos.x, newPos.y)
            });
            if (intersects) {
                localStore.commit('REMOVE_BULLET', bulletId);
                store.dispatch('playerShot', {
                    id: collidable.id,
                    damage: 5
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
            if(shooting){
                speed /= 2;
            }

            if (player.moving && player.moving.x) {
                x += speed * delta * player.moving.x
            }
            if (player.moving && player.moving.y) {
                y += speed * delta * player.moving.y
            }

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
                    player.shooting.timeToShoot = constants.timeToShoot
                }
                let newTimeToShoot = player.shooting.timeToShoot - delta;
                if (newTimeToShoot <= 0) {
                    let overFlow = -newTimeToShoot;
                    newTimeToShoot = constants.timeToShoot - overFlow;
                    localStore.dispatch('firePlayerWeapon', {
                        id: playerId,
                        direction: player.shooting.direction,
                    });
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

function bulletFysik({ store, localStore }, delta) {
    for (let shooterId of Object.keys(store.state.bulletsByShooterId)) {
        if (!store.state.bulletsByShooterId[shooterId]) continue;

        for (let bulletId of Object.keys(store.state.bulletsByShooterId[shooterId])) {
            let bullet = store.state.bulletsByShooterId[shooterId][bulletId];

            let newPos = {
                x: bullet.x + bullet.direction.x * constants.bulletSpeed * delta,
                y: bullet.y + bullet.direction.y * constants.bulletSpeed * delta
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

                let playerPosition = collidable.currentPosition;

                let playerWidth = collidable.width;
                let playerHeight = collidable.height;
                if (bullet.isEnemy) {
                    // hack to collide with bigger bullets
                    playerWidth = playerWidth * 2;
                    playerHeight = playerHeight * 2
                }
                let playerTopLeft = {
                    x: playerPosition.x - (playerWidth / 2),
                    y: playerPosition.y - (playerHeight / 2)
                };
                let playerLines = [
                    [playerTopLeft.x, playerTopLeft.y, playerTopLeft.x + playerWidth, playerTopLeft.y],
                    [playerTopLeft.x + playerWidth, playerTopLeft.y, playerTopLeft.x + playerWidth, playerTopLeft.y + playerHeight],
                    [playerTopLeft.x + playerWidth, playerTopLeft.y + playerHeight, playerTopLeft.x, playerTopLeft.y + playerHeight],
                    [playerTopLeft.x, playerTopLeft.y + playerHeight, playerTopLeft.x, playerTopLeft.y],
                ];

                let intersects = playerLines.some(line => {
                    return intersect(line[0], line[1], line[2], line[3], bullet.x, bullet.y, newPos.x, newPos.y)
                });
                if (intersects) {
                    localStore.commit('REMOVE_ENTITY_BULLET', { shooterId, bulletId });
                    store.dispatch('playerShot', {
                        id: collidable.id,
                        damage: 5
                    })
                }
            }

            localStore.commit('SET_ENTITY_BULLET_POS', Object.assign({ id: shooterId, bulletId }, newPos));
        }
    }
}