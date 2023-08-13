# DabbleIn3D
Let's try to make some simple 3D views for fun

# Controls
WASD to move up, down, left, right in the 2D plane.
QE rotates (I kinda forgot which direction they correspond to, just try them :p)
Add walls by clicking at two different points on the 2D screen.

# The maths
You have a player location. They see through a bunch of rays.
Each ray hits a wall at some location OR they don't hit anything. Whether they hit, i.e, intersect is determined by a matrix-vector solution.

To convert the 2D info to a 3D render, we use the distance from a ray to the wall it hit and the field of view.
Each ray will divide the horizontal field of view equally.
For the vertical space, it is more complicated.
First, we find how high we can theoretically see at that distance given our field of view above and below our eye level. In other words, we find 1/2 of the height of a pole that would precisely span our field of view x meters away.
Then, we find how tall the wall is above and below our eye level given our walls are all equally tall.
Following that, we then find the ratio between these two values, i.e., how much our theoretical max see-able height at x meters away is covered by that wall given as a percent. Note that this value is calculated separately for the two halves of our field of view above and below the eye level so we can adjust our own height (eye level), let's say they are each p1% and p2%.
Lastly, we fill in p1% of the pixels above and p2% of the pixels below the vertical midway point starting from the midway point. In addition, the colour of the fill darkens as the distance grows to give depth. This darkness amount is a number between 0 and 255.
