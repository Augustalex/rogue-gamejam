export default function (canvas) {
    let output = [];
    let context = canvas.getContext('2d');
    for (let x = 0; x < canvas.width; x++) {
        let row = [];
        for (let y = 0; y < canvas.height; y++) {
            let [r, g, b, a] = context.getImageData(x, y, 1, 1).data;
            row.push(`${r},${g},${b},${a}`);
        }
        output.push(row);
    }
    return output;
}