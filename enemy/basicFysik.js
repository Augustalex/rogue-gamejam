const enemyTimeToShoot = 5;

export default function (storeDependencies, enemy) {

    let lastTime = 0;

    return (delta) => {
        lastTime += delta;
        if (lastTime > enemyTimeToShoot) {
            storeDependencies.localStore.dispatch('fireWeapon', {
                entity: enemy,
                isEnemy: true,
            });
            lastTime -= enemyTimeToShoot
        }
    }
}