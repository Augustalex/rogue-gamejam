const enemyTimeToShoot = 5;

export default function (storeDependencies, enemy) {

    let lastTime = 0;

    return (delta) => {
        lastTime += delta;
        if (lastTime > enemyTimeToShoot) {
            storeDependencies.localStore.dispatch('fireEnemyWeapon', {
                id: enemy.id,
                isEnemy: true,
            });
            lastTime -= enemyTimeToShoot
        }
    }
}