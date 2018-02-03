export default {
    matrixPath: './mapLoader/worldTest02.bmp',
    spritePaths: {
        'grass': './sprites/grass_Past001.png',
        'bricks': './sprites/sprite_Tile_Edge.png'
    },
    colorToTileId: {
        '115,132,140,255': 'brick',
        '25,123,49,255': 'grass'
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
        },
        grass() {
            return sprites.grass.tiles[0];
        }
    })
}