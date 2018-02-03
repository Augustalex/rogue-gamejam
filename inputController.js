//TODO make public constant in a players class
const runningSpeed = 2;

import gamepadController from './gamepadController.js';

const rightStickRight = 'rs:x:1';
const rightStickLeft = 'rs:x:0';
const rightStickDown = 'rs:y:1';
const rightStickUp = 'rs:y:0';
const leftStickRight = 'ls:x:1';
const leftStickLeft = 'ls:x:0';
const leftStickDown = 'ls:y:1';
const leftStickUp = 'ls:y:0';
const buttonA = 'button:a';

const keymap = {
    up: ['w', leftStickUp],
    down: ['s', leftStickDown],
    left: ['a', leftStickLeft],
    right: ['d', leftStickRight],
    shootUp: ['arrowup', rightStickUp],
    shootDown: ['arrowdown', rightStickDown],
    shootLeft: ['arrowleft', rightStickLeft],
    shootRight: ['arrowright', rightStickRight],
    run: ['shift', buttonA],
    changeDimension: ['q'],
    teleport: [' '],
};

let actionKeysActive = new Set();
let previousKeysDown = new Set();
let newKeysDown = new Set();
const wasReleased = (actionKey) => keymap[actionKey].some(key => previousKeysDown.has(key) && !newKeysDown.has(key));
const wasPressed = (actionKey) => keymap[actionKey].some(key => !previousKeysDown.has(key) && newKeysDown.has(key));
const anyPressed = (actionKeys) => actionKeys.some(key => wasPressed(key));

let keyboardState = new Set();

const stickThreshold = .2;

let inputDependencies = {
    wasReleased,
    wasPressed,
    keysDown: actionKeysActive
};

let hooks = [];
export default {
    addHook: hook => hooks.push(hook),
    updateInput
};

function updateInput(hookDependencies) {
    previousKeysDown = newKeysDown;
    newKeysDown = new Set();
    readKeyboardState();
    readGamepadState();
    for (let hook of hooks) {
        hook(inputDependencies, hookDependencies)
    }
}

function readKeyboardState() {
    for (let key of [...keyboardState]) {
        newKeysDown.add(key)
    }
}

function readGamepadState() {
    let gamepadOne = gamepadController.getGamepads()[0];
    if (!gamepadOne) return;

    for (let i = 0; i < gamepadOne.buttons.length; i++) {
        if (gamepadOne.buttons[i].pressed) {
            newKeysDown.add(' ')
        }
    }

    let rightStick = {
        x: gamepadOne.axes[2],
        y: gamepadOne.axes[3],
    };
    let leftStick = {
        x: gamepadOne.axes[0],
        y: gamepadOne.axes[1],
    };

    const stick = (stick, up, down, left, right) => {
        if (Math.abs(stick.x) > stickThreshold) {
            newKeysDown.delete(stick.x > 0 ? left : right);
            newKeysDown.add(stick.x > 0 ? right : left)
        }
        else {
            newKeysDown.delete(left);
            newKeysDown.delete(right)
        }

        if (Math.abs(stick.y) > stickThreshold) {
            newKeysDown.delete(stick.y > 0 ? up : down);
            newKeysDown.add(stick.y > 0 ? down : up)
        }
        else {
            newKeysDown.delete(up);
            newKeysDown.delete(down)
        }
    };
    stick(rightStick, rightStickUp, rightStickDown, rightStickLeft, rightStickRight);
    stick(leftStick, leftStickUp, leftStickDown, leftStickLeft, leftStickRight)
}

window.addEventListener('keydown', e => {
    //TODO Keydown seems to be called repeatably when pressing down a key, why?
    // if (keyboardState.has(e.key.toLowerCase())) return
    keyboardState.add(e.key.toLowerCase())
});

window.addEventListener('keyup', e => {
    keyboardState.delete(e.key.toLowerCase())
});