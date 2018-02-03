export default function rasterizeLayer(tileLayer) {
    if (tileLayer.length === 0) throw Error('Need at least one row of tiles');

    let canvas = document.createElement('canvas');
    canvas.height = tileLayer.length * tileLayer[0][0].height;
    canvas.width = tileLayer[0].length * tileLayer[0][0].width;
    console.log(canvas.height, canvas.width);
    let context = canvas.getContext('2d');

    for (let y = 0; y < tileLayer.length; y++) {
        for (let x = 0; x < tileLayer[y].length; x++) {
            let tile = tileLayer[x][y];
            if (!tile) continue;

            context.drawImage(tile, 0, 0, tile.width, tile.height, x * tile.width, y * tile.height, tile.width, tile.height);
        }
    }

    return canvas;
}