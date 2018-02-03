export default async function loadImage(src) {
    let image = new Image();
    await new Promise(resolve => {
        image.src = src;
        image.onload = resolve;
    });
    return image;
}
