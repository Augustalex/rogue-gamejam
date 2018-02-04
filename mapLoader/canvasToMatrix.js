export default function (canvas, availableColors) {
    let output = [];
    let context = canvas.getContext('2d');
    for (let y = 0; y < canvas.height; y++) {
        let row = [];
        for (let x = 0; x < canvas.width; x++) {
            let color = context.getImageData(x, y, 1, 1).data;
            let [r, g, b] = closestColor(color, availableColors);
            row.push(`${r},${g},${b}`);
        }
        output.push(row);
    }
    return output;
}

function closestColor([r1, g1, b1], availableColors) {
    let diffs = availableColors.map(([r2, g2, b2]) => colorDifference(r1, g1, b1, r2, g2, b2));
    let leastDiff = Math.min(...diffs);
    return availableColors[diffs.indexOf(leastDiff)];
}

function colorDifference(r1, g1, b1, r2, g2, b2) {
    var sumOfSquares = 0;

    sumOfSquares += Math.pow(r1 - r2, 2);
    sumOfSquares += Math.pow(g1 - g2, 2);
    sumOfSquares += Math.pow(b1 - b2, 2);

    return Math.sqrt(sumOfSquares);
}