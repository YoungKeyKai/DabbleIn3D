let degreeToRadian = (degrees) => degrees * Math.PI / 180
let radianToDegree = (radians) => radians * 180 / Math.PI

let createPoint = (x, y) => {
    return {x, y}
}

let createLine = (startingPoint, endingPoint) => {
    return {startingPoint, endingPoint}
}

let createRectangle = (topLeftPoint, bottomRightPoint) => {
    return {topLeftPoint, bottomRightPoint}
}

let createCircle = (center, radius) => {
    return {center, radius}
}

class Canvas {
    constructor(canvasSelector) {
        if (Canvas._instance !== undefined) {
            return Canvas._instance
        }

        this.canvas = document.querySelector(canvasSelector)
        this.context = this.canvas.getContext('2d')
        this.width = this.canvas.width
        this.height = this.canvas.height

        Canvas._instance = this
    }
    
    drawRectangle(rectangle, fill=true, colour='white') {
        this.context.fillStyle = colour
        this.context.strokeStyle = colour

        if (fill) {
            this.context.fillRect(
                rectangle.topLeftPoint.x,
                rectangle.topLeftPoint.y,
                rectangle.bottomRightPoint.x,
                rectangle.bottomRightPoint.y
            )
        } else {
            this.context.strokeRect(
                rectangle.topLeftPoint.x,
                rectangle.topLeftPoint.y,
                rectangle.bottomRightPoint.x,
                rectangle.bottomRightPoint.y
            )
        }
    }
    
    drawCircle(circle, fill=true, colour='white') {
        let circlePath = new Path2D().arc(circle.center.x, circle.center.y, circle.radius, 0, 2 * Math.PI, true)
    
        this.context.fillStyle = colour
        this.context.strokeStyle = colour
    
        if (fill) {
            this.context.fill(circlePath)
        } else {
            this.context.stroke(circlePath)
        }
    }
    
    drawLine(line, colour='white') {
        this.context.beginPath()
        this.context.moveTo(line.startingPoint.x, line.startingPoint.y)
        this.context.lineTo(line.endingPoint.x, line.endingPoint.y)
    
        this.context.strokeStyle = colour
        this.context.stroke()
    }
    
    fillCanvas(colour='black') {
        this.drawRectangle(
            createRectangle(createPoint(0, 0), createPoint(this.width, this.height)),
            true,
            colour
        )
    }
}

class Raycast2D {
    constructor(canvasSelector) {
        this.canvas = new Canvas(canvasSelector)

        this.facingDirectionDegrees = 0
        this.fovAngleDegrees = 100
        this.rayMaxDistance = 100
        this.rayCount = 50

        this.playerPosition = createPoint(this.canvas.width / 2, this.canvas.height / 2)

        this.rayEndPoints = new Array(this.rayCount).fill(0)
        this.updateRays()
    }

    updateRays() {
        let startingFOVAngle = this.facingDirectionDegrees - this.fovAngleDegrees / 2
        let angleStep = this.fovAngleDegrees / this.rayCount
        
        for (let rayIndex = 0; rayIndex < this.rayCount; rayIndex++) {
            let angleRadians = degreeToRadian(startingFOVAngle + rayIndex * angleStep)
            let deltaX = this.rayMaxDistance * Math.cos(angleRadians)
            let deltaY = this.rayMaxDistance * Math.sin(angleRadians)
            this.rayEndPoints[rayIndex] = createPoint(this.playerPosition.x + deltaX, this.playerPosition.y + deltaY)
        }
    }
    
    drawVisuals() {
        this.canvas.fillCanvas()
        this.canvas.drawCircle(createCircle(this.playerPosition, 2))
        this.rayEndPoints.forEach((rayEndPoint) => this.canvas.drawLine(createLine(this.playerPosition, rayEndPoint)))
    }
    
}

const raycast2D = new Raycast2D('#canvas2d')
raycast2D.drawVisuals()
