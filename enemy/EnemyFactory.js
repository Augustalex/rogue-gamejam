import utils from "../utils.js";

const { genId, rand255, rHue, rColor } = utils;

export default function (storeDeps) {
    let { localStore, store } = storeDeps;

    return {
        createEnemy
    };

    function createEnemy() {
        let enemyState = newEnemyBaseState();
        store.dispatch('createEnemy', enemyState);
    }
}

function newEnemyBaseState() {
    return {
        clone: false,
        id: genId(),
        color: rColor(),
        x: Math.round(1800 * Math.random()),
        y: Math.round(1800 * Math.random())
    };
}