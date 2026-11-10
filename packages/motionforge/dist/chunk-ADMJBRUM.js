'use client';// src/utils/path/instructions.ts
var FIELDS = {
  M: ["x", "y"],
  m: ["dx", "dy"],
  L: ["x", "y"],
  l: ["dx", "dy"],
  H: ["x"],
  h: ["dx"],
  V: ["y"],
  v: ["dy"],
  C: ["cp1x", "cp1y", "cp2x", "cp2y", "x", "y"],
  c: ["cp1dx", "cp1dy", "cp2dx", "cp2dy", "dx", "dy"],
  S: ["cpx", "cpy", "x", "y"],
  s: ["cpdx", "cpdy", "dx", "dy"],
  Q: ["cpx", "cpy", "x", "y"],
  q: ["cpdx", "cpdy", "dx", "dy"],
  T: ["x", "y"],
  t: ["dx", "dy"],
  A: ["rx", "ry", "xAxisRotation", "largeArcFlag", "sweepFlag", "x", "y"],
  a: ["rx", "ry", "xAxisRotation", "largeArcFlag", "sweepFlag", "dx", "dy"],
  Z: []
};
var NUMBER = /[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/y;
var isSeparator = (char) => char === "," || char === " " || char === "	" || char === "\n" || char === "\r" || char === "\f";
var parsePath = (path) => {
  if (typeof path !== "string") {
    throw new Error(`parsePath: the path must be a string, got ${JSON.stringify(path)}`);
  }
  const d = path;
  let i = 0;
  const fail = (message) => {
    throw new Error(`parsePath: ${message} at position ${i} of "${d.length > 80 ? d.slice(0, 77) + "..." : d}"`);
  };
  const skipSeparators = () => {
    while (i < d.length && isSeparator(d[i])) i++;
  };
  const number = () => {
    skipSeparators();
    NUMBER.lastIndex = i;
    const match = NUMBER.exec(d);
    if (!match) return fail("expected a number");
    i = NUMBER.lastIndex;
    return parseFloat(match[0]);
  };
  const flag = () => {
    skipSeparators();
    if (d[i] === "0" || d[i] === "1") return d[i++] === "1";
    return fail("expected an arc flag (0 or 1)");
  };
  const numberAhead = () => {
    skipSeparators();
    return i < d.length && /[0-9.+-]/.test(d[i]);
  };
  const instructions = [];
  let command = null;
  for (; ; ) {
    skipSeparators();
    if (i >= d.length) break;
    const char = d[i];
    if (char in FIELDS || char === "z") {
      command = char === "z" ? "Z" : char;
      i++;
    } else if (command === null) {
      fail("a path must start with M or m");
    } else if (command === "Z") {
      fail(`expected a command after Z, got "${char}"`);
    } else if (!/[0-9.+-]/.test(char)) {
      fail(`unexpected "${char}"`);
    }
    if (instructions.length === 0 && command !== "M" && command !== "m") fail("a path must start with M or m");
    const type = command;
    const instruction = { type };
    for (const field of FIELDS[type]) {
      instruction[field] = field === "largeArcFlag" || field === "sweepFlag" ? flag() : number();
    }
    instructions.push(instruction);
    if (type === "M") command = "L";
    if (type === "m") command = "l";
    if (type !== "Z" && !numberAhead() && i < d.length && !(d[i] in FIELDS) && d[i] !== "z") {
      fail(`unexpected "${d[i]}"`);
    }
  }
  if (instructions.length === 0) {
    throw new Error("parsePath: the path is empty; it must start with M or m");
  }
  return instructions;
};
var checkInstruction = (fn, instruction, index) => {
  const type = instruction?.type;
  if (typeof instruction !== "object" || instruction === null || typeof type !== "string" || !(type in FIELDS)) {
    throw new Error(`${fn}: instructions[${index}] is not a path instruction, got ${JSON.stringify(instruction)}`);
  }
  for (const field of FIELDS[type]) {
    const value = instruction[field];
    const ok = field === "largeArcFlag" || field === "sweepFlag" ? typeof value === "boolean" : typeof value === "number" && Number.isFinite(value);
    if (!ok) {
      throw new Error(
        `${fn}: instructions[${index}] (${type}) needs ${field} as a ${field.endsWith("Flag") ? "boolean" : "finite number"}, got ${JSON.stringify(value)}`
      );
    }
  }
  return instruction;
};
var checkInstructions = (fn, instructions) => {
  if (!Array.isArray(instructions)) {
    throw new Error(`${fn}: expected an array of instructions, got ${JSON.stringify(instructions)}`);
  }
  instructions.forEach((instruction, index) => checkInstruction(fn, instruction, index));
  return instructions;
};
var serializeInstruction = (instruction) => {
  const values = FIELDS[instruction.type].map((field) => {
    const value = instruction[field];
    return typeof value === "boolean" ? Number(value) : value;
  });
  return [instruction.type, ...values].join(" ");
};
var serializeInstructions = (path) => checkInstructions("serializeInstructions", path).map(serializeInstruction).join(" ");
var normalizeInstructions = (instructions) => {
  const normalized = [];
  let x = 0;
  let y = 0;
  let moveX = 0;
  let moveY = 0;
  for (const instruction of instructions) {
    switch (instruction.type) {
      case "M":
      case "L":
      case "C":
      case "S":
      case "Q":
      case "T":
      case "A":
        normalized.push(instruction);
        x = instruction.x;
        y = instruction.y;
        if (instruction.type === "M") {
          moveX = x;
          moveY = y;
        }
        break;
      case "H":
        normalized.push(instruction);
        x = instruction.x;
        break;
      case "V":
        normalized.push(instruction);
        y = instruction.y;
        break;
      case "Z":
        normalized.push(instruction);
        x = moveX;
        y = moveY;
        break;
      case "h":
        x += instruction.dx;
        normalized.push({ type: "H", x });
        break;
      case "v":
        y += instruction.dy;
        normalized.push({ type: "V", y });
        break;
      default: {
        const startX = x;
        const startY = y;
        x += instruction.dx;
        y += instruction.dy;
        switch (instruction.type) {
          case "m":
            moveX = x;
            moveY = y;
            normalized.push({ type: "M", x, y });
            break;
          case "l":
            normalized.push({ type: "L", x, y });
            break;
          case "t":
            normalized.push({ type: "T", x, y });
            break;
          case "c":
            normalized.push({
              type: "C",
              cp1x: startX + instruction.cp1dx,
              cp1y: startY + instruction.cp1dy,
              cp2x: startX + instruction.cp2dx,
              cp2y: startY + instruction.cp2dy,
              x,
              y
            });
            break;
          case "s":
            normalized.push({ type: "S", cpx: startX + instruction.cpdx, cpy: startY + instruction.cpdy, x, y });
            break;
          case "q":
            normalized.push({ type: "Q", cpx: startX + instruction.cpdx, cpy: startY + instruction.cpdy, x, y });
            break;
          case "a":
            normalized.push({
              type: "A",
              rx: instruction.rx,
              ry: instruction.ry,
              xAxisRotation: instruction.xAxisRotation,
              largeArcFlag: instruction.largeArcFlag,
              sweepFlag: instruction.sweepFlag,
              x,
              y
            });
            break;
        }
      }
    }
  }
  return normalized;
};
var normalizePath = (path) => serializeInstructions(normalizeInstructions(parsePath(path)));
var getEndPosition = (instructions) => {
  const normalized = normalizeInstructions(instructions);
  let x = 0;
  let y = 0;
  let moveX = 0;
  let moveY = 0;
  for (const instruction of normalized) {
    if (instruction.type === "Z") {
      x = moveX;
      y = moveY;
    } else if (instruction.type === "H") {
      x = instruction.x;
    } else if (instruction.type === "V") {
      y = instruction.y;
    } else {
      x = instruction.x;
      y = instruction.y;
      if (instruction.type === "M") {
        moveX = x;
        moveY = y;
      }
    }
  }
  return { x, y };
};
var quadToCubic = (start, cpx, cpy, x, y) => ({
  type: "C",
  cp1x: start.x + 2 / 3 * (cpx - start.x),
  cp1y: start.y + 2 / 3 * (cpy - start.y),
  cp2x: x + 2 / 3 * (cpx - x),
  cp2y: y + 2 / 3 * (cpy - y),
  x,
  y
});
var arcToCubics = (x1, y1, radiusX, radiusY, rotationDegrees, largeArc, sweep, x2, y2) => {
  const phi = rotationDegrees * (Math.PI * 2) / 360;
  const sin = Math.sin(phi);
  const cos = Math.cos(phi);
  const x1p = cos * (x1 - x2) / 2 + sin * (y1 - y2) / 2;
  const y1p = -sin * (x1 - x2) / 2 + cos * (y1 - y2) / 2;
  if (x1p === 0 && y1p === 0 || radiusX === 0 || radiusY === 0) return [];
  let rx = Math.abs(radiusX);
  let ry = Math.abs(radiusY);
  const lambda = x1p * x1p / (rx * rx) + y1p * y1p / (ry * ry);
  if (lambda > 1) {
    rx *= Math.sqrt(lambda);
    ry *= Math.sqrt(lambda);
  }
  const rxSq = rx * rx;
  const rySq = ry * ry;
  const x1pSq = x1p * x1p;
  const y1pSq = y1p * y1p;
  const radicand = Math.max(0, rxSq * rySq - rxSq * y1pSq - rySq * x1pSq) / (rxSq * y1pSq + rySq * x1pSq);
  const coefficient = Math.sqrt(radicand) * (largeArc === sweep ? -1 : 1);
  const cxp = coefficient * rx / ry * y1p;
  const cyp = coefficient * -ry / rx * x1p;
  const cx = cos * cxp - sin * cyp + (x1 + x2) / 2;
  const cy = sin * cxp + cos * cyp + (y1 + y2) / 2;
  const angle = (ux, uy, vx, vy) => {
    const sign = ux * vy - uy * vx < 0 ? -1 : 1;
    return sign * Math.acos(Math.max(-1, Math.min(1, ux * vx + uy * vy)));
  };
  const v1x = (x1p - cxp) / rx;
  const v1y = (y1p - cyp) / ry;
  const v2x = (-x1p - cxp) / rx;
  const v2y = (-y1p - cyp) / ry;
  let theta = angle(1, 0, v1x, v1y);
  let delta = angle(v1x, v1y, v2x, v2y);
  if (!sweep && delta > 0) delta -= 2 * Math.PI;
  if (sweep && delta < 0) delta += 2 * Math.PI;
  const count = Math.max(Math.ceil(Math.abs(delta) / (Math.PI / 2)), 1);
  delta /= count;
  const alpha = 4 / 3 * Math.tan(delta / 4);
  const map = (ux, uy) => {
    const px = ux * rx;
    const py = uy * ry;
    return [cos * px - sin * py + cx, sin * px + cos * py + cy];
  };
  const curves = [];
  for (let k = 0; k < count; k++) {
    const ax = Math.cos(theta);
    const ay = Math.sin(theta);
    const bx = Math.cos(theta + delta);
    const by = Math.sin(theta + delta);
    const [cp1x, cp1y] = map(ax - ay * alpha, ay + ax * alpha);
    const [cp2x, cp2y] = map(bx + by * alpha, by - bx * alpha);
    const [x, y] = map(bx, by);
    curves.push({ type: "C", cp1x, cp1y, cp2x, cp2y, x, y });
    theta += delta;
  }
  return curves;
};
var reduceInstructions = (instruction) => {
  const normalized = normalizeInstructions(checkInstructions("reduceInstructions", instruction));
  const reduced = [];
  let x = 0;
  let y = 0;
  let moveX = 0;
  let moveY = 0;
  let cubicControl = null;
  let quadControl = null;
  for (const segment of normalized) {
    let nextCubic = null;
    let nextQuad = null;
    switch (segment.type) {
      case "M":
        reduced.push(segment);
        moveX = segment.x;
        moveY = segment.y;
        break;
      case "L":
        reduced.push(segment);
        break;
      case "Z":
        reduced.push(segment);
        break;
      case "H":
        reduced.push({ type: "L", x: segment.x, y });
        break;
      case "V":
        reduced.push({ type: "L", x, y: segment.y });
        break;
      case "C":
        reduced.push(segment);
        nextCubic = { x: segment.cp2x, y: segment.cp2y };
        break;
      case "S": {
        const cp1 = cubicControl ? { x: 2 * x - cubicControl.x, y: 2 * y - cubicControl.y } : { x, y };
        reduced.push({ type: "C", cp1x: cp1.x, cp1y: cp1.y, cp2x: segment.cpx, cp2y: segment.cpy, x: segment.x, y: segment.y });
        nextCubic = { x: segment.cpx, y: segment.cpy };
        break;
      }
      case "Q":
        reduced.push(quadToCubic({ x, y }, segment.cpx, segment.cpy, segment.x, segment.y));
        nextQuad = { x: segment.cpx, y: segment.cpy };
        break;
      case "T": {
        const control = quadControl ? { x: 2 * x - quadControl.x, y: 2 * y - quadControl.y } : { x, y };
        reduced.push(quadToCubic({ x, y }, control.x, control.y, segment.x, segment.y));
        nextQuad = control;
        break;
      }
      case "A": {
        const curves = arcToCubics(
          x,
          y,
          segment.rx,
          segment.ry,
          segment.xAxisRotation,
          segment.largeArcFlag,
          segment.sweepFlag,
          segment.x,
          segment.y
        );
        reduced.push(...curves.length === 0 ? [{ type: "L", x: segment.x, y: segment.y }] : curves);
        break;
      }
    }
    cubicControl = nextCubic;
    quadControl = nextQuad;
    if (segment.type === "Z") {
      x = moveX;
      y = moveY;
    } else if (segment.type === "H") {
      x = segment.x;
    } else if (segment.type === "V") {
      y = segment.y;
    } else {
      x = segment.x;
      y = segment.y;
    }
  }
  return reduced;
};

// src/utils/path/geometry.ts
var GAUSS_ORDER = 12;
var [GAUSS_X, GAUSS_W] = (() => {
  const xs = [];
  const ws = [];
  for (let i = 1; i <= GAUSS_ORDER; i++) {
    let x = Math.cos(Math.PI * (i - 0.25) / (GAUSS_ORDER + 0.5));
    let derivative = 0;
    for (let iteration = 0; iteration < 100; iteration++) {
      let p0 = 1;
      let p1 = x;
      for (let k = 2; k <= GAUSS_ORDER; k++) {
        const p2 = ((2 * k - 1) * x * p1 - (k - 1) * p0) / k;
        p0 = p1;
        p1 = p2;
      }
      derivative = GAUSS_ORDER * (x * p1 - p0) / (x * x - 1);
      const step = p1 / derivative;
      x -= step;
      if (Math.abs(step) < 1e-16) break;
    }
    xs.push(x);
    ws.push(2 / ((1 - x * x) * derivative * derivative));
  }
  return [xs, ws];
})();
var integrate = (speed, a, b) => {
  const half = (b - a) / 2;
  const mid = (a + b) / 2;
  let sum = 0;
  for (let i = 0; i < GAUSS_ORDER; i++) sum += GAUSS_W[i] * speed(mid + half * GAUSS_X[i]);
  return sum * half;
};
var PIECES = 16;
var curveSegment = (point, derivative) => {
  const speed = (t) => {
    const d = derivative(t);
    return Math.hypot(d.x, d.y);
  };
  const cumulative = [0];
  for (let k = 0; k < PIECES; k++) {
    cumulative.push(cumulative[k] + integrate(speed, k / PIECES, (k + 1) / PIECES));
  }
  const length = cumulative[PIECES];
  return {
    length,
    point,
    derivative,
    tAtLength(s) {
      if (s <= 0) return 0;
      if (s >= length) return 1;
      let k = 0;
      while (k < PIECES - 1 && cumulative[k + 1] < s) k++;
      const a = k / PIECES;
      const target = s - cumulative[k];
      const pieceLength = cumulative[k + 1] - cumulative[k];
      let lo = a;
      let hi = (k + 1) / PIECES;
      let t = pieceLength > 0 ? a + target / pieceLength * (hi - lo) : a;
      for (let iteration = 0; iteration < 60; iteration++) {
        const error = integrate(speed, a, t) - target;
        if (Math.abs(error) <= 1e-12 * Math.max(1, length)) break;
        if (error > 0) hi = t;
        else lo = t;
        const v = speed(t);
        const next = v > 0 ? t - error / v : NaN;
        t = next > lo && next < hi ? next : (lo + hi) / 2;
        if (hi - lo < 1e-15) break;
      }
      return t;
    }
  };
};
var lineSegment = (p0, p1) => {
  const length = Math.hypot(p1.x - p0.x, p1.y - p0.y);
  return {
    length,
    point: (t) => ({ x: p0.x + (p1.x - p0.x) * t, y: p0.y + (p1.y - p0.y) * t }),
    derivative: () => ({ x: p1.x - p0.x, y: p1.y - p0.y }),
    tAtLength: (s) => length === 0 ? 0 : Math.max(0, Math.min(1, s / length))
  };
};
var quadSegment = (p0, p1, p2) => curveSegment(
  (t) => {
    const u = 1 - t;
    return {
      x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
      y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y
    };
  },
  (t) => ({
    x: 2 * (1 - t) * (p1.x - p0.x) + 2 * t * (p2.x - p1.x),
    y: 2 * (1 - t) * (p1.y - p0.y) + 2 * t * (p2.y - p1.y)
  })
);
var cubicSegment = (p0, p1, p2, p3) => curveSegment(
  (t) => {
    const u = 1 - t;
    const a = u * u * u;
    const b = 3 * u * u * t;
    const c = 3 * u * t * t;
    const d = t * t * t;
    return {
      x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
      y: a * p0.y + b * p1.y + c * p2.y + d * p3.y
    };
  },
  (t) => {
    const u = 1 - t;
    return {
      x: 3 * u * u * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x),
      y: 3 * u * u * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y)
    };
  }
);
var arcSegment = (p0, radiusX, radiusY, rotationDegrees, largeArc, sweep, p1) => {
  let rx = Math.abs(radiusX);
  let ry = Math.abs(radiusY);
  if (p0.x === p1.x && p0.y === p1.y || rx === 0 || ry === 0) return lineSegment(p0, p1);
  const phi = rotationDegrees * Math.PI / 180;
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  const dx = (p0.x - p1.x) / 2;
  const dy = (p0.y - p1.y) / 2;
  const x1 = cos * dx + sin * dy;
  const y1 = -sin * dx + cos * dy;
  const lambda = x1 * x1 / (rx * rx) + y1 * y1 / (ry * ry);
  if (lambda > 1) {
    rx *= Math.sqrt(lambda);
    ry *= Math.sqrt(lambda);
  }
  const numerator = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1;
  const denominator = rx * rx * y1 * y1 + ry * ry * x1 * x1;
  const coefficient = (largeArc !== sweep ? 1 : -1) * Math.sqrt(Math.max(0, numerator / denominator));
  const cxPrime = coefficient * rx * y1 / ry;
  const cyPrime = -coefficient * ry * x1 / rx;
  const cx = cos * cxPrime - sin * cyPrime + (p0.x + p1.x) / 2;
  const cy = sin * cxPrime + cos * cyPrime + (p0.y + p1.y) / 2;
  const angle = (ux2, uy2, vx2, vy2) => Math.atan2(ux2 * vy2 - uy2 * vx2, ux2 * vx2 + uy2 * vy2);
  const ux = (x1 - cxPrime) / rx;
  const uy = (y1 - cyPrime) / ry;
  const vx = (-x1 - cxPrime) / rx;
  const vy = (-y1 - cyPrime) / ry;
  const theta1 = angle(1, 0, ux, uy);
  let delta = angle(ux, uy, vx, vy);
  if (!sweep && delta > 0) delta -= 2 * Math.PI;
  if (sweep && delta < 0) delta += 2 * Math.PI;
  return curveSegment(
    (t) => {
      if (t === 1) return { x: p1.x, y: p1.y };
      const theta = theta1 + delta * t;
      const c = Math.cos(theta);
      const s = Math.sin(theta);
      return { x: cx + rx * cos * c - ry * sin * s, y: cy + rx * sin * c + ry * cos * s };
    },
    (t) => {
      const theta = theta1 + delta * t;
      const c = Math.cos(theta);
      const s = Math.sin(theta);
      return { x: delta * (-rx * cos * s - ry * sin * c), y: delta * (-rx * sin * s + ry * cos * c) };
    }
  );
};
var measureInstructions = (instructions, d) => {
  const segments = [];
  const partialLengths = [];
  let current = { x: 0, y: 0 };
  let subpathStart = { x: 0, y: 0 };
  let lastCubicControl = null;
  let lastQuadControl = null;
  let total = 0;
  for (const instruction of instructions) {
    let segment = null;
    let cubicControl = null;
    let quadControl = null;
    let next = current;
    switch (instruction.type) {
      case "M":
        next = { x: instruction.x, y: instruction.y };
        subpathStart = next;
        break;
      case "L":
        next = { x: instruction.x, y: instruction.y };
        segment = lineSegment(current, next);
        break;
      case "H":
        next = { x: instruction.x, y: current.y };
        segment = lineSegment(current, next);
        break;
      case "V":
        next = { x: current.x, y: instruction.y };
        segment = lineSegment(current, next);
        break;
      case "Z":
        next = subpathStart;
        segment = lineSegment(current, next);
        break;
      case "C":
        next = { x: instruction.x, y: instruction.y };
        cubicControl = { x: instruction.cp2x, y: instruction.cp2y };
        segment = cubicSegment(current, { x: instruction.cp1x, y: instruction.cp1y }, cubicControl, next);
        break;
      case "S": {
        next = { x: instruction.x, y: instruction.y };
        const c1 = lastCubicControl ? { x: 2 * current.x - lastCubicControl.x, y: 2 * current.y - lastCubicControl.y } : current;
        cubicControl = { x: instruction.cpx, y: instruction.cpy };
        segment = cubicSegment(current, c1, cubicControl, next);
        break;
      }
      case "Q":
        next = { x: instruction.x, y: instruction.y };
        quadControl = { x: instruction.cpx, y: instruction.cpy };
        segment = quadSegment(current, quadControl, next);
        break;
      case "T":
        next = { x: instruction.x, y: instruction.y };
        quadControl = lastQuadControl ? { x: 2 * current.x - lastQuadControl.x, y: 2 * current.y - lastQuadControl.y } : current;
        segment = quadSegment(current, quadControl, next);
        break;
      case "A":
        next = { x: instruction.x, y: instruction.y };
        segment = arcSegment(
          current,
          instruction.rx,
          instruction.ry,
          instruction.xAxisRotation,
          instruction.largeArcFlag,
          instruction.sweepFlag,
          next
        );
        break;
    }
    if (segment && !Number.isFinite(segment.length)) {
      throw new Error(`path: "${d}" has a segment of non-finite length`);
    }
    total += segment ? segment.length : 0;
    segments.push(segment);
    partialLengths.push(total);
    lastCubicControl = cubicControl;
    lastQuadControl = quadControl;
    current = next;
  }
  const first = instructions[0];
  return {
    start: first && first.type === "M" ? { x: first.x, y: first.y } : { x: 0, y: 0 },
    instructions,
    segments,
    partialLengths,
    totalLength: total
  };
};
var CACHE_SIZE = 64;
var cache = /* @__PURE__ */ new Map();
var measurePath = (d) => {
  const cached = cache.get(d);
  if (cached) {
    cache.delete(d);
    cache.set(d, cached);
    return cached;
  }
  const measured = measureInstructions(normalizeInstructions(parsePath(d)), d);
  cache.set(d, measured);
  if (cache.size > CACHE_SIZE) cache.delete(cache.keys().next().value);
  return measured;
};
var checkLength = (fn, length) => {
  if (typeof length !== "number" || !Number.isFinite(length) || length < 0) {
    throw new Error(`${fn}: length must be a finite number >= 0, got ${length}`);
  }
};
var locate = (path, length) => {
  let index = -1;
  for (let k = 0; k < path.segments.length; k++) {
    const segment2 = path.segments[k];
    if (segment2 && segment2.length > 0) {
      index = k;
      if (length <= path.partialLengths[k]) break;
    }
  }
  if (index === -1) return { segment: null, t: 0 };
  const segment = path.segments[index];
  return { segment, t: segment.tAtLength(length - (path.partialLengths[index] - segment.length)) };
};
var getLength = (path) => measurePath(path).totalLength;
var getPointAtLength = (path, length) => {
  checkLength("getPointAtLength", length);
  const measured = measurePath(path);
  if (length > measured.totalLength) return null;
  const { segment, t } = locate(measured, length);
  if (!segment) return { x: measured.start.x, y: measured.start.y };
  return segment.point(t);
};
var getTangentAtLength = (path, length) => {
  checkLength("getTangentAtLength", length);
  const measured = measurePath(path);
  if (length > measured.totalLength) return null;
  const { segment, t } = locate(measured, length);
  if (!segment) return { x: 0, y: 0 };
  let v = segment.derivative(t);
  for (let step = 1e-9; Math.hypot(v.x, v.y) < 1e-12 && step <= 1e-3; step *= 10) {
    v = segment.derivative(t < 0.5 ? t + step : t - step);
  }
  const norm = Math.hypot(v.x, v.y);
  return { x: v.x / norm, y: v.y / norm };
};
var getInstructionIndexAtLength = (path, length) => {
  checkLength("getInstructionIndexAtLength", length);
  const { partialLengths, totalLength } = measurePath(path);
  if (length > totalLength) {
    throw new Error(
      `A length of ${length} was passed to getInstructionIndexAtLength() but the total length of the path is only ${totalLength}`
    );
  }
  let index = partialLengths.length - 1;
  while (index > 0 && partialLengths[index] >= length) index--;
  return { lengthIntoInstruction: length - partialLengths[index], index };
};
var evolvePath = (progress, path) => {
  if (typeof progress !== "number" || !Number.isFinite(progress)) {
    throw new Error(`evolvePath: progress must be a finite number, got ${progress}`);
  }
  const length = getLength(path);
  if (progress === 0) {
    const extended = length * 1.5;
    return { strokeDasharray: `${extended} ${extended}`, strokeDashoffset: extended };
  }
  return { strokeDasharray: `${length} ${length}`, strokeDashoffset: length - progress * length };
};

