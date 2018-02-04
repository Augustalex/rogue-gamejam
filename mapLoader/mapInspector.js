import mapLoader from './mapLoader.js'

export default async function mapInspector(src, tileMap) {
    let output = document.createElement('canvas');
    output.width = 5000;
    output.height = 5000;
    let outputContext = output.getContext('2d');
    document.body.appendChild(output);
    outputContext.imageSmoothingEnabled = false;

    let imageCanvas = await mapLoader(src);

    outputContext.drawImage(imageCanvas, 0, 0, imageCanvas.width, imageCanvas.height, 0, 0, imageCanvas.width * 16, imageCanvas.height * 16);

    let lastData = [-1, -1, -1, -1];
    output.addEventListener('mousemove', e => {
        let { pageX, pageY } = e;
        let x = pageX - output.offsetLeft;
        let y = pageY - output.offsetTop;
        let data = outputContext.getImageData(x, y, 1, 1);
        lastData = data.data;
    });
    document.addEventListener('keydown', e => {
        if (e.key.toLowerCase() === 's') {
            let tileName = tileMap && tileMap[`${lastData}`];
            let message = '';
            if (tileName) {
                message += 'Tile type: ' + tileName + '\n';
            }
            message += `COLOR: [ ${lastData} ]`;
            alert(message);
        }
    });
}