//TODO make public constant in a players class
const runningSpeed = 2;

export default function ({ keysDown, wasPressed, wasReleased, keysDown: actionKeysActive }, { store, clientId }) {
    if (wasPressed('run')) {
        actionKeysActive.add('run')
    }
    if (wasReleased('run')) {
        actionKeysActive.delete('run')
    }

    let player = store.state.playersById[clientId];
    if (!player) return;

    let movingX = player.moving ? player.moving.x : 0;
    let movingY = player.moving ? player.moving.y : 0;
    if (wasPressed('right')) {
        movingX = 1
    }
    if (wasPressed('down')) {
        movingY = 1
    }
    if (wasPressed('left')) {
        movingX = -1
    }
    if (wasPressed('up')) {
        movingY = -1
    }

    let runningChanged = false;
    if (wasPressed('run')) {
        runningChanged = true;
        actionKeysActive.add('run')
    }
    if (wasReleased('run')) {
        runningChanged = true;
        actionKeysActive.delete('run')
    }

    if (wasPressed('changeDimension')) {
        store.commit('CHANGE_DIMENSION', {
            id: clientId
        });
    }
    if (wasPressed('interact')) {
        if (Math.abs(player.position.x - 346) < 64 &&
            Math.abs(player.position.y - 6551) < 64) {
            alert('Bless the RNG!');
            if (Math.random() < 0.8) {
                player.hasLaser = true;
            }
            else {
                player.hasTripleBow = true;
            }
        }
    }

    if (wasPressed('teleport')) {
        store.commit('START_PLAYER_TELEPORTING', {
            id: clientId
        });
    }
    if (wasReleased('teleport')) {
        store.commit('FINISH_PLAYER_TELEPORTING', {
            id: clientId
        });
    }

    if (movingX !== player.moving.x || movingY !== player.moving.y || (runningChanged && (player.moving.x > 0 || player.moving.y > 0))) {
        let running = actionKeysActive.has('run');

        let c = Math.sqrt(movingX * movingX + movingY * movingY);
        movingX /= c;
        movingY /= c;
        store.commit('SET_PLAYER_MOVING', {
            id: clientId,
            moving: {
                x: running ? movingX * runningSpeed : movingX,
                y: running ? movingY * runningSpeed : movingY
            }
        })
    }

    const maxAxesForPressedKeys = (actionKeys, direction) => {
        let [up, down, left, right] = actionKeys;
        let x = direction.x;
        let y = direction.y;
        if (wasPressed(right)) {
            x = 1
        }
        if (wasPressed(down)) {
            y = 1
        }
        if (wasPressed(left)) {
            x = -1
        }
        if (wasPressed(up)) {
            y = -1
        }
        return { x, y }
    };

    let playerShootingDirection = player.shooting.direction;
    let newShootingVector = maxAxesForPressedKeys(['shootUp', 'shootDown', 'shootLeft', 'shootRight'], player.shooting.direction);
    if (playerShootingDirection.x !== newShootingVector.x || playerShootingDirection.y !== newShootingVector.y) {
        store.commit('SET_PLAYER_SHOOTING_DIRECTION', {
            id: clientId,
            direction: newShootingVector
        })
    }

    const resetAxesForReleasedKeys = (actionKeys, vector) => {
        let x = vector.x;
        let y = vector.y;
        if (wasReleased(actionKeys[0]) && vector.y < 0) {
            y = 0
        }
        if (wasReleased(actionKeys[1]) && vector.y > 0) {
            y = 0
        }
        if (wasReleased(actionKeys[2]) && vector.x < 0) {
            x = 0
        }
        if (wasReleased(actionKeys[3]) && vector.x > 0) {
            x = 0
        }
        return { x, y }
    };

    let playerMoving = player.moving;
    let updatedMovingVector = resetAxesForReleasedKeys(['up', 'down', 'left', 'right'], playerMoving);
    if (updatedMovingVector.x !== playerMoving.x || updatedMovingVector.y !== playerMoving.y) {
        store.commit('SET_PLAYER_MOVING', {
            id: clientId,
            moving: updatedMovingVector
        });
        store.commit('SET_PLAYER_POSITION', {
            id: clientId,
            x: player.position.x,
            y: player.position.y
        })
    }

    let shootingDirection = player.shooting.direction;
    let updatedVector = resetAxesForReleasedKeys(['shootUp', 'shootDown', 'shootLeft', 'shootRight'], shootingDirection);
    if (updatedVector.x !== shootingDirection.x || updatedVector.y !== shootingDirection.y) {
        store.commit('SET_PLAYER_SHOOTING_DIRECTION', {
            id: clientId,
            direction: updatedVector
        })
    }

}