// src/utils/path/transform.ts
var checkNumber = (fn, name, value) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${fn}: ${name} must be a finite number, got ${value}`);
  }
};
var quadraticRange = (a, b, c) => {
  const min = Math.min(a, c);
  const max = Math.max(a, c);
  if ((b - a) * (c - b) >= 0) return [min, max];
  const extremum = (a * c - b * b) / (a - 2 * b + c);
  return extremum < min ? [extremum, max] : [min, extremum];
};
var cubicRange = (a, b, c, d) => {
  const k = a - 3 * b + 3 * c - d;
  if (Math.abs(k) < 1e-8) {
    if (a === d && a === b) return [a, d];
    return quadraticRange(a, -0.5 * a + 1.5 * b, a - 3 * b + 3 * c);
  }
  const discriminant = -a * c + a * d - b * c - b * d + b * b + c * c;
  if (discriminant <= 0) return [Math.min(a, d), Math.max(a, d)];
  const root = Math.sqrt(discriminant);
  let min = Math.min(a, d);
  let max = Math.max(a, d);
  const l = a - 2 * b + c;
  for (const t of [(l + root) / k, (l - root) / k]) {
    if (t > 0 && t < 1) {
      const value = a * (1 - t) * (1 - t) * (1 - t) + b * 3 * (1 - t) * (1 - t) * t + c * 3 * (1 - t) * t * t + d * t * t * t;
      if (value < min) min = value;
      if (value > max) max = value;
    }
  }
  return [min, max];
};
var getBoundingBoxFromInstructions = (instructions) => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let x = 0;
  let y = 0;
  let moveX = 0;
  let moveY = 0;
  const add = (px, py) => {
    minX = Math.min(minX, px);
    maxX = Math.max(maxX, px);
    minY = Math.min(minY, py);
    maxY = Math.max(maxY, py);
  };
  for (const instruction of instructions) {
    switch (instruction.type) {
      case "M":
        moveX = instruction.x;
        moveY = instruction.y;
        add(instruction.x, instruction.y);
        x = instruction.x;
        y = instruction.y;
        break;
      case "L":
        add(instruction.x, instruction.y);
        x = instruction.x;
        y = instruction.y;
        break;
      case "C": {
        const [x1, x2] = cubicRange(x, instruction.cp1x, instruction.cp2x, instruction.x);
        const [y1, y2] = cubicRange(y, instruction.cp1y, instruction.cp2y, instruction.y);
        add(x1, y1);
        add(x2, y2);
        x = instruction.x;
        y = instruction.y;
        break;
      }
      case "Z":
        x = moveX;
        y = moveY;
        break;
    }
  }
  return {
    x1: minX,
    y1: minY,
    x2: maxX,
    y2: maxY,
    viewBox: `${minX} ${minY} ${maxX - minX} ${maxY - minY}`,
    width: maxX - minX,
    height: maxY - minY
  };
};
var getBoundingBox = (d) => getBoundingBoxFromInstructions(reduceInstructions(parsePath(d)));
var translateInstructions = (instructions, x, y) => instructions.map((instruction, index) => {
  switch (instruction.type) {
    case "m":
      return index === 0 ? { type: "m", dx: instruction.dx + x, dy: instruction.dy + y } : instruction;
    case "M":
    case "L":
    case "T":
      return { ...instruction, x: instruction.x + x, y: instruction.y + y };
    case "H":
      return { type: "H", x: instruction.x + x };
    case "V":
      return { type: "V", y: instruction.y + y };
    case "A":
      return { ...instruction, x: instruction.x + x, y: instruction.y + y };
    case "C":
      return {
        type: "C",
        cp1x: instruction.cp1x + x,
        cp1y: instruction.cp1y + y,
        cp2x: instruction.cp2x + x,
        cp2y: instruction.cp2y + y,
        x: instruction.x + x,
        y: instruction.y + y
      };
    case "S":
    case "Q":
      return { ...instruction, cpx: instruction.cpx + x, cpy: instruction.cpy + y, x: instruction.x + x, y: instruction.y + y };
    default:
      return instruction;
  }
});
var translatePath = (path, x, y) => {
  checkNumber("translatePath", "x", x);
  checkNumber("translatePath", "y", y);
  return serializeInstructions(translateInstructions(parsePath(path), x, y));
};
var resetPath = (d) => {
  const box = getBoundingBox(d);
  return translatePath(d, -box.x1, -box.y1);
};
var centerPath = (d, target = { x: 0, y: 0 }) => {
  if (typeof target !== "object" || target === null) {
    throw new Error(`centerPath: target must be { x, y }, got ${JSON.stringify(target)}`);
  }
  checkNumber("centerPath", "target.x", target.x);
  checkNumber("centerPath", "target.y", target.y);
  const box = getBoundingBox(d);
  return translatePath(d, target.x - (box.x1 + box.x2) / 2, target.y - (box.y1 + box.y2) / 2);
};
var scalePath = (d, scaleX, scaleY) => {
  checkNumber("scalePath", "scaleX", scaleX);
  checkNumber("scalePath", "scaleY", scaleY);
  const reduced = reduceInstructions(parsePath(d));
  const box = getBoundingBoxFromInstructions(reduced);
  const sx = (value) => (value - box.x1) * scaleX + box.x1;
  const sy = (value) => (value - box.y1) * scaleY + box.y1;
  return serializeInstructions(
    reduced.map((instruction) => {
      switch (instruction.type) {
        case "M":
        case "L":
          return { type: instruction.type, x: sx(instruction.x), y: sy(instruction.y) };
        case "C":
          return {
            type: "C",
            cp1x: sx(instruction.cp1x),
            cp1y: sy(instruction.cp1y),
            cp2x: sx(instruction.cp2x),
            cp2y: sy(instruction.cp2y),
            x: sx(instruction.x),
            y: sy(instruction.y)
          };
        case "Z":
          return instruction;
      }
    })
  );
};
var splitSubpaths = (instructions) => {
  const absolute = normalizeInstructions(instructions);
  const subpaths = [];
  instructions.forEach((instruction, index) => {
    if (instruction.type === "M" || instruction.type === "m") {
      const move = absolute[index];
      subpaths.push([{ type: "M", x: move.x, y: move.y }]);
    } else {
      subpaths[subpaths.length - 1].push(instruction);
    }
  });
  return subpaths;
};
var getSubpaths = (path) => splitSubpaths(parsePath(path)).map(serializeInstructions);
var reverseSubpath = (instructions) => {
  const closeIndex = instructions.findIndex((instruction) => instruction.type === "Z");
  const start = instructions[0];
  if (closeIndex !== -1 && closeIndex < instructions.length - 1 && start.type === "M") {
    return [
      reverseSubpath(instructions.slice(0, closeIndex + 1)),
      reverseSubpath([{ type: "M", x: start.x, y: start.y }, ...instructions.slice(closeIndex + 1)])
    ].join(" ");
  }
  const reversed = [];
  let x = 0;
  let y = 0;
  for (const instruction of instructions) {
    if (instruction.type === "C") {
      reversed.unshift({
        type: "C",
        cp1x: instruction.cp2x,
        cp1y: instruction.cp2y,
        cp2x: instruction.cp1x,
        cp2y: instruction.cp1y,
        x,
        y
      });
    } else if (instruction.type === "L") {
      reversed.unshift({ type: "L", x, y });
    }
    if (instruction.type !== "Z") {
      x = instruction.x;
      y = instruction.y;
    }
  }
  reversed.unshift({ type: "M", x, y });
  let result = serializeInstructions(reversed);
  if (instructions[instructions.length - 1].type === "Z") result += "Z";
  return result.replace(/M M/g, "Z M");
};
var reversePath = (path) => splitSubpaths(reduceInstructions(parsePath(path))).map(reverseSubpath).join(" ").replace(/ +/g, " ").trim();
var lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
var cutPath = (d, length) => {
  if (typeof length !== "number" || !Number.isFinite(length) || length < 0) {
    throw new Error(`cutPath: length must be a finite number >= 0, got ${length}`);
  }
  const reduced = reduceInstructions(parsePath(d));
  const result = [];
  let current = { x: 0, y: 0 };
  let subpathStart = { x: 0, y: 0 };
  let sum = 0;
  for (const instruction of reduced) {
    let partLength = 0;
    let cut = null;
    const from = current;
    if (instruction.type === "M") {
      subpathStart = { x: instruction.x, y: instruction.y };
      current = subpathStart;
    } else if (instruction.type === "L" || instruction.type === "Z") {
      const to = instruction.type === "L" ? { x: instruction.x, y: instruction.y } : subpathStart;
      partLength = Math.hypot(to.x - from.x, to.y - from.y);
      cut = () => ({ type: "L", ...lerp(from, to, (length - sum) / partLength) });
      current = to;
    } else {
      const p1 = { x: instruction.cp1x, y: instruction.cp1y };
      const p2 = { x: instruction.cp2x, y: instruction.cp2y };
      const p3 = { x: instruction.x, y: instruction.y };
      const segment = cubicSegment(from, p1, p2, p3);
      partLength = segment.length;
      cut = () => {
        const t = segment.tAtLength(length - sum);
        const p01 = lerp(from, p1, t);
        const p12 = lerp(p1, p2, t);
        const p23 = lerp(p2, p3, t);
        const p012 = lerp(p01, p12, t);
        const end = lerp(p012, lerp(p12, p23, t), t);
        return { type: "C", cp1x: p01.x, cp1y: p01.y, cp2x: p012.x, cp2y: p012.y, x: end.x, y: end.y };
      };
      current = p3;
    }
    if (sum + partLength > length) {
      result.push(cut ? cut() : instruction);
      return serializeInstructions(result);
    }
    sum += partLength;
    result.push(instruction);
    if (sum === length) return serializeInstructions(result);
  }
  return serializeInstructions(result);
};
var extendViewBox = (currentViewBox, scale) => {
  checkNumber("extendViewBox", "scale", scale);
  const parts = typeof currentViewBox === "string" ? currentViewBox.trim().split(/\s*,\s*|\s+/).map((part) => part === "" ? NaN : Number(part)) : [];
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) {
    throw new Error(`extendViewBox: currentViewBox must be 4 valid numbers, but got "${currentViewBox}"`);
  }
  const [x, y, width, height] = parts;
  if (width <= 0 || height <= 0) {
    throw new Error(`extendViewBox: currentViewBox must have a positive width and height, but got "${currentViewBox}"`);
  }
  const relative = scale - 1;
  return [x - relative * width / 2, y - relative * height / 2, width + relative * width, height + relative * height].join(
    " "
  );
};
var splitHalf = (points) => {
  const left = [];
  const right = [];
  let level = points;
  while (level.length > 0) {
    left.push(level[0]);
    right.unshift(level[level.length - 1]);
    const next = [];
    for (let i = 1; i < level.length; i++) {
      const [x0, y0] = level[i - 1];
      const [x1, y1] = level[i];
      next.push([x0 + (x1 - x0) * 0.5, y0 + (y1 - y0) * 0.5]);
    }
    level = next;
  }
  return [left, right];
};
var warpPath = (path, transformer, options) => {
  if (typeof transformer !== "function") {
    throw new Error(`warpPath: transformer must be a function ({ x, y }) => { x, y }, got ${transformer}`);
  }
  const reduced = reduceInstructions(parsePath(path));
  const withLines = [];
  let subpathStart = { x: 0, y: 0 };
  for (const instruction of reduced) {
    if (instruction.type === "M") subpathStart = { x: instruction.x, y: instruction.y };
    if (instruction.type === "Z") withLines.push({ type: "L", x: subpathStart.x, y: subpathStart.y });
    withLines.push(instruction);
  }
  let threshold = options?.interpolationThreshold;
  if (threshold === void 0) {
    const box = getBoundingBoxFromInstructions(withLines);
    threshold = Math.max(box.x2 - box.x1, box.y2 - box.y1) * 0.01;
  } else if (typeof threshold !== "number" || !Number.isFinite(threshold) || threshold <= 0) {
    throw new Error(`warpPath: interpolationThreshold must be a positive number, got ${threshold}`);
  }
  const split = [];
  let x = 0;
  let y = 0;
  for (const instruction of withLines) {
    if (instruction.type !== "L" && instruction.type !== "C") {
      split.push(instruction);
      if (instruction.type === "M") {
        x = instruction.x;
        y = instruction.y;
      }
      continue;
    }
    const points = instruction.type === "L" ? [[x, y], [instruction.x, instruction.y]] : [[x, y], [instruction.cp1x, instruction.cp1y], [instruction.cp2x, instruction.cp2y], [instruction.x, instruction.y]];
    const stack = [points];
    while (stack.length > 0) {
      const part = stack.pop();
      const first = part[0];
      const last = part[part.length - 1];
      if (Math.hypot(last[0] - first[0], last[1] - first[1]) > threshold) {
        const [left, right] = splitHalf(part);
        stack.push(right, left);
      } else if (part.length === 2) {
        split.push({ type: "L", x: last[0], y: last[1] });
      } else {
        split.push({ type: "C", cp1x: part[1][0], cp1y: part[1][1], cp2x: part[2][0], cp2y: part[2][1], x: last[0], y: last[1] });
      }
    }
    x = instruction.x;
    y = instruction.y;
  }
  const warp = (px, py) => {
    const point = transformer({ x: px, y: py });
    if (typeof point !== "object" || point === null || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      throw new Error(`warpPath: transformer must return { x, y } with finite numbers, got ${JSON.stringify(point)} for (${px}, ${py})`);
    }
    return point;
  };
  return serializeInstructions(
    split.map((instruction) => {
      if (instruction.type === "Z") return instruction;
      const end = warp(instruction.x, instruction.y);
      if (instruction.type !== "C") return { type: instruction.type, x: end.x, y: end.y };
      const cp1 = warp(instruction.cp1x, instruction.cp1y);
      const cp2 = warp(instruction.cp2x, instruction.cp2y);
      return { type: "C", x: end.x, y: end.y, cp1x: cp1.x, cp1y: cp1.y, cp2x: cp2.x, cp2y: cp2.y };
    })
  );
};

export { centerPath, cutPath, evolvePath, extendViewBox, getBoundingBox, getBoundingBoxFromInstructions, getEndPosition, getInstructionIndexAtLength, getLength, getPointAtLength, getSubpaths, getTangentAtLength, normalizePath, parsePath, quadToCubic, reduceInstructions, resetPath, reversePath, scalePath, serializeInstructions, translatePath, warpPath };
//# sourceMappingURL=chunk-ADMJBRUM.js.map
//# sourceMappingURL=chunk-ADMJBRUM.js.map