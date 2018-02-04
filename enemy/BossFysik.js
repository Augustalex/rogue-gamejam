import Sprites from '../sprites.js';

const enemyTimeToShoot = 1;
const circleBulletTimeToShoot = 2;

export default function (storeDependencies, entityState) {
    let { localStore, store } = storeDependencies;
    let lastTime = 0;

    let inPosition = false;

    let timeSinceLastAction = 0;
    let lastPosition = {
        x: entityState.position.x,
        y: entityState.position.y
    };
    let targetPlayerDir;

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
        let movingX = Math.cos(directionRad);
        let movingY = Math.sin(directionRad);

        let c = Math.sqrt(movingX * movingX + movingY * movingY);
        movingX /= c;
        movingY /= c;

        let data = {
            id: entityState.id,
            x: movingX,
            y: movingY
        };
        store.commit('SET_ENTITY_MOVING', data);
    };

    return (delta) => {
        if (!inPosition) {
            move();
            inPosition = true;
        }

        let playerInRange = false;
        for (let playerId in store.state.playersById) {
            if (!store.state.playersById.hasOwnProperty(playerId)) continue;

            let player = store.state.playersById[playerId];
            let dist = Math.sqrt(Math.pow(player.position.x - entityState.position.x, 2) + Math.pow(player.position.y - entityState.position.y, 2));
            if (dist < 1500) {
                localStore.dispatch('bossFightSound');
                if (dist < 800) {
                    playerInRange = true;
                }
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
                    let targetPlayerPosition = store.state.playersById[randomPlayerId].position;
                    targetPlayerDir = Math.atan2((targetPlayerPosition.y + 32) - entityState.position.y, targetPlayerPosition.x - entityState.position.x);
                }
            }
        }

        if (!entityState.isMoving) {
            lastTime += delta;
            let timeToShoot = enemyTimeToShoot;
            if (entityState.health < entityState.maxHealth * 0.70) {
                timeToShoot = circleBulletTimeToShoot;
            }
            if (lastTime > timeToShoot) {
                if (store.state.presentDimension) {
                    if (entityState.health < entityState.maxHealth * 0.30) {
                        localStore.dispatch('fireMinigunInCircle', {
                            id: entityState.id,
                            isEnemy: true,
                            x: entityState.position.x - Sprites.boss.width * 2 / 2,
                            y: entityState.position.y - 80
                        });
                    }
                    else if (entityState.health < entityState.maxHealth * 0.70) {
                        localStore.dispatch('fireBulletCircle', {
                            id: entityState.id,
                            isEnemy: true,
                            x: entityState.position.x - 8 / 2,
                            y: entityState.position.y - 80
                        });
                    }
                    else {
                        localStore.dispatch('fireSmallBlast', {
                            id: entityState.id,
                            isEnemy: true,
                            x: entityState.position.x - 8,
                            y: entityState.position.y - 80
                        });
                    }

                }
                else {
                    if (entityState.health < entityState.maxHealth * 0.70) {
                        localStore.dispatch('fireLaser', {
                            id: entityState.id,
                            x: entityState.position.x,
                            y: entityState.position.y - 80,
                            targetDir: targetPlayerDir + Math.PI / 8 + Math.random() * Math.PI / 4,
                        });
                        localStore.dispatch('fireLaser', {
                            id: entityState.id,
                            x: entityState.position.x,
                            y: entityState.position.y - 80,
                            targetDir: targetPlayerDir - (Math.PI / 8 + Math.random() * Math.PI / 4),
                        });
                    }
                    localStore.dispatch('fireLaser', {
                        id: entityState.id,
                        x: entityState.position.x,
                        y: entityState.position.y - 80,
                        targetDir: targetPlayerDir
                    });
                }
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
    }
}