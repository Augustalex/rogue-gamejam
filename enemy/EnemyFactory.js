import utils from "../utils.js";
import Boss from "./Boss.js";

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

    function createBoss({ x, y }) {
        let enemyState = Boss.createState({ controllerId, x, y });
        store.dispatch('createBoss', enemyState);
    }
}

function newEnemyBaseState({ controllerId, x, y }) {
    let state = {
        clone: false,
        id: genId(),
        color: rColor(),
        position: {
            x: x,
            y: y
        },
        moving: {
            x: 0,
            y: 0
        },
        speed: 100,
        controllerId
    };
    return state;
}