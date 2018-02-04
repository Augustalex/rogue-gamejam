//laddar in mapMatrix och
import mapTools from './mapTools.js';
import loadSprite from './loadSprite.js';
import rasterizeLayer from './rasterizeLayer.js';

export default function WorldMaker(worldData) {
    let {
        matrixPath,
        audioMapPath,
        spritePaths,
        colorToTileId,
        attributesByTileId,
        colorToAudioName,
        TileGetters,
        attributesByAudioName
    } = worldData;
    let availableColors = Object.keys(colorToTileId).map(colorString => {
        let [rs, gs, bs] = colorString.split(',');
        return [parseFloat(rs), parseFloat(gs), parseFloat(bs)];
    });

    let availableAudioColors = Object.keys(colorToAudioName).map(colorString => {
        let [rs, gs, bs] = colorString.split(',');
        return [parseFloat(rs), parseFloat(gs), parseFloat(bs)];
    });

    return {
        async make() {
            let layer = await this.makeLayer();
            let layerCanvas = rasterizeLayer(layer);
            return layerCanvas;
        },
        async makeLayer() {
            let matrix = await mapTools.loadToMatrix(matrixPath, availableColors);
            let audioMap;
            if (audioMapPath) {
                audioMap = await mapTools.loadToMatrix(audioMapPath, availableAudioColors);
            }
            let sprites = await loadSprites(spritePaths);
            let tileGetters = TileGetters(sprites);
            let { layer, tileWidth, tileHeight } = await createLayer({
                colorToTileId,
                tileGetters,
                matrix,
                attributesByTileId,
                audioMap,
                colorToAudioName,
                attributesByAudioName
            });
            return { layer, tileWidth, tileHeight, tileGetters };
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

async function createLayer({ colorToTileId, tileGetters, matrix, attributesByTileId, colorToAudioName, attributesByAudioName, audioMap }) {
    let tileRows = [];
    for (let y = 0; y < matrix.length; y++) {
        let tileRow = [];
        for (let x = 0; x < matrix[y].length; x++) {
            let matrixColor = matrix[y][x];

            let tileId = colorToTileId[matrixColor];
            if (!tileId) {
                console.log('BUH!', matrixColor);
                tileRow.push(null);
                continue;
            }

            let tileGetter = tileGetters[tileId];
            let tile = tileGetter();
            let presentTile;
            let attributes = attributesByTileId[tileId] || {};
            if (attributes.present) {
                presentTile = tileGetters[attributes.present]();
            }

            let audioZone = null;
            if (audioMap) {
                let audioColor = audioMap[y][x];
                if (audioColor) {
                    let audioName = colorToAudioName[audioColor];
                    audioZone = { audioName };
                    if (attributesByAudioName && attributesByAudioName[audioName]) {
                        Object.assign(audioZone, attributesByAudioName[audioName]);
                    }
                }
            }
            tileRow.push({ tile, ...attributes, presentTile, audioZone });
        }
        tileRows.push(tileRow);
    }
    return { layer: tileRows, tileWidth: 32, tileHeight: 32 };
}