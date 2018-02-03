import loadImage from './loadImage.js';

export default async function (src) {
    let image = await loadImage(src);
    let canvas = toCanvas(image);
    // var p = canvas.getContext('2d').getImageData(100, 100, 1, 1).data;
    // console.log('pixel', p);
    return canvas;
}

function toCanvas(image) {
    // Create an empty canvas element
    let canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;

    // Copy the image contents to the canvas
    let ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);

    return canvas;
}