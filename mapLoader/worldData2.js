export default {
    matrixPath: './mapLoader/worldTest03.bmp',
    spritePaths: {
        'grass': './sprites/tile_Grass.png',
        'grassPresent': './sprites/tiles/tile_GrassPresent.png',
        'bricksPresent': './sprites/tiles/sprite_Tile_EdgePresent.png',
        'bricks': './sprites/sprite_Tile_Edge.png',
        'tileEdgeLeft': './sprites/tiles/tile_Edge_left001.png',
        'tileEdgeRight': './sprites/tiles/tile_Edge_right001.png',
        'spriteTileTopBrick1': './sprites/tiles/sprite_Tile_TopBrick001.png',
        'tileEdgeBottom': './sprites/tiles/tile_Edge_Bottom001.png',
        'tileHalfEdgeLeft': './sprites/tiles/tile_halfEdge_left.png',
        'tileHalfEdgeRight': './sprites/tiles/tile_halfEdge_right.png',
        'tilePatternA': './sprites/tiles/tile_PatternA.png',
        'grassBlend': './sprites/tiles/tile_grassBlend.png'
    },
    colorToTileId: {
        '25,123,49': 'grass',
        '115,132,140': 'bricks',
        '181,148,206': 'tileEdgeLeft',
        '123,82,156': 'spriteTileTopBrick1',
        '0,140,255': 'tileHalfEdgeLeft',
        '0,247,255': 'tileHalfEdgeRight',
        '99,16,156': 'tileEdgeRight',
        '41,33,58': 'tileEdgeBottom',
        '33,107,132': 'tilePatternA',
        '133,153,59': 'grassBlend',
        '0,0,0': 'transparent'
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
        spriteTileTopBrick1() {
            return sprites.spriteTileTopBrick1.tiles[0];
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
        tilePatternA() {
            let tiles = sprites.tilePatternA.tiles;
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