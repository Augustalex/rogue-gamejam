export default {
    character: null,
    boss: null,
    bossPast: [],
    async loadResources() {
        this.character = await loadImageAsync('./sprites/character.png');
        this.friend = await loadImageAsync('./sprites/friend.png');
        this.boss = await loadImageAsync('./sprites/boss.png');
        this.bossPast = await loadBossFrames('./sprites/boss_Past.png');
        this.bossPresent = await loadBossFrames('./sprites/boss_Present.png');
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

function loadImageAsync(path) {
    var image = new Image();
    image.src = path;
    return new Promise(function (resolve) {
        image.addEventListener('load', () => {
            resolve(image);
        });
    });
}