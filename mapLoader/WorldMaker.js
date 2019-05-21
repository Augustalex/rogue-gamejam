//laddar in mapMatrix och
import mapTools from './mapTools.js';
import loadSprite from './loadSprite.js';
import rasterizeLayer from './rasterizeLayer.js';
import {getOrCreate} from '../timeCache.js';

export default function WorldMaker(worldData) {
    let {
        matrixPath,
        audioMapPath,
        spritePaths,
        colorToTileId,
        attributesByTileId,
        colorToAudioName,
        attributesByAudioName,
        TileGetters,
        enemyMapPath,
        colorToEnemyName,
        EnemyFactoryFactory
    } = worldData;

    let availableColors = Object.keys(colorToTileId).map(colorString => {
        let [rs, gs, bs] = colorString.split(',');
        return [parseFloat(rs), parseFloat(gs), parseFloat(bs)];
    });

    let availableAudioColors = Object.keys(colorToAudioName).map(colorString => {
        let [rs, gs, bs] = colorString.split(',');
        return [parseFloat(rs), parseFloat(gs), parseFloat(bs)];
    });

    let availableEnemyColors = Object.keys(colorToEnemyName).map(colorString => {
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
            console.log('LOADING MAP MATRIX')
            let matrix = await getOrCreate('matrix', () => mapTools.loadToMatrix(matrixPath, availableColors));

            let audioMap;
            console.log('LOADING AUDIO MATRIX')
            if (audioMapPath) {
                audioMap = await getOrCreate('audioMap', () => mapTools.loadToMatrix(audioMapPath, availableAudioColors));
            }

            let enemyMap;
            console.log('LOADING ENEMY MATRIX')
            if (enemyMapPath) {
                enemyMap = await getOrCreate('enemyMap', () => mapTools.loadToMatrix(enemyMapPath, availableEnemyColors));
            }

            console.log('LOADING WORLD SPRITES')
            let sprites = await loadSprites(spritePaths);

            let tileGetters = TileGetters(sprites);
            console.log('CREATING LAYER')
            let data = await createLayer({
                colorToTileId,
                tileGetters,
                matrix,
                attributesByTileId,
                audioMap,
                colorToAudioName,
                attributesByAudioName,
                enemyMap,
                colorToEnemyName,
                EnemyFactoryFactory
            });
            return { ...data, tileGetters };
        }
    };
}

async function loadSprites(spritePaths) {
    let spriteNames = Object.keys(spritePaths);
    let sprites = {};
    let promises = [];
    for (let name of spriteNames) {
        console.log('LOADING SPRITE "' + name + '" FOR WORLD')
        promises.push((async () => {
            sprites[name] = await loadSprite(spritePaths[name], { tileWidth: 16, tileHeight: 16 });
        })());
    }
    await Promise.all(promises);
    return sprites;
}

async function createLayer(options) {
    let {
        colorToTileId,
        tileGetters,
        matrix,
        attributesByTileId,
        colorToAudioName,
        attributesByAudioName,
        audioMap,
        enemyMap,
        colorToEnemyName,
        EnemyFactoryFactory
    } = options;

    let enemyFactories = [];

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
            if (!tileGetter) {
                console.log(tileId);

            }
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

            if (enemyMap) {
                let enemyColor = enemyMap[y][x];
                if (enemyColor) {
                    let enemyName = colorToEnemyName[enemyColor];
                    let factory = EnemyFactoryFactory[enemyName];
                    if (factory) {
                        let f = factory(x, y);
                        if (f) {
                            enemyFactories.push(f)
                        }
                    }
                }
            }

            tileRow.push({ tile, ...attributes, presentTile, audioZone });
        }
        tileRows.push(tileRow);
    }
    return { layer: tileRows, tileWidth: 32, tileHeight: 32, enemyFactories: enemyFactories || [] };
}
