import mapLoader from './mapLoader.js'

export default async function mapInspector(src, tileMap) {
    tileMap = {
        '182,15,15,255': 'brick'
    };
    let imageCanvas = await mapLoader(src);
    let imageContext = imageCanvas.getContext('2d');
    document.body.appendChild(imageCanvas);

    let lastData = [-1, -1, -1, -1];
    imageCanvas.addEventListener('mousemove', e => {
        let { clientX: x, clientY: y } = e;
        let data = imageContext.getImageData(x, y, 1, 1);
        console.log(data.data);
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