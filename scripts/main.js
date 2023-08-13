let pixelsPerMeter = 10
let pixelsToMeters = (distanceInPixels) => distanceInPixels / pixelsPerMeter
let metersToPixels = (distanceInMeters) => distanceInMeters * pixelsPerMeter

let degreeToRadian = (degrees) => degrees * Math.PI / 180
let radianToDegree = (radians) => radians * 180 / Math.PI

let createGrayscaleRGBColour = (value) => `rgb(${value}, ${value}, ${value})`

let createPoint = (x, y) => {
    return {x, y}
}

let createRayEndPoint = (point, hasHitWall) => {
    return {point, hasHitWall}
}

let createLine = (startingPoint, endingPoint) => {
    return {startingPoint, endingPoint}
}

let lengthOfLineInPixels = (line) => Math.sqrt(
    (line.endingPoint.x - line.startingPoint.x) ** 2 + (line.endingPoint.y - line.startingPoint.y) ** 2
)

let createRectangle = (topLeftPoint, bottomRightPoint) => {
    return {topLeftPoint, bottomRightPoint}
}

let createCircle = (center, radius) => {
    return {center, radius}
}

/**
 * Commentary: 
 * Initially, I tried to use the orientation method described at
 * https://www.geeksforgeeks.org/check-if-two-given-line-segments-intersect/.
 * However, it required the points to be ordered in a specific manner,
 * and checking the slopes resulted in problems with vertical lines.
 * Moreover, the implementation was significantly more involved and complex.
 * Therefore, the current method of solving a system of equations described by
 * the two lines' vector parametric equations was found and used instead.
 * It solved both prior issues and is easier to implement, only needing
 * some pen-and-paper equation solving to get a result that is largely universal.
 * 
 * Commentary 2:
 * Okay, using a pure matrix mathematical calculation is definitely easier
 * and simpler than solving the equations thru the traditional algebraic method.
 * It also fixed a problem where vertical lines would clip into walls because
 * it was detecting it as colinear to walls even when it's actually not.
 * The last calculation of the (x,y) coords of the intersection is basically
 * that we are cutting a fraction of the line starting from the starting point
 * where the fraction is given by what I call in the code as the "vector parameter".
 * https://blogs.sas.com/content/iml/2018/07/09/intersection-line-segments.html
 */
let intersectionPointOfLines = (line1, line2) => {
    let endXMinusStartXLine1 = line1.endingPoint.x - line1.startingPoint.x
    let endYMinusStartYLine1 = line1.endingPoint.y - line1.startingPoint.y
    
    let startXMinusEndXLine2 = line2.startingPoint.x - line2.endingPoint.x
    let startYMinusEndYLine2 = line2.startingPoint.y - line2.endingPoint.y

    let differenceInOriginsX = line2.startingPoint.x - line1.startingPoint.x
    let differenceInOriginsY = line2.startingPoint.y - line1.startingPoint.y

    let determinant = endXMinusStartXLine1*startYMinusEndYLine2 - startXMinusEndXLine2*endYMinusStartYLine1

    if (determinant === 0) {
        // Matrix of x1,y1,x2,y2 is not invertible (i.e., it is singular)
        return undefined
    }

    let line1DirectionVectorParameter = (1/determinant) * (startYMinusEndYLine2*differenceInOriginsX - startXMinusEndXLine2*differenceInOriginsY)
    let line2DirectionVectorParameter = (1/determinant) * (-endYMinusStartYLine1*differenceInOriginsX + endXMinusStartXLine1*differenceInOriginsY)

    if (
        (line1DirectionVectorParameter < 0 || line1DirectionVectorParameter > 1) ||
        (line2DirectionVectorParameter < 0 || line2DirectionVectorParameter > 1) 
    ) {
        return false
    }

    let intersectionX = line1.startingPoint.x + line1DirectionVectorParameter * (line1.endingPoint.x - line1.startingPoint.x)
    let intersectionY = line1.startingPoint.y + line1DirectionVectorParameter * (line1.endingPoint.y - line1.startingPoint.y)

    return createPoint(intersectionX, intersectionY)
}

class Canvas {
    constructor(canvasSelector) {
        this.canvas = document.querySelector(canvasSelector)
        this.context = this.canvas.getContext('2d')
        this.width = this.canvas.width
        this.height = this.canvas.height
    }
    
