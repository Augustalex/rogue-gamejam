import mapLoader from './mapLoader.js'
import canvasToMatrix from './canvasToMatrix.js';

export default {
    async loadToMatrix(src) {
        let canvas = await mapLoader(src);
        let matrix = canvasToMatrix(canvas);
        return matrix;
    }
}

//WorldMapRasterizer
//WorldMapGenerator