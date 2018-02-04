import mapLoader from './mapLoader.js'
import canvasToMatrix from './canvasToMatrix.js';

export default {
    async loadToMatrix(src, availableColors) {
        let canvas = await mapLoader(src);
        let matrix = canvasToMatrix(canvas, availableColors);
        return matrix;
    }
}

//WorldMapRasterizer
//WorldMapGenerator