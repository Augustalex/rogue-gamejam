//laddar in mapMatrix och
import mapTools from './mapTools.js';
import loadSprite from './loadSprite.js';
import rasterizeLayer from './rasterizeLayer.js';

export default function WorldMaker(worldData) {
    let { matrixPath, spritePaths, colorToTileId, TileGetters } = worldData;
    let availableColors = Object.keys(colorToTileId).map(colorString => {
        let [rs, gs, bs] = colorString.split(',');
        return [parseFloat(rs), parseFloat(gs), parseFloat(bs)];
    });

    return {
        async make() {
            let matrix = await mapTools.loadToMatrix(matrixPath, availableColors);
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
            sprites[name] = await loadSprite(spritePaths[name], { tileWidth: 16, tileHeight: 16 });
        })());
    }
    await Promise.all(promises);
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
                console.log('BUH!', color);
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