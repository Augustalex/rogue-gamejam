export default {
    character: null,
    chest: null,
    boss: null,
    bossPast: [],
    async loadResources() {
        // this.character = await loadImageAsync('./sprites/character.png');
        this.characterRunLeft = await loadCharacterFrames('./sprites/character/characterRunLeft.png', 32, 12);
        this.characterRunRight = await loadCharacterFrames('./sprites/character/characterRunRight.png', 32, 12);
        this.characterRunDown = await loadCharacterFrames('./sprites/character/characterRunDown.png', 32, 12);
        this.characterRunUp = await loadCharacterFrames('./sprites/character/characterRunUp.png', 32, 12);
        this.characterIdleUp = await loadCharacterFrames('./sprites/character/characterIdleUp.png', 32, 1);
        this.characterIdleDown = await loadCharacterFrames('./sprites/character/characterIdleDown.png', 32, 1);
        this.characterIdleLeft = await loadCharacterFrames('./sprites/character/characterIdleLeft.png', 32, 1);
        this.characterIdleRight = await loadCharacterFrames('./sprites/character/characterIdleRight.png', 32, 1);
        this.friend = await loadImageAsync('./sprites/friend.png');
        this.boss = await loadImageAsync('./sprites/boss.png');
        this.bossPast = await loadBossFrames('./sprites/boss_Past.png');
        this.bossPresent = await loadBossFrames('./sprites/boss_Present.png');
        this.chest = await loadImageAsync('./sprites/chest.png');
    }
}

async function loadBossFrames(path) {
    let bossSheet = await loadImageAsync(path);
    let frames = [];
    for (let i = 0; i < 24; i++) {
        let x = i * 48;
        let canvas = document.createElement('canvas');
        canvas.width = 48;
        canvas.height = 122;
        let context = canvas.getContext('2d');
        context.imageSmoothingEnabled = false;
        context.drawImage(bossSheet, x, 0, 48, 122, 0, 0, 48, 122);
        frames.push(canvas);
    }
    return frames;
}

//native dimensions 32x32px, 12 frames

async function loadCharacterFrames(path, size, nFrames) {
    let sheet = await loadImageAsync(path);
    let frames = [];
    for (let i = 0; i < nFrames; i++) {
        let x = i * size;
        let canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        let context = canvas.getContext('2d');
        context.imageSmoothingEnabled = false;
        context.drawImage(sheet, x, 0, size, size, 0, 0, size, size);
        frames.push(canvas);
    }
    return frames;
}

function loadImageAsync(path) {
    var image = new Image();
    image.src = path;
    return new Promise(function (resolve) {
        image.addEventListener('load', () => {
            resolve(image);
        });
    });
}