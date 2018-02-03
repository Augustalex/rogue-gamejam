const enemyTimeToShoot = 1;

export default function (storeDependencies, entityState) {
    let { localStore, store } = storeDependencies;
    let lastTime = 0;

    let inPosition = false;

    let lastWalkedTime = 0;
    let lastPosition = {
        x: entityState.position.x,
        y: entityState.position.y
    };

    let step = 0;
    let pattern = [
        { x: 200, y: 200 },
        { x: 200, y: 800 },
        { x: 800, y: 800 },
        { x: 800, y: 200 }
    ];
    const getNextTargetLocation = () => {
        if (step === pattern.length) {
            step = 0;
        }
        return pattern[step++];
    };

    const move = () => {
        lastWalkedTime = 0;

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
            //store.commit('SET_ENTITY_POS', { id: entityState.id, ...getNextTargetLocation() });
            move();
            inPosition = true;
        }

        lastWalkedTime += delta;
        if (entityState.controllerId === localStore.state.clientId) {
            if (lastWalkedTime > 30) {
                move();
            }
        }

        lastTime += delta;
        if (lastTime > enemyTimeToShoot) {
            localStore.dispatch('fireEnemyWeapon', {
                id: entityState.id,
                isEnemy: true,
                x: entityState.position.x,
                y: entityState.position.y - 80
            });
            lastTime -= enemyTimeToShoot
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