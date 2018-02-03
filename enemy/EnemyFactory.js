import utils from "../utils.js";

const { genId, rand255, rHue, rColor } = utils;

export default function (storeDeps, { controllerId }) {
    let { localStore, store } = storeDeps;

    return {
        createEnemy,
        createBoss
    };

    function createEnemy() {
        let enemyState = newEnemyBaseState();
        store.dispatch('createEnemy', enemyState);
    }

    function createBoss() {
        let enemyState = newEnemyBaseState({ controllerId });
        store.dispatch('createBoss', enemyState);
    }
}

function newEnemyBaseState({ controllerId }) {
    return {
        clone: false,
        id: genId(),
        color: rColor(),
        position: {
            x: Math.round(1200 * Math.random()),
            y: Math.round(1200 * Math.random())
        },
        moving: {
            x: 0,
            y: 0
        },
        speed: 100,
        controllerId
    };
}