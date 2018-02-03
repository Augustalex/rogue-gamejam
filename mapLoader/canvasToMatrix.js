export default function (canvas) {
    let output = [];
    let context = canvas.getContext('2d');
    for (let x = 0; x < canvas.width; x++) {
        let row = [];
        for (let y = 0; y < canvas.height; y++) {
            row.push(context.getImageData(x, y, 1, 1).data);
        }
        output.push(row);
    }
    return output;
}