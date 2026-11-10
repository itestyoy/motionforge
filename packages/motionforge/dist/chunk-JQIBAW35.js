'use client';import { serializeInstructions, reduceInstructions, getBoundingBoxFromInstructions, resetPath } from './chunk-ADMJBRUM.js';

// src/components/shapes/make-shapes.ts
var fail = (fn, message) => {
  throw new Error(`${fn}: ${message}`);
};
var isNumber = (value) => typeof value === "number" && Number.isFinite(value);
var checkMin = (fn, name, value, min, strict = false) => {
  if (!isNumber(value) || (strict ? value <= min : value < min)) {
    fail(fn, `"${name}" must be a finite number ${strict ? ">" : ">="} ${min}, got ${JSON.stringify(value)}`);
  }
};
var checkCorners = (fn, edgeRoundness, cornerRadius) => {
  if (edgeRoundness !== null && !isNumber(edgeRoundness)) {
    fail(fn, `"edgeRoundness" must be a finite number or null, got ${JSON.stringify(edgeRoundness)}`);
  }
  checkMin(fn, "cornerRadius", cornerRadius, 0);
  if (edgeRoundness !== null && cornerRadius !== 0) {
    fail(fn, '"cornerRadius" and "edgeRoundness" cannot be specified at the same time.');
  }
};
var checkOneOf = (fn, name, value, allowed) => {
  if (!allowed.includes(value)) {
    fail(fn, `"${name}" must be one of ${allowed.map((a) => `"${a}"`).join(", ")}, got ${JSON.stringify(value)}`);
  }
  return value;
};
var shortenVector = (vector, radius) => {
  const [x, y] = vector;
  const currentLength = Math.sqrt(x * x + y * y);
  const factor = (currentLength - radius) / currentLength;
  return [x * factor, y * factor];
};
var scaleVectorToLength = (vector, length) => {
  const [x, y] = vector;
  const factor = length / Math.sqrt(x * x + y * y);
  return [x * factor, y * factor];
};
var joinPoints = (points, {
  edgeRoundness,
  cornerRadius,
  roundCornerStrategy
}) => points.flatMap(([x, y], i) => {
  const prevPoint = points[i === 0 ? points.length - 2 : i - 1];
  const nextPoint = points[i === points.length - 1 ? 1 : i + 1];
  const middleOfLine = [(x + nextPoint[0]) / 2, (y + nextPoint[1]) / 2];
  const prevMiddleOfLine = [(x + prevPoint[0]) / 2, (y + prevPoint[1]) / 2];
  const prevVector = [x - prevPoint[0], y - prevPoint[1]];
  const nextVector = [nextPoint[0] - x, nextPoint[1] - y];
  if (i === 0) {
    if (edgeRoundness !== null) return [{ type: "M", x: middleOfLine[0], y: middleOfLine[1] }];
    if (cornerRadius !== 0) {
      const shortened = shortenVector(nextVector, cornerRadius);
      return [{ type: "M", x: shortened[0] + x, y: shortened[1] + y }];
    }
    return [{ type: "M", x, y }];
  }
  if (edgeRoundness === null) {
    if (cornerRadius === 0) return [{ type: "L", x, y }];
    const prevShortened = shortenVector(prevVector, cornerRadius);
    const prevToRadius = scaleVectorToLength(prevVector, cornerRadius);
    const nextToRadius = scaleVectorToLength(nextVector, cornerRadius);
    const firstDraw = [prevPoint[0] + prevShortened[0], prevPoint[1] + prevShortened[1]];
    return [
      { type: "L", x: firstDraw[0], y: firstDraw[1] },
      roundCornerStrategy === "arc" ? {
        type: "a",
        rx: cornerRadius,
        ry: cornerRadius,
        xAxisRotation: 0,
        dx: prevToRadius[0] + nextToRadius[0],
        dy: prevToRadius[1] + nextToRadius[1],
        largeArcFlag: false,
        sweepFlag: true
      } : {
        type: "C",
        x: firstDraw[0] + prevToRadius[0] + nextToRadius[0],
        y: firstDraw[1] + prevToRadius[1] + nextToRadius[1],
        cp1x: x,
        cp1y: y,
        cp2x: x,
        cp2y: y
      }
    ];
  }
  return [
    {
      type: "C",
      cp1x: prevMiddleOfLine[0] + prevVector[0] * edgeRoundness * 0.5,
      cp1y: prevMiddleOfLine[1] + prevVector[1] * edgeRoundness * 0.5,
      cp2x: middleOfLine[0] - nextVector[0] * edgeRoundness * 0.5,
      cp2y: middleOfLine[1] - nextVector[1] * edgeRoundness * 0.5,
      x: middleOfLine[0],
      y: middleOfLine[1]
    }
  ];
});
var makeRect = ({ width, height, edgeRoundness = null, cornerRadius = 0 }) => {
  checkMin("makeRect", "width", width, 0);
  checkMin("makeRect", "height", height, 0);
  checkCorners("makeRect", edgeRoundness, cornerRadius);
  const instructions = [
    ...joinPoints(
      [
        [cornerRadius, 0],
        [width, 0],
        [width, height],
        [0, height],
        [0, 0]
      ],
      { edgeRoundness, cornerRadius, roundCornerStrategy: "arc" }
    ),
    { type: "Z" }
  ];
  return {
    width,
    height,
    instructions,
    path: serializeInstructions(instructions),
    transformOrigin: [width / 2, height / 2].join(" ")
  };
};
var makeCircle = ({ radius }) => {
  checkMin("makeCircle", "radius", radius, 0);
  const instructions = [
    { type: "M", x: radius, y: 0 },
    { type: "a", rx: radius, ry: radius, xAxisRotation: 0, largeArcFlag: true, sweepFlag: true, dx: 0, dy: radius * 2 },
    { type: "a", rx: radius, ry: radius, xAxisRotation: 0, largeArcFlag: true, sweepFlag: true, dx: 0, dy: -radius * 2 },
    { type: "Z" }
  ];
  return {
    height: radius * 2,
    width: radius * 2,
    path: serializeInstructions(instructions),
    instructions,
    transformOrigin: `${radius} ${radius}`
  };
};
var makeEllipse = ({ rx, ry }) => {
  checkMin("makeEllipse", "rx", rx, 0);
  checkMin("makeEllipse", "ry", ry, 0);
  const instructions = [
    { type: "M", x: rx, y: 0 },
    { type: "a", rx, ry, xAxisRotation: 0, largeArcFlag: true, sweepFlag: false, dx: 1, dy: 0 },
    { type: "Z" }
  ];
  return {
    width: rx * 2,
    height: ry * 2,
    path: serializeInstructions(instructions),
    instructions,
    transformOrigin: `${rx} ${ry}`
  };
};
var DIRECTIONS = ["right", "left", "up", "down"];
var makeTriangle = ({
  length,
  direction = "right",
  edgeRoundness = null,
  cornerRadius = 0
}) => {
  checkMin("makeTriangle", "length", length, 0);
  checkOneOf("makeTriangle", "direction", direction, DIRECTIONS);
  checkCorners("makeTriangle", edgeRoundness, cornerRadius);
  const longer = length;
  const shorter = Math.sqrt(length ** 2 * 0.75);
  const points = {
    up: [[longer / 2, 0], [0, shorter], [longer, shorter], [longer / 2, 0]],
    right: [[0, 0], [0, longer], [shorter, longer / 2], [0, 0]],
    down: [[0, 0], [longer, 0], [longer / 2, shorter], [0, 0]],
    left: [[shorter, 0], [shorter, longer], [0, longer / 2], [shorter, 0]]
  };
  const originX = { left: shorter / 3 * 2, right: shorter / 3, up: longer / 2, down: longer / 2 }[direction];
  const originY = { up: shorter / 3 * 2, down: shorter / 3, left: longer / 2, right: longer / 2 }[direction];
  const instructions = [
    ...joinPoints(points[direction], { edgeRoundness, cornerRadius, roundCornerStrategy: "bezier" }),
    { type: "Z" }
  ];
  const vertical = direction === "up" || direction === "down";
  return {
    path: serializeInstructions(instructions),
    instructions,
    width: vertical ? length : shorter,
    height: vertical ? shorter : length,
    transformOrigin: `${originX} ${originY}`
  };
};
var checkPoints = (fn, points) => {
  if (!Number.isInteger(points) || points < 3) {
    fail(fn, `"points" should be an integer, minimum 3, got ${JSON.stringify(points)}`);
  }
};
var closedShape = (instructions, centerX, centerY) => {
  const reduced = reduceInstructions(instructions);
  const box = getBoundingBoxFromInstructions(reduced);
  return {
    path: resetPath(serializeInstructions(reduced)),
    width: box.width,
    height: box.height,
    transformOrigin: `${centerX} ${centerY}`,
    instructions
  };
};
var makeStar = ({
  points,
  innerRadius,
  outerRadius,
  cornerRadius = 0,
  edgeRoundness = null
}) => {
  checkPoints("makeStar", points);
  checkMin("makeStar", "innerRadius", innerRadius, 0);
  checkMin("makeStar", "outerRadius", outerRadius, 0);
  checkCorners("makeStar", edgeRoundness, cornerRadius);
  const centerX = outerRadius;
  const centerY = outerRadius;
  const step = Math.PI * 2 / (points * 2);
  const corners = new Array(points * 2).fill(true).map((_, i) => {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = step * i - Math.PI / 2;
    return [centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle)];
  });
  const instructions = [
    ...joinPoints([...corners, corners[0]], {
      edgeRoundness,
      cornerRadius,
      roundCornerStrategy: cornerRadius > 0 ? "bezier" : "arc"
    }),
    { type: "Z" }
  ];
  return closedShape(instructions, centerX, centerY);
};
var makePolygon = ({ points, radius, cornerRadius = 0, edgeRoundness = null }) => {
  checkPoints("makePolygon", points);
  checkMin("makePolygon", "radius", radius, 0);
  checkCorners("makePolygon", edgeRoundness, cornerRadius);
  const centerX = radius;
  const centerY = radius;
  const step = Math.PI * 2 / points;
  const corners = new Array(points).fill(0).map((_, i) => {
    const angle = step * i - Math.PI / 2;
    return [centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle)];
  });
  const instructions = joinPoints([...corners, corners[0]], {
    edgeRoundness,
    cornerRadius,
    roundCornerStrategy: cornerRadius > 0 ? "bezier" : "arc"
  });
  return closedShape(instructions, centerX, centerY);
};
var makePie = ({
  progress,
  radius,
  closePath = true,
  counterClockwise = false,
  rotation = 0
}) => {
  checkMin("makePie", "radius", radius, 0);
  if (!isNumber(progress)) fail("makePie", `"progress" must be a finite number, got ${JSON.stringify(progress)}`);
  if (!isNumber(rotation)) fail("makePie", `"rotation" must be a finite number, got ${JSON.stringify(rotation)}`);
  if (typeof closePath !== "boolean") fail("makePie", `"closePath" must be a boolean, got ${JSON.stringify(closePath)}`);
  if (typeof counterClockwise !== "boolean") {
    fail("makePie", `"counterClockwise" must be a boolean, got ${JSON.stringify(counterClockwise)}`);
  }
  const actualProgress = Math.min(Math.max(progress, 0), 1);
  const coord = (at, axis) => {
    const factor = counterClockwise ? -1 : 1;
    const value = Math[axis === "x" ? "cos" : "sin"](factor * at * Math.PI * 2 + Math.PI * 1.5 + rotation) * radius + radius;
    return Math.round(value * 1e5) / 1e5;
  };
  const end = { x: coord(actualProgress, "x"), y: coord(actualProgress, "y") };
  const arc = (to) => ({
    type: "A",
    rx: radius,
    ry: radius,
    xAxisRotation: 0,
    largeArcFlag: false,
    sweepFlag: !counterClockwise,
    ...to
  });
  const instructions = [
    { type: "M", x: coord(0, "x"), y: coord(0, "y") },
    arc(actualProgress <= 0.5 ? end : { x: coord(0.5, "x"), y: coord(0.5, "y") })
  ];
  if (actualProgress > 0.5) instructions.push(arc(end));
  if (actualProgress > 0 && actualProgress < 1 && closePath) instructions.push({ type: "L", x: radius, y: radius });
  if (closePath) instructions.push({ type: "Z" });
  return {
    height: radius * 2,
    width: radius * 2,
    path: serializeInstructions(instructions),
    instructions,
    transformOrigin: `${radius} ${radius}`
  };
};
var makeHeart = ({
  height,
  aspectRatio = 1.1,
  bottomRoundnessAdjustment = 0,
  depthAdjustment = 0
}) => {
  checkMin("makeHeart", "height", height, 0);
  checkMin("makeHeart", "aspectRatio", aspectRatio, 0, true);
  if (!isNumber(bottomRoundnessAdjustment)) {
    fail("makeHeart", `"bottomRoundnessAdjustment" must be a finite number, got ${JSON.stringify(bottomRoundnessAdjustment)}`);
  }
  if (!isNumber(depthAdjustment)) {
    fail("makeHeart", `"depthAdjustment" must be a finite number, got ${JSON.stringify(depthAdjustment)}`);
  }
  const width = height * aspectRatio;
  const bottomControlPointX = 23 / 110 * width + bottomRoundnessAdjustment * width;
  const bottomControlPointY = 69 / 100 * height;
  const bottomLeftControlPointY = 60 / 100 * height;
  const topLeftControlPoint = 13 / 100 * height;
  const topBezierWidth = 29 / 110 * width;
  const topRightControlPointX = 15 / 110 * width;
  const innerControlPointX = 5 / 110 * width;
  const innerControlPointY = 7 / 100 * height;
  const depth = 17 / 100 * height + depthAdjustment * height;
  const instructions = [
    { type: "M", x: width / 2, y: height },
    { type: "C", cp1x: width / 2 - bottomControlPointX, cp1y: bottomControlPointY, cp2x: 0, cp2y: bottomLeftControlPointY, x: 0, y: height / 4 },
    { type: "C", cp1x: 0, cp1y: topLeftControlPoint, cp2x: width / 4 - topBezierWidth / 2, cp2y: 0, x: width / 4, y: 0 },
    {
      type: "C",
      cp1x: width / 4 + topBezierWidth / 2,
      cp1y: 0,
      cp2x: width / 2 - innerControlPointX,
      cp2y: innerControlPointY,
      x: width / 2,
      y: depth
    },
    {
      type: "C",
      cp1x: width / 2 + innerControlPointX,
      cp1y: innerControlPointY,
      cp2x: width / 2 + topRightControlPointX,
      cp2y: 0,
      x: width / 4 * 3,
      y: 0
    },
    { type: "C", cp1x: width / 4 * 3 + topBezierWidth / 2, cp1y: 0, cp2x: width, cp2y: topLeftControlPoint, x: width, y: height / 4 },
    {
      type: "C",
      x: width / 2,
      y: height,
      cp1x: width,
      cp1y: bottomLeftControlPointY,
      cp2x: width / 2 + bottomControlPointX,
      cp2y: bottomControlPointY
    },
    { type: "Z" }
  ];
  return {
    path: serializeInstructions(instructions),
    width,
    height,
    transformOrigin: `${width / 2} ${height / 2}`,
    instructions
  };
};
var unitDirection = (from, to) => {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const length = Math.sqrt(dx * dx + dy * dy);
  return length === 0 ? [0, 0] : [dx / length, dy / length];
};
var makeArrow = ({
  length = 300,
  headWidth = 185,
  headLength = 120,
  shaftWidth = 80,
  direction = "right",
  cornerRadius = 0
}) => {
  for (const [name, value] of [
    ["length", length],
    ["headWidth", headWidth],
    ["headLength", headLength],
    ["shaftWidth", shaftWidth]
  ]) {
    checkMin("makeArrow", name, value, 0, true);
  }
  checkMin("makeArrow", "cornerRadius", cornerRadius, 0);
  checkOneOf("makeArrow", "direction", direction, DIRECTIONS);
  if (headWidth < shaftWidth) {
    fail("makeArrow", `"headWidth" must be greater than or equal to "shaftWidth", got headWidth=${headWidth} and shaftWidth=${shaftWidth}`);
  }
  if (headLength > length) {
    fail("makeArrow", `"headLength" must be less than or equal to "length", got headLength=${headLength} and length=${length}`);
  }
  const shaftTop = (headWidth - shaftWidth) / 2;
  const shaftBottom = shaftTop + shaftWidth;
  const shaftEnd = length - headLength;
  const rightPoints = [
    [0, shaftTop],
    [shaftEnd, shaftTop],
    [shaftEnd, 0],
    [length, headWidth / 2],
    [shaftEnd, headWidth],
    [shaftEnd, shaftBottom],
    [0, shaftBottom]
  ];
  const horizontal = direction === "right" || direction === "left";
  const points = direction === "right" ? rightPoints : direction === "left" ? rightPoints.map(([x, y]) => [length - x, y]) : direction === "down" ? [
    [shaftTop, 0],
    [shaftBottom, 0],
    [shaftBottom, shaftEnd],
    [headWidth, shaftEnd],
    [headWidth / 2, length],
    [0, shaftEnd],
    [shaftTop, shaftEnd]
  ] : [
    [shaftTop, length],
    [shaftBottom, length],
    [shaftBottom, headLength],
    [headWidth, headLength],
    [headWidth / 2, 0],
    [0, headLength],
    [shaftTop, headLength]
  ];
  const width = horizontal ? length : headWidth;
  const height = horizontal ? headWidth : length;
  const rounded = horizontal ? /* @__PURE__ */ new Set([0, 2, 3, 4, 6]) : /* @__PURE__ */ new Set([0, 1, 3, 4, 5]);
  let instructions;
  if (cornerRadius === 0) {
    instructions = [
      { type: "M", x: points[0][0], y: points[0][1] },
      ...points.slice(1).map(([x, y]) => ({ type: "L", x, y })),
      { type: "Z" }
    ];
  } else {
    const n = points.length;
    const d0 = unitDirection(points[0], points[1]);
    const startX = points[0][0] + d0[0] * cornerRadius;
    const startY = points[0][1] + d0[1] * cornerRadius;
    instructions = [{ type: "M", x: startX, y: startY }];
    for (let i = 1; i < n; i++) {
      const current = points[i];
      if (!rounded.has(i)) {
        instructions.push({ type: "L", x: current[0], y: current[1] });
        continue;
      }
      const dIn = unitDirection(points[i - 1], current);
      const dOut = unitDirection(current, points[(i + 1) % n]);
      instructions.push(
        { type: "L", x: current[0] - dIn[0] * cornerRadius, y: current[1] - dIn[1] * cornerRadius },
        {
          type: "C",
          cp1x: current[0],
          cp1y: current[1],
          cp2x: current[0],
          cp2y: current[1],
          x: current[0] + dOut[0] * cornerRadius,
          y: current[1] + dOut[1] * cornerRadius
        }
      );
    }
    const dIn0 = unitDirection(points[n - 1], points[0]);
    instructions.push(
      { type: "L", x: points[0][0] - dIn0[0] * cornerRadius, y: points[0][1] - dIn0[1] * cornerRadius },
      { type: "C", cp1x: points[0][0], cp1y: points[0][1], cp2x: points[0][0], cp2y: points[0][1], x: startX, y: startY },
      { type: "Z" }
    );
  }
  return {
    path: serializeInstructions(instructions),
    instructions,
    width,
    height,
    transformOrigin: `${width / 2} ${height / 2}`
  };
};
var KAPPA = 0.5522847498307936;
var CAP_HANDLE = 4 / 3;
var curve = (to, cp1, cp2) => ({
  type: "C",
  cp1x: cp1[0],
  cp1y: cp1[1],
  cp2x: cp2[0],
  cp2y: cp2[1],
  x: to[0],
  y: to[1]
});
var sparkCap = (from, to, radius, direction) => {
  const h = radius * CAP_HANDLE;
  switch (direction) {
    case "top":
      return curve(to, [from[0], from[1] - h], [to[0], to[1] - h]);
    case "right":
      return curve(to, [from[0] + h, from[1]], [to[0] + h, to[1]]);
    case "bottom":
      return curve(to, [from[0], from[1] + h], [to[0], to[1] + h]);
    default:
      return curve(to, [from[0] - h, from[1]], [to[0] - h, to[1]]);
  }
};
var sparkEdge = (from, to, edgeRoundness, direction) => {
  const handleX = Math.abs(to[0] - from[0]) * KAPPA * edgeRoundness;
  const handleY = Math.abs(to[1] - from[1]) * KAPPA * edgeRoundness;
  switch (direction) {
    case "top-right":
      return curve(to, [from[0], from[1] + handleY], [to[0] - handleX, to[1]]);
    case "right-bottom":
      return curve(to, [from[0] - handleX, from[1]], [to[0], to[1] - handleY]);
    case "bottom-left":
      return curve(to, [from[0], from[1] - handleY], [to[0] + handleX, to[1]]);
    default:
      return curve(to, [from[0] + handleX, from[1]], [to[0], to[1] + handleY]);
  }
};
var makeSpark = ({ width, height, edgeRoundness = 1, cornerRadius = 0 }) => {
  checkMin("makeSpark", "width", width, 0);
  checkMin("makeSpark", "height", height, 0);
  if (!isNumber(edgeRoundness)) fail("makeSpark", `"edgeRoundness" must be a finite number, got ${JSON.stringify(edgeRoundness)}`);
  if (!isNumber(cornerRadius)) fail("makeSpark", `"cornerRadius" must be a finite number, got ${JSON.stringify(cornerRadius)}`);
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(Math.max(cornerRadius, 0), width / 2, height / 2);
  const sharp = radius === 0;
  const topRight = sharp ? [centerX, 0] : [centerX + radius, radius];
  const rightTop = sharp ? [width, centerY] : [width - radius, centerY - radius];
  const rightBottom = sharp ? [width, centerY] : [width - radius, centerY + radius];
  const bottomRight = sharp ? [centerX, height] : [centerX + radius, height - radius];
  const bottomLeft = sharp ? [centerX, height] : [centerX - radius, height - radius];
  const leftBottom = sharp ? [0, centerY] : [radius, centerY + radius];
  const leftTop = sharp ? [0, centerY] : [radius, centerY - radius];
  const topLeft = sharp ? [centerX, 0] : [centerX - radius, radius];
  const instructions = [
    { type: "M", x: topRight[0], y: topRight[1] },
    sparkEdge(topRight, rightTop, edgeRoundness, "top-right")
  ];
  if (!sharp) instructions.push(sparkCap(rightTop, rightBottom, radius, "right"));
  instructions.push(sparkEdge(rightBottom, bottomRight, edgeRoundness, "right-bottom"));
  if (!sharp) instructions.push(sparkCap(bottomRight, bottomLeft, radius, "bottom"));
  instructions.push(sparkEdge(bottomLeft, leftBottom, edgeRoundness, "bottom-left"));
  if (!sharp) instructions.push(sparkCap(leftBottom, leftTop, radius, "left"));
  instructions.push(sparkEdge(leftTop, topLeft, edgeRoundness, "left-top"));
  if (!sharp) instructions.push(sparkCap(topLeft, topRight, radius, "top"));
  instructions.push({ type: "Z" });
  return {
    path: serializeInstructions(instructions),
    width,
    height,
    transformOrigin: `${centerX} ${centerY}`,
    instructions
  };
};
var samePoint = (a, b) => a[0] === b[0] && a[1] === b[1];
var normalizeClosedPoints = (points) => {
  const deduplicated = points.reduce((acc, entry) => {
    const previous = acc[acc.length - 1];
    if (previous && samePoint(previous.point, entry.point)) {
      acc[acc.length - 1] = { point: previous.point, round: previous.round && entry.round };
      return acc;
    }
    return [...acc, entry];
  }, []);
  const first = deduplicated[0];
  const last = deduplicated[deduplicated.length - 1];
  if (samePoint(first.point, last.point)) {
    const merged = { point: first.point, round: first.round && last.round };
    return [merged, ...deduplicated.slice(1, -1), merged];
  }
  return [...deduplicated, first];
};
var makeCallout = ({
  width = 500,
  height = 200,
  pointerLength = 40,
  pointerBaseWidth = 60,
  pointerPosition = 0.5,
  pointerDirection = "down",
  edgeRoundness = null,
  cornerRadius = 0
}) => {
  for (const [name, value] of [
    ["width", width],
    ["height", height],
    ["pointerLength", pointerLength],
    ["pointerBaseWidth", pointerBaseWidth]
  ]) {
    checkMin("makeCallout", name, value, 0, true);
  }
  if (!isNumber(pointerPosition) || pointerPosition < 0 || pointerPosition > 1) {
    fail("makeCallout", `"pointerPosition" must be a number between 0 and 1, got ${JSON.stringify(pointerPosition)}`);
  }
  checkOneOf("makeCallout", "pointerDirection", pointerDirection, ["up", "down", "left", "right"]);
  checkCorners("makeCallout", edgeRoundness, cornerRadius);
  const interval = (available) => {
    const center = available * pointerPosition;
    return {
      center,
      start: Math.max(0, center - pointerBaseWidth / 2),
      end: Math.min(available, center + pointerBaseWidth / 2)
    };
  };
  const h = interval(width);
  const v = interval(height);
  const byDirection = {
    up: [
      { point: [0, pointerLength], round: true },
      { point: [h.start, pointerLength], round: false },
      { point: [h.center, 0], round: false },
      { point: [h.end, pointerLength], round: false },
      { point: [width, pointerLength], round: true },
      { point: [width, height + pointerLength], round: true },
      { point: [0, height + pointerLength], round: true },
      { point: [0, pointerLength], round: true }
    ],
    down: [
      { point: [0, 0], round: true },
      { point: [width, 0], round: true },
      { point: [width, height], round: true },
      { point: [h.end, height], round: false },
      { point: [h.center, height + pointerLength], round: false },
      { point: [h.start, height], round: false },
      { point: [0, height], round: true },
      { point: [0, 0], round: true }
    ],
    left: [
      { point: [pointerLength, 0], round: true },
      { point: [width + pointerLength, 0], round: true },
      { point: [width + pointerLength, height], round: true },
      { point: [pointerLength, height], round: true },
      { point: [pointerLength, v.end], round: false },
      { point: [0, v.center], round: false },
      { point: [pointerLength, v.start], round: false },
      { point: [pointerLength, 0], round: true }
    ],
    right: [
      { point: [0, 0], round: true },
      { point: [width, 0], round: true },
      { point: [width, v.start], round: false },
      { point: [width + pointerLength, v.center], round: false },
      { point: [width, v.end], round: false },
      { point: [width, height], round: true },
      { point: [0, height], round: true },
      { point: [0, 0], round: true }
    ]
  };
  const points = normalizeClosedPoints(byDirection[pointerDirection]);
  let instructions;
  if (edgeRoundness !== null || cornerRadius === 0) {
    instructions = [
      ...joinPoints(
        points.map((p) => p.point),
        { edgeRoundness, cornerRadius, roundCornerStrategy: "arc" }
      ),
      { type: "Z" }
    ];
  } else {
    const unique = samePoint(points[0].point, points[points.length - 1].point) ? points.slice(0, -1) : points;
    const first = unique[0];
    const startDirection = first.round ? unitDirection(unique[0].point, unique[1].point) : null;
    const start = startDirection ? [first.point[0] + startDirection[0] * cornerRadius, first.point[1] + startDirection[1] * cornerRadius] : first.point;
    instructions = [{ type: "M", x: start[0], y: start[1] }];
    const roundCorner = (corner, incoming, outgoing) => {
      instructions.push(
        { type: "L", x: corner[0] - incoming[0] * cornerRadius, y: corner[1] - incoming[1] * cornerRadius },
        {
          type: "a",
          rx: cornerRadius,
          ry: cornerRadius,
          xAxisRotation: 0,
          dx: incoming[0] * cornerRadius + outgoing[0] * cornerRadius,
          dy: incoming[1] * cornerRadius + outgoing[1] * cornerRadius,
          largeArcFlag: false,
          sweepFlag: true
        }
      );
    };
    for (let i = 1; i < unique.length; i++) {
      const current = unique[i];
      if (!current.round) {
        instructions.push({ type: "L", x: current.point[0], y: current.point[1] });
        continue;
      }
      roundCorner(
        current.point,
        unitDirection(unique[i - 1].point, current.point),
        unitDirection(current.point, unique[(i + 1) % unique.length].point)
      );
    }
    if (first.round && startDirection) {
      roundCorner(first.point, unitDirection(unique[unique.length - 1].point, first.point), startDirection);
    }
    instructions.push({ type: "Z" });
  }
  const vertical = pointerDirection === "up" || pointerDirection === "down";
  const bodyX = pointerDirection === "left" ? pointerLength : 0;
  const bodyY = pointerDirection === "up" ? pointerLength : 0;
  return {
    width: vertical ? width : width + pointerLength,
    height: vertical ? height + pointerLength : height,
    instructions,
    path: serializeInstructions(instructions),
    transformOrigin: `${bodyX + width / 2} ${bodyY + height / 2}`
  };
};

export { makeArrow, makeCallout, makeCircle, makeEllipse, makeHeart, makePie, makePolygon, makeRect, makeSpark, makeStar, makeTriangle };
//# sourceMappingURL=chunk-JQIBAW35.js.map
//# sourceMappingURL=chunk-JQIBAW35.js.map