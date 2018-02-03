//laddar in mapMatrix och
import mapTools from './mapTools.js';
import loadSprite from './loadSprite.js';
import rasterizeLayer from './rasterizeLayer.js';
import worldData from './worldData.js';

export default async function WorldMaker() {
    let matrix = await mapTools.loadToMatrix('./worldTest.png');
    console.log(matrix.length);
    let { spritePaths, colorToTileId, TileGetters } = worldData;

    return {
        async make() {
            let sprites = await loadSprites(spritePaths);
            let tileGetters = TileGetters(sprites);
            let layer = await createLayer(colorToTileId, tileGetters, matrix);
            let layerCanvas = rasterizeLayer(layer);
            return layerCanvas;
        }
    };
}

async function loadSprites(spritePaths) {
    let spriteNames = Object.keys(spritePaths);
    let sprites = {};
    let promises = [];
    for (let name of spriteNames) {
        promises.push((async () => {
            console.log('loading sprite: ' + name);
            sprites[name] = await loadSprite(spritePaths[name], { tileWidth: 16, tileHeight: 16 });
        })());
    }
    await Promise.all(promises);
    console.log('loaded sprites', sprites);
    return sprites;
}

async function createLayer(colorToTileId, tileGetters, matrix) {
    let tileRows = [];
    for (let y = 0; y < matrix.length; y++) {
        let tileRow = [];
        for (let x = 0; x < matrix[y].length; x++) {
            let color = matrix[y][x];

            let tileId = colorToTileId[color];
            if (!tileId) {
                tileRow.push(null);
                continue;
            }

            let tileGetter = tileGetters[tileId];
            let tile = tileGetter();

            tileRow.push(tile);
        }
        tileRows.push(tileRow);
    }
    return tileRows;
}