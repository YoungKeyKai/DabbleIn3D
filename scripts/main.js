let degreeToRadian = (degrees) => degrees * Math.PI / 180
let radianToDegree = (radians) => radians * 180 / Math.PI

let createPoint = (x, y) => {
    return {x, y}
}

let createLine = (startingPoint, endingPoint) => {
    if (startingPoint.x === endingPoint.x && startingPoint.y === endingPoint.y) {
        throw Error('Starting and ending points of a line must be different.')
    }

    let isVertical = false, isHorizontal = false

    if (startingPoint.x === endingPoint.x) {
        isVertical = true
    } else if (startingPoint.y === endingPoint.y) {
        isHorizontal = true
    }

    return {startingPoint, endingPoint, isVertical, isHorizontal}
}

let slopeAndYInterceptOfLine = (line) => {
    let slope = (line.endingPoint.y - line.startingPoint.y) / (line.endingPoint.x - line.startingPoint.x)
    let yIntercept = line.endingPoint.y - slope * line.endingPoint.x

    return {slope, yIntercept}
}

let lengthOfLine = (line) => Math.sqrt(
    (line.endingPoint.x - line.startingPoint.x) ** 2 + (line.endingPoint.y - line.startingPoint.y) ** 2
)

let createRectangle = (topLeftPoint, bottomRightPoint) => {
    return {topLeftPoint, bottomRightPoint}
}

let createCircle = (center, radius) => {
    return {center, radius}
}

let intersectionPointOfLines = (line1, line2) => {
    let deltaX1 = line1.endingPoint.x - line1.startingPoint.x
    let deltaY1 = line1.endingPoint.y - line1.startingPoint.y

    let deltaX2 = line2.endingPoint.x - line2.startingPoint.x
    let deltaY2 = line2.endingPoint.y - line2.startingPoint.y

    let line2DirectionVectorParameterDenominator = deltaX2 * deltaY1 - deltaY2 * deltaX1
    let line1DirectionVectorParameterDenominator = deltaX1
    if (line1DirectionVectorParameterDenominator === 0 || line2DirectionVectorParameterDenominator === 0) {
        return undefined // Colinear
    }
    
    let differenceBetweenStartingPointX = line2.startingPoint.x - line1.startingPoint.x
    let differenceBetweenStartingPointY = line2.startingPoint.y - line1.startingPoint.y
    let line2DirectionVectorParameter = (
        (deltaX1 * differenceBetweenStartingPointY - deltaY1 * differenceBetweenStartingPointX) /
        line2DirectionVectorParameterDenominator
    )
    let line1DirectionVectorParameter = (
        (line2DirectionVectorParameter * deltaX2 + differenceBetweenStartingPointX) /
        line1DirectionVectorParameterDenominator
    )

    if (
        (line1DirectionVectorParameter < 0 || line1DirectionVectorParameter > 1) ||
        (line2DirectionVectorParameter < 0 || line2DirectionVectorParameter > 1) 
    ) {
        return false
    }

    let intersectionX = line1.startingPoint.x + line1DirectionVectorParameter * deltaX1
    let intersectionY = line1.startingPoint.y + line1DirectionVectorParameter * deltaY1

    return createPoint(intersectionX, intersectionY)
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

        this.walls = [createLine(createPoint(270, 100), createPoint(400, 250)),]

        this.rayEndPoints = new Array(this.rayCount).fill(0)
        this.updateRays()
    }

    updateRays() {
        let startingFOVAngle = this.facingDirectionDegrees - this.fovAngleDegrees / 2
        let angleStep = this.fovAngleDegrees / this.rayCount
        
        for (let rayIndex = 0; rayIndex < this.rayCount; rayIndex++) {
            let rayAngleInRadians = degreeToRadian(startingFOVAngle + rayIndex * angleStep)
            let maximumDeltaX = this.rayMaxDistance * Math.cos(rayAngleInRadians)
            let maximumDeltaY = this.rayMaxDistance * Math.sin(rayAngleInRadians)

            let shortestRayEndPoint = createPoint(this.playerPosition.x + maximumDeltaX, this.playerPosition.y + maximumDeltaY)
            let shortestRayLength = this.rayMaxDistance

            for (let wallIndex = 0; wallIndex < this.walls.length; wallIndex++) {
                let rayLine = createLine(this.playerPosition, shortestRayEndPoint)
                let intersectionPointBetweenRayAndWall = intersectionPointOfLines(rayLine, this.walls[wallIndex])

                if (!intersectionPointBetweenRayAndWall) {
                    continue
                }

                let rayToIntersectionLength = lengthOfLine(createLine(this.playerPosition, intersectionPointBetweenRayAndWall))
                if (rayToIntersectionLength < shortestRayLength) {
                    shortestRayEndPoint = intersectionPointBetweenRayAndWall
                    shortestRayLength = rayToIntersectionLength
                }
            }

            this.rayEndPoints[rayIndex] = shortestRayEndPoint
        }
    }
    
    drawVisuals() {
        this.canvas.fillCanvas()
        this.canvas.drawCircle(createCircle(this.playerPosition, 2))
        this.rayEndPoints.forEach((rayEndPoint) => this.canvas.drawLine(createLine(this.playerPosition, rayEndPoint)))
        this.walls.forEach((wall) => this.canvas.drawLine(wall))
    }
}

const raycast2D = new Raycast2D('#canvas2d')
raycast2D.drawVisuals()
