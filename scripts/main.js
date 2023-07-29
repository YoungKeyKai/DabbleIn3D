// Angles will ALL mean counterclockwise direction (like in maths)

function degToRad(degrees) {
    return degrees * Math.PI / 180
}

function createPoint(x, y) {
    return {x, y}
}

function createLine(x1, y1, x2, y2) {
    return {start: createPoint(x1, y1), end: createPoint(x2, y2)}
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
    circle.arc(center.x, center.y, radius, 0, 2 * Math.PI, true)

    context.fillStyle = colour
    context.strokeStyle = colour

    if (fill) {
        context.fill(circle)
    } else {
        context.stroke(circle)
    }
}

function drawLine(context, line, colour='white') {
    context.beginPath()
    context.moveTo(line.start.x, line.start.y)
    context.lineTo(line.end.x, line.end.y)

    context.strokeStyle = colour
    context.stroke()
}

function fillCanvas(canvas, context, colour='black') {
    drawRectangle(context, createPoint(0, 0), createPoint(canvas.width, canvas.height), fill=true, colour=colour)
}

function get2DCanvas() {
    let canvas = document.querySelector('#canvas2d')
    return [canvas, canvas.getContext('2d')]
}

function rayCast2D() {
    [canvas2D, context2D] = get2DCanvas()
    fillCanvas(canvas2D, context2D)
    
    let playerPosition = createPoint(canvas2D.width / 2, canvas2D.height / 2)
    drawCircle(context2D, playerPosition, 2)
    
    let facingDirection = 0 // Degrees
    let fovAngle = 100 // Degrees
    let rayMaxDistance = 100
    let rayCount = 50

    let rays = new Array(rayCount).fill(0)
    let startFOVAngle = facingDirection - fovAngle / 2
    let angleStep = fovAngle / rayCount
    for (let i = 0; i < rayCount; i++) {
        let angleRad = degToRad(startFOVAngle + i * angleStep)
        let deltaX = rayMaxDistance * Math.cos(angleRad)
        let deltaY = rayMaxDistance * Math.sin(angleRad)

        rays[i] = createLine(playerPosition.x, playerPosition.y, playerPosition.x + deltaX, playerPosition.y + deltaY)
    }

    rays.forEach((line) => drawLine(context2D, line))
}

rayCast2D()