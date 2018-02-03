export default {
    character: null,
    boss: null,
    async loadResources(){
        this.character = await loadImageAsync('./sprites/character.png');
        this.boss = await loadImageAsync('./sprites/boss.png');
    }
}



function loadImageAsync(path){
    var image = new Image();
    image.src = path;
    return new Promise(function (resolve){
        image.addEventListener('load', () => {
            resolve(image);
        });
    });
}