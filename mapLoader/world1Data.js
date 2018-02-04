import Friend from "../enemy/Friend.js";

export default {
    matrixPath: './mapLoader/world01.bmp',
    audioMapPath: './mapLoader/world01-audio.bmp',
    enemyMapPath: './mapLoader/world01-enemy.bmp',
    spritePaths: {
        'grass': './sprites/tile_Grass.png',
        'grassPresent': './sprites/tiles/tile_GrassPresent.png',
        'bricks': './sprites/sprite_Tile_Edge.png',
        'bricksPresent': './sprites/tiles/sprite_Tile_EdgePresent.png',
        'tileEdgeLeft': './sprites/tiles/tile_Edge_left001.png',
        'tileEdgeLeftPresent': './sprites/tiles/tile_Edge_left001Present.png',
        'tileEdgeRight': './sprites/tiles/tile_Edge_right001.png',
        'tileEdgeRightPresent': './sprites/tiles/tile_Edge_right001Present.png',
        'tileEdgeTop': './sprites/tiles/sprite_Tile_TopBrick001.png',
        'tileEdgeTopPresent': './sprites/tiles/sprite_Tile_TopBrick001Present.png',
        'tileEdgeBottom': './sprites/tiles/tile_Edge_Bottom001.png',
        'tileEdgeBottomPresent': './sprites/tiles/tile_Edge_Bottom001Present.png',
        'tileHalfEdgeLeft': './sprites/tiles/tile_halfEdge_left.png',
        'tileHalfEdgeLeftPresent': './sprites/tiles/tile_halfEdge_leftPresent.png',
        'tileHalfEdgeRight': './sprites/tiles/tile_halfEdge_right.png',
        'tileHalfEdgeRightPresent': './sprites/tiles/tile_halfEdge_rightPresent.png',
        'tileHalfEdgeBottom': './sprites/tiles/tile_halfEdge_bottom.png',
        'tileHalfEdgeBottomPresent': './sprites/tiles/tile_halfEdge_bottomPresent.png',
        'tileHalfEdgeTop': './sprites/tiles/tile_halfEdge_top.png',
        'tileHalfEdgeTopPresent': './sprites/tiles/tile_halfEdge_topPresent.png',
        'tilePatternA': './sprites/tiles/tile_PatternA.png',
        'tilePatternAPresent': './sprites/tiles/tile_PatternAPresent.png',
        'tilePatternB': './sprites/tiles/tile_PatternB.png',
        'tilePatternBPresent': './sprites/tiles/tile_PatternBPresent.png',
        'tilePatternC': './sprites/tiles/tile_PatternC.png',
        'tilePatternCPresent': './sprites/tiles/tile_PatternCPresent.png',
        'grassBlend': './sprites/tiles/tile_grassBlend.png',
        'grassBlendPresent': './sprites/tiles/tile_grassBlendPresent.png',
        'brokenPast': './sprites/tiles/tile_BrokenPast.png'
    },
    colorToTileId: {
        '25,123,49': 'grass',
        '115,132,140': 'bricks',
        '181,148,206': 'tileEdgeLeft',
        '123,82,156': 'tileEdgeTop',
        '99,16,156': 'tileEdgeRight',
        '41,33,58': 'tileEdgeBottom',
        '0,140,255': 'tileHalfEdgeLeft',
        '0,247,255': 'tileHalfEdgeRight',
        '255,162,0': 'tileHalfEdgeTop',
        '201,66,66': 'tileHalfEdgeBottom',
        '33,107,132': 'tilePatternA',
        '133,153,59': 'grassBlend',
        '28,173,125': 'tilePatternB',
        '173,101,28': 'tilePatternC',
        '73,73,73': 'brokenPast',
        '0,0,0': 'transparent'
    },
    attributesByTileId: {
        'transparent': {
            steep: true
        },
        tileEdgeLeft: {
            present: 'tileEdgeLeftPresent'
        },
        tileEdgeRight: {
            present: 'tileEdgeRightPresent'
        },
        tileEdgeTop: {
            present: 'tileEdgeTopPresent'
        },
        tileEdgeBottom: {
            present: 'tileEdgeBottomPresent'
        },
        tileHalfEdgeLeft: {
            present: 'tileHalfEdgeLeftPresent'
        },
        tileHalfEdgeRight: {
            present: 'tileHalfEdgeRightPresent'
        },
        tileHalfEdgeBottom: {
            present: 'tileHalfEdgeBottomPresent'
        },
        tileHalfEdgeTop: {
            present: 'tileHalfEdgeTopPresent'
        },
        tilePatternA: {
            present: 'tilePatternAPresent'
        },
        tilePatternB: {
            present: 'tilePatternBPresent'
        },
        tilePatternC: {
            present: 'tilePatternCPresent'
        },
        grassBlend: {
            present: 'grassBlendPresent'
        },
        grass: {
            present: 'grassPresent'
        },
        bricks: {
            present: 'bricksPresent'
        },
        brokenPast: {
            present: 'brokenPresent',
            steepPresent: true
        }
    },
    colorToAudioName: {
        '255,0,0': 'dumdum',
        '255,225,0': 'sweeps-0',
        '255,255,255': 'wind',
        '30,255,0': 'ambient-0',
        '0,102,255': 'boss-1',
        '217,0,255': 'throneroom'
    },
    attributesByAudioName: {
        wind: {
            present: 'wind',
            past: 'rain'
        }
    },
    colorToEnemyName: {
        '255,0,0': 'friend',
        '0,0,0': 'nullEnemy',
        '255,255,255': 'nullEnemy',
    },
    TileGetters: (sprites) => ({
        bricks() {
            let tiles = sprites.bricks.tiles;
            return tiles[Math.round((Math.random() * (tiles.length - 1)))];
        },
        tileEdgeLeft() {
            return sprites.tileEdgeLeft.tiles[0];
        },
        tileEdgeLeftPresent() {
            return sprites.tileEdgeLeftPresent.tiles[0];
        },
        tileEdgeTop() {
            return sprites.tileEdgeTop.tiles[0];
        },
        tileEdgeTopPresent() {
            return sprites.tileEdgeTopPresent.tiles[0];
        },
        tileEdgeRight() {
            return sprites.tileEdgeRight.tiles[0];
        },
        tileEdgeRightPresent() {
            return sprites.tileEdgeRightPresent.tiles[0];
        },
        tileEdgeBottom() {
            return sprites.tileEdgeBottom.tiles[0];
        },
        tileEdgeBottomPresent() {
            return sprites.tileEdgeBottomPresent.tiles[0];
        },
        tileHalfEdgeLeft() {
            let tiles = sprites.tileHalfEdgeLeft.tiles;
            return tiles[Math.round((Math.random() * (tiles.length - 1)))];
        },
        tileHalfEdgeLeftPresent() {
            let tiles = sprites.tileHalfEdgeLeftPresent.tiles;
            return tiles[Math.round((Math.random() * (tiles.length - 1)))];
        },
        tileHalfEdgeRight() {
            let tiles = sprites.tileHalfEdgeRight.tiles;
            return tiles[Math.round((Math.random() * (tiles.length - 1)))];
        },
        tileHalfEdgeRightPresent() {
            let tiles = sprites.tileHalfEdgeRightPresent.tiles;
            return tiles[Math.round((Math.random() * (tiles.length - 1)))];
        },
        tileHalfEdgeTop() {
            let tiles = sprites.tileHalfEdgeTop.tiles;
            return tiles[Math.round((Math.random() * (tiles.length - 1)))];
        },
        tileHalfEdgeTopPresent() {
            let tiles = sprites.tileHalfEdgeTopPresent.tiles;
            return tiles[Math.round((Math.random() * (tiles.length - 1)))];
        },
        tileHalfEdgeBottom() {
            let tiles = sprites.tileHalfEdgeBottom.tiles;
            return tiles[Math.round((Math.random() * (tiles.length - 1)))];
        },
        tileHalfEdgeBottomPresent() {
            let tiles = sprites.tileHalfEdgeBottomPresent.tiles;
            return tiles[Math.round((Math.random() * (tiles.length - 1)))];
        },
        tilePatternA() {
            let tiles = sprites.tilePatternA.tiles;
            return tiles[Math.round((Math.random() * (tiles.length - 1)))];
        },
        tilePatternAPresent() {
            let tiles = sprites.tilePatternAPresent.tiles;
            return tiles[Math.round((Math.random() * (tiles.length - 1)))];
        },
        tilePatternB() {
            let tiles = sprites.tilePatternB.tiles;
            return tiles[Math.round((Math.random() * (tiles.length - 1)))];
        },
        tilePatternBPresent() {
            let tiles = sprites.tilePatternBPresent.tiles;
            return tiles[Math.round((Math.random() * (tiles.length - 1)))];
        },
        tilePatternC() {
            let tiles = sprites.tilePatternC.tiles;
            return tiles[Math.round((Math.random() * (tiles.length - 1)))];
        },
        tilePatternCPresent() {
            let tiles = sprites.tilePatternCPresent.tiles;
            return tiles[Math.round((Math.random() * (tiles.length - 1)))];
        },
        grass() {
            let grass = sprites.grass.tiles;
            return grass[Math.round(Math.random() * (grass.length - 1))];
        },
        grassPresent() {
            let grass = sprites.grassPresent.tiles;
            return grass[Math.round(Math.random() * (grass.length - 1))];
        },
        grassBlend() {
            let grassBlend = sprites.grassBlend.tiles;
            return grassBlend[Math.round(Math.random() * (grassBlend.length - 1))];
        },
        grassBlendPresent() {
            let grassBlend = sprites.grassBlendPresent.tiles;
            return grassBlend[Math.round(Math.random() * (grassBlend.length - 1))];
        },
        bricksPresent() {
            let bricks = sprites.bricksPresent.tiles;
            return bricks[Math.round(Math.random() * (bricks.length - 1))];
        },
        brokenPast() {
            let tiles = sprites.brokenPast.tiles;
            return tiles[Math.round(Math.random() * (tiles.length - 1))];
        },
        brokenPresent() {
            return 'EMPTY';
        },
        transparent() {
            return null;
        }
    }),
    EnemyFactoryFactory: {
        friend(x, y) {
            // console.log('friend', x * 12, y * 30);
            return ({ store, localStore, controllerId }) => {
                // localStore.commit('SET_PLAYER_POS', { id: localStore.state.clientId, x, y}
                let enemyState = Friend.createState({ controllerId, x: x * 32, y: y * 32 });
                store.dispatch('createFriend', enemyState);
            }
        },
        nullEnemy() {
            return null;
        }
    }
}