export default {
    matrixPath: './worldTest.png',
    spritePaths: {
        'bricks': '../sprites/sprite_Tile_Edge.png'
    },
    colorToTileId: {
        '182,15,15,255': 'brick1',
        '0,0,0,255': 'brick2'
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