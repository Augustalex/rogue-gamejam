import loadImage from './loadImage.js';

export default async function (src, { tileWidth, tileHeight }) {
    let image = await loadImage(src);
    let tiles = [];
    for (let x = 0; x < image.width; x += tileWidth) {
        for (let y = 0; y < image.height; y += tileHeight) {
            let tile = document.createElement('canvas');
            tile.width = tileWidth * 2;
            tile.height = tileHeight * 2;
            let context = tile.getContext('2d');
            context.imageSmoothingEnabled = false;
            context.drawImage(image, x, y, tileWidth, tileHeight, 0, 0, tileWidth * 2, tileHeight * 2);
            tiles.push(tile);
        }
    }

    return {
        source: image,
        tiles
    };
}