    drawRectangle(rectangle, fill=true, colour='white') {
        this.context.fillStyle = colour
        this.context.strokeStyle = colour

        let width = rectangle.bottomRightPoint.x - rectangle.topLeftPoint.x
        let height = rectangle.bottomRightPoint.y - rectangle.topLeftPoint.y

        if (fill) {
            this.context.fillRect(
                rectangle.topLeftPoint.x,
                rectangle.topLeftPoint.y,
                width,
                height
            )
        } else {
            this.context.strokeRect(
                rectangle.topLeftPoint.x,
                rectangle.topLeftPoint.y,
                width,
                height
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

    addEventListener(event, func) {
        this.canvas.addEventListener(event, func)
    }
}

class Raycast {
    constructor(selector2D, selector3D) {
        this.canvas2D = new Canvas(selector2D)
        this.canvas3D = new Canvas(selector3D)

        this.viewPortWidth3DPixels = Math.max(this.canvas3D.height, this.canvas3D.width)

        this.facingDirectionDegrees = 0
        this.fovAngleDegrees = 100
        this.rayMaxDistanceMeters = 20
        this.rayCount = 100
        this.playerStepSizeMeters = 0.5
        this.playerTurnRateDegrees = 5
        this.heightOfWallsMeters = 5

        this.playerEyeLevelHeightMeters = 1.8

        this.playerPosition = createPoint(this.canvas2D.width / 2, this.canvas2D.height / 2)

        this.walls = [createLine(createPoint(270, 100), createPoint(400, 250)),]
        this.wallStartCoordinate = undefined

        this.rayEndPoints = new Array(this.rayCount).fill(0)
        this.update()

        this.canvas2D.addEventListener("keydown", (event) => {this.movePlayer(event)});
        this.canvas2D.addEventListener("mousedown", (event) => {this.addWall(event)})
    }

    addWall(event) {
        if (this.wallStartCoordinate === undefined) {
            this.wallStartCoordinate = createPoint(event.clientX, event.clientY)
        } else {
            let wallEndCoordinates = createPoint(event.clientX, event.clientY)
            this.walls.push(createLine(this.wallStartCoordinate, wallEndCoordinates))
            this.wallStartCoordinate = undefined
            this.update()
        }
    }

    movePlayer(event) {
        if (event.isComposing || event.keyCode === 229) {
            return;
        }

        if (!'wasdqe'.includes(event.key)) {
            return
        }

        if ('wasd'.includes(event.key)) {
            let playerStepSizePixels = metersToPixels(this.playerStepSizeMeters)
            switch(event.key) {
                case 'w':
                    this.playerPosition.y -= playerStepSizePixels
                    break
                case 'a':
                    this.playerPosition.x -= playerStepSizePixels
                    break
                case 's':
                    this.playerPosition.y += playerStepSizePixels
                    break
                case 'd':
                    this.playerPosition.x += playerStepSizePixels
                    break
                default:
                    break
            }

            if (this.playerPosition.x < 0) {
                this.playerPosition.x = 0
            } else if (this.playerPosition.x > this.canvas2D.width) {
                this.playerPosition.x = this.canvas2D.width
            }

            if (this.playerPosition.y < 0) {
                this.playerPosition.y = 0
            } else if (this.playerPosition.y > this.canvas2D.height) {
                this.playerPosition.y = this.canvas2D.height
            }
        }
        
        else {
            switch(event.key) {
                case 'q':
                    this.facingDirectionDegrees -= this.playerTurnRateDegrees
                    break
                case 'e':
                    this.facingDirectionDegrees += this.playerTurnRateDegrees
                    break
                default:
                    break
            }
            this.facingDirectionDegrees %= 360
        }

        this.update()
    }

    updateRays() {
        let startingFOVAngle = this.facingDirectionDegrees - this.fovAngleDegrees / 2
        let angleStep = this.fovAngleDegrees / this.rayCount
        
        for (let rayIndex = 0; rayIndex < this.rayCount; rayIndex++) {
            let rayAngleInRadians = degreeToRadian(startingFOVAngle + rayIndex * angleStep)
            let rayMaxDistancePixels = metersToPixels(this.rayMaxDistanceMeters)
            let maximumDeltaX = rayMaxDistancePixels * Math.cos(rayAngleInRadians)
            let maximumDeltaY = rayMaxDistancePixels * Math.sin(rayAngleInRadians)

            let shortestRayEndPoint = createPoint(this.playerPosition.x + maximumDeltaX, this.playerPosition.y + maximumDeltaY)
            let shortestRayLengthPixels = rayMaxDistancePixels
            let hasHitWall = false

            for (let wallIndex = 0; wallIndex < this.walls.length; wallIndex++) {
                let rayLine = createLine(this.playerPosition, shortestRayEndPoint)
                let intersectionPointBetweenRayAndWall = intersectionPointOfLines(rayLine, this.walls[wallIndex])

                if (!intersectionPointBetweenRayAndWall) {
                    continue
                }

                let rayToIntersectionLengthPixels = lengthOfLineInPixels(createLine(this.playerPosition, intersectionPointBetweenRayAndWall))
                if (rayToIntersectionLengthPixels < shortestRayLengthPixels) {
                    shortestRayEndPoint = intersectionPointBetweenRayAndWall
                    shortestRayLengthPixels = rayToIntersectionLengthPixels
                    hasHitWall = true
                }
                if (rayToIntersectionLengthPixels === 0) {
                    break
                }
            }

            this.rayEndPoints[rayIndex] = createRayEndPoint(shortestRayEndPoint, hasHitWall)
        }
    }
    
    draw2DVisuals() {
        this.canvas2D.fillCanvas()
        this.canvas2D.drawCircle(createCircle(this.playerPosition, 2))
        this.rayEndPoints.forEach((rayEndPoint) => this.canvas2D.drawLine(createLine(this.playerPosition, rayEndPoint.point)))
        this.walls.forEach((wall) => this.canvas2D.drawLine(wall))
    }

    draw3DSliceBasedOnRays() {
        let canvas3DMidPointY = this.canvas3D.height / 2
        let widthOfPerRayViewPortSlice = this.viewPortWidth3DPixels / this.rayCount

        let currentRaySliceStartingX = 0
        this.rayEndPoints.forEach((endPoint) => {
            if (!endPoint.hasHitWall) {
                currentRaySliceStartingX += widthOfPerRayViewPortSlice
                return
            }

            let rayDistanceToWallMeter = pixelsToMeters(lengthOfLineInPixels(createLine(this.playerPosition, endPoint.point)))
            let darknessValue = 255 * (1 - rayDistanceToWallMeter / this.rayMaxDistanceMeters)

            let halfOfFOVMaxMeters = Math.tan(degreeToRadian(this.fovAngleDegrees) / 2) * rayDistanceToWallMeter

            let upperHalfOfWallMeters = this.heightOfWallsMeters - this.playerEyeLevelHeightMeters
            let upperHalfFOVCoverRatio = upperHalfOfWallMeters / halfOfFOVMaxMeters
            let upperHalfOfWallRelativeToViewPortPixels = this.viewPortWidth3DPixels * upperHalfFOVCoverRatio

            this.canvas3D.drawRectangle(
                createRectangle(
                    createPoint(currentRaySliceStartingX, canvas3DMidPointY - upperHalfOfWallRelativeToViewPortPixels),
                    createPoint(currentRaySliceStartingX + widthOfPerRayViewPortSlice, canvas3DMidPointY)
                ),
                true,
                createGrayscaleRGBColour(darknessValue)
            )

            let lowerHalfFOVCoverRatio = this.playerEyeLevelHeightMeters / halfOfFOVMaxMeters
            let lowerHalfOfWallRelativeToViewPortPixels = this.viewPortWidth3DPixels * lowerHalfFOVCoverRatio

            this.canvas3D.drawRectangle(
                createRectangle(
                    createPoint(currentRaySliceStartingX, canvas3DMidPointY),
                    createPoint(currentRaySliceStartingX + widthOfPerRayViewPortSlice, canvas3DMidPointY + lowerHalfOfWallRelativeToViewPortPixels)
                ),
                true,
                createGrayscaleRGBColour(darknessValue)
            )

            currentRaySliceStartingX += widthOfPerRayViewPortSlice
        })
    }

    draw3DVisuals() {
        this.canvas3D.fillCanvas()
        this.draw3DSliceBasedOnRays()
    }

    update() {
        this.updateRays()
        this.draw2DVisuals()
        this.draw3DVisuals()
    }
}

const raycast = new Raycast('#canvas2d', '#canvas3d')
