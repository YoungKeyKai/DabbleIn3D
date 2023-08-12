let degreeToRadian = (degrees) => degrees * Math.PI / 180
let radianToDegree = (radians) => radians * 180 / Math.PI

let createPoint = (x, y) => {
    return {x, y}
}

let createLine = (startingPoint, endingPoint) => {
    return {startingPoint, endingPoint}
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

    addEventListener(event, func) {
        this.canvas.addEventListener(event, func)
    }
}

class Raycast2D {
    constructor(canvasSelector) {
        this.canvas = new Canvas(canvasSelector)

        this.facingDirectionDegrees = 0
        this.fovAngleDegrees = 100
        this.rayMaxDistance = 100
        this.rayCount = 50
        this.playerStepSize = 2
        this.playerTurnRate = 5

        this.playerPosition = createPoint(this.canvas.width / 2, this.canvas.height / 2)

        this.walls = [createLine(createPoint(270, 100), createPoint(400, 250)),]
        this.wallStartCoordinate = undefined

        this.rayEndPoints = new Array(this.rayCount).fill(0)
        this.updateRays()
        this.drawVisuals()
        
        this.canvas.addEventListener("keydown", (event) => {this.movePlayer(event)});
        this.canvas.addEventListener("mousedown", (event) => {this.addWall(event)})
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
                if (rayToIntersectionLength === 0) {
                    break
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
            switch(event.key) {
                case 'w':
                    this.playerPosition.y -= this.playerStepSize
                    break
                case 'a':
                    this.playerPosition.x -= this.playerStepSize
                    break
                case 's':
                    this.playerPosition.y += this.playerStepSize
                    break
                case 'd':
                    this.playerPosition.x += this.playerStepSize
                    break
                default:
                    break
            }

            if (this.playerPosition.x < 0) {
                this.playerPosition.x = 0
            } else if (this.playerPosition.x > this.canvas.width) {
                this.playerPosition.x = this.canvas.width
            }

            if (this.playerPosition.y < 0) {
                this.playerPosition.y = 0
            } else if (this.playerPosition.y > this.canvas.height) {
                this.playerPosition.y = this.canvas.height
            }
        }
        
        else {
            switch(event.key) {
                case 'q':
                    this.facingDirectionDegrees -= this.playerTurnRate
                    break
                case 'e':
                    this.facingDirectionDegrees += this.playerTurnRate
                    break
                default:
                    break
            }
            this.facingDirectionDegrees %= 360
        }

        this.update()
    }

    update() {
        this.updateRays()
        this.drawVisuals()
    }
}

const raycast2D = new Raycast2D('#canvas2d')