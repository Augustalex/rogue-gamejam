export default {
    matrixPath: './mapLoader/world01.bmp',
    audioMapPath: './mapLoader/world01-audio.bmp',
    spritePaths: {
        'grass': './sprites/tile_Grass.png',
        'grassPresent': './sprites/tiles/tile_GrassPresent.png',
        'bricksPresent': './sprites/tiles/sprite_Tile_EdgePresent.png',
        'bricks': './sprites/sprite_Tile_Edge.png',
        'tileEdgeLeft': './sprites/tiles/tile_Edge_left001.png',
        'tileEdgeRight': './sprites/tiles/tile_Edge_right001.png',
        'tileEdgeTop': './sprites/tiles/sprite_Tile_TopBrick001.png',
        'tileEdgeBottom': './sprites/tiles/tile_Edge_Bottom001.png',
        'tileHalfEdgeLeft': './sprites/tiles/tile_halfEdge_left.png',
        'tileHalfEdgeRight': './sprites/tiles/tile_halfEdge_right.png',
        'tileHalfEdgeBottom': './sprites/tiles/tile_halfEdge_bottom.png',
        'tileHalfEdgeTop': './sprites/tiles/tile_halfEdge_top.png',
        'tilePatternA': './sprites/tiles/tile_PatternA.png',
        'tilePatternB': './sprites/tiles/tile_PatternB.png',
        'tilePatternC': './sprites/tiles/tile_PatternC.png',
        'grassBlend': './sprites/tiles/tile_grassBlend.png'
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
        '0,0,0': 'transparent'
    },
    colorToAudioName: {
        '255,0,0': 'background-0',
        '255,225,0': 'background-1',
        '255,255,255': 'wind'
    },
    attributesByTileId: {
        'transparent': {
            steep: true
        },
        grass: {
            present: 'grassPresent'
        },
        bricks: {
            present: 'bricksPresent'
        }
    },
    TileGetters: (sprites) => ({
        bricks() {
            let tiles = sprites.bricks.tiles;
            return tiles[Math.round((Math.random() * (tiles.length - 1)))];
        },
        tileEdgeLeft() {
            return sprites.tileEdgeLeft.tiles[0];
        },
        tileEdgeTop() {
            return sprites.tileEdgeTop.tiles[0];
        },
        tileEdgeRight() {
            return sprites.tileEdgeRight.tiles[0];
        },
        tileEdgeBottom() {
            return sprites.tileEdgeBottom.tiles[0];
        },
        tileHalfEdgeLeft() {
            let tiles = sprites.tileHalfEdgeLeft.tiles;
            return tiles[Math.round((Math.random() * (tiles.length - 1)))];
        },
        tileHalfEdgeRight() {
            let tiles = sprites.tileHalfEdgeRight.tiles;
            return tiles[Math.round((Math.random() * (tiles.length - 1)))];
        },
        tileHalfEdgeTop() {
            let tiles = sprites.tileHalfEdgeTop.tiles;
            return tiles[Math.round((Math.random() * (tiles.length - 1)))];
        },
        tileHalfEdgeBottom() {
            let tiles = sprites.tileHalfEdgeBottom.tiles;
            return tiles[Math.round((Math.random() * (tiles.length - 1)))];
        },
        tilePatternA() {
            let tiles = sprites.tilePatternA.tiles;
            return tiles[Math.round((Math.random() * (tiles.length - 1)))];
        },
        tilePatternB() {
            let tiles = sprites.tilePatternB.tiles;
            return tiles[Math.round((Math.random() * (tiles.length - 1)))];
        },
        tilePatternC() {
            let tiles = sprites.tilePatternC.tiles;
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
        bricksPresent() {
            let bricks = sprites.bricksPresent.tiles;
            return bricks[Math.round(Math.random() * (bricks.length - 1))];
        },
        transparent() {
            return null;
        }
    })
}