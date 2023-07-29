function createPoint(x, y) {
    return {x, y}
}

function drawRectangle(context, start, end, fill=true, colour='white') {
    if (fill) {
        context.fillStyle = colour
        context.fillRect(start.x, start.y, end.x, end.y)
    } else {
        context.strokeStyle = colour
        context.strokeRect(start.x, start.y, end.x, end.y)
    }
}

function drawCircle(context, center, radius, fill=true, colour='white') {
    let circle = new Path2D()
    circle.arc(center.x, center.y, radius, 0, 2 * Math.PI)

    context.fillStyle = colour
    context.strokeStyle = colour

    if (fill) {
        context.fill(circle)
    } else {
        context.stroke(circle)
    }
}

function fillCanvas(canvas, context, colour='black') {
    drawRectangle(context, createPoint(0, 0), createPoint(canvas.width, canvas.height), fill=true, colour=colour)
}

function get2DCanvas() {
    let canvas = document.querySelector('#canvas2d')
    return [canvas, canvas.getContext('2d')]
}

[canvas2D, context2D] = get2DCanvas()
fillCanvas(canvas2D, context2D)

let playerPosition = createPoint(canvas2D.width / 2, canvas2D.height / 2)
drawCircle(context2D, playerPosition, 2)