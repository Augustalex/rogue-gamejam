export default {
    matrixPath: './mapLoader/worldTest.png',
    spritePaths: {
        'bricks': './sprites/sprite_Tile_Edge.png'
    },
    colorToTileId: {
        '115,132,140,255': 'brick1',
        '0,0,0,255': 'brick2',
        '181,148,206,255': 'tileEdgeLeft',
        '123,82,156,255': 'spriteTileTopBrick1',
        '99,16,156,255': 'tileEdgeRight',
        '41,33,58,255': 'tileEdgeBottom',
    },
    TileGetters: (sprites) => ({
        brick() {
            let bricks = sprites.bricks.tiles;
            return bricks[Math.round(Math.random() * bricks.length - 1)];
        },
        brick1() {
            let bricks = sprites.bricks.tiles;
            return bricks[14];
        },
        brick2() {
            let bricks = sprites.bricks.tiles;
            return bricks[5];
        }
    })
}