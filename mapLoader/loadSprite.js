import loadImage from './loadImage.js';

export default async function (src, { tileWidth, tileHeight }) {
    let image = await
        loadImage(src);

    let tiles = [];
    for (let x = 0; x < image.height; x + tileHeight) {
        for (let y = 0; y < image.width; y + tileWidth) {
            let tile = document.createElement('canvas');
            tile.width = tileWidth;
            tile.height = tileHeight;
            tile.getContext('2d')
                .drawImage(image, x, y, tileWidth, tileHeight, 0, 0, tileWidth, tileHeight);
            tiles.push(tile);
        }
    }
    
    return {
        source: image,
        tiles
    };
}