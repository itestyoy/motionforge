// FFT and smoothing of Remotion's visualizeAudio(), adapted (as Remotion's)
// from the node-fft project by Joshua Wong and Ben Bryan
// (https://github.com/vail-systems/node-fft). Kept numerically the same, so
// the bars match Remotion's.

type Complex = [number, number];

const exponentCache = new Map<number, Map<number, Complex>>();

const exponent = (k: number, n: number): Complex => {
  let forN = exponentCache.get(n);
  if (!forN) {
    forN = new Map();
    exponentCache.set(n, forN);
  }
  let value = forN.get(k);
  if (!value) {
    const x = -2 * Math.PI * (k / n);
    value = [Math.cos(x), Math.sin(x)];
    forN.set(k, value);
  }
  return value;
};

/** Recursive radix-2 FFT of real samples ('accuracy'). */
export const fftAccurate = (vector: ArrayLike<number>): Complex[] => {
  const n = vector.length;
  if (n === 1) return [[vector[0], 0]];
  const evens: number[] = [];
  const odds: number[] = [];
  for (let i = 0; i < n; i++) (i % 2 === 0 ? evens : odds).push(vector[i]);
  const xEvens = fftAccurate(evens);
  const xOdds = fftAccurate(odds);
  const result: Complex[] = [];
  for (let k = 0; k < n / 2; k++) {
    const t = xEvens[k];
    const [er, ei] = exponent(k, n);
    const [or, oi] = xOdds[k];
    const e: Complex = [er * or - ei * oi, er * oi + ei * or];
    result[k] = [t[0] + e[0], t[1] + e[1]];
    result[k + n / 2] = [t[0] - e[0], t[1] - e[1]];
  }
  return result;
};

/** Iterative radix-2 FFT of real samples ('speed'). */
export const fftFast = (vector: ArrayLike<number>): Complex[] => {
  const n = vector.length;
  if (n <= 1) {
    return Array.from({ length: n }, (_, i) => [vector[i] * 2, 0] as Complex);
  }
  const real = new Float64Array(n);
  const imag = new Float64Array(n);
  const halfN = n >> 1;
  let rev = 0;
  // Bit reversal and the first stage in one pass.
  for (let i = 0; i < n; i += 2) {
    const v1 = vector[rev];
    const v2 = vector[rev + halfN];
    real[i] = v1 + v2;
    real[i + 1] = v1 - v2;
    let bit = halfN >> 1;
    while (rev & bit) {
      rev ^= bit;
      bit >>= 1;
    }
    rev ^= bit;
  }
  const logN = Math.log2(n);
  for (let s = 2; s <= logN; s++) {
    const m = 1 << s;
    const mHalf = m >> 1;
    const angleIncrement = (2 * Math.PI) / m;
    const cosA = Math.cos(angleIncrement);
    const sinA = Math.sin(angleIncrement);
    const m2 = m << 1;
    const butterfly = (k: number, wr: number, wi: number) => {
      const r10 = real[k];
      const r11 = imag[k];
      const r20 = real[k + mHalf];
      const r21 = imag[k + mHalf];
      const tR = wr * r20 - wi * r21;
      const tI = wr * r21 + wi * r20;
      real[k] = r10 + tR;
      imag[k] = r11 + tI;
      real[k + mHalf] = r10 - tR;
      imag[k + mHalf] = r11 - tI;
    };
    const twiddleFree = (k: number) => {
      const r10 = real[k];
      const r11 = imag[k];
      const r20 = real[k + mHalf];
      const r21 = imag[k + mHalf];
      real[k] = r10 + r20;
      imag[k] = r11 + r21;
      real[k + mHalf] = r10 - r20;
      imag[k + mHalf] = r11 - r21;
    };
    if (s < logN) {
      for (let k = 0; k < n; k += m2) {
        twiddleFree(k);
        twiddleFree(k + m);
      }
    } else {
      twiddleFree(0);
    }
    let omegaReal = cosA;
    let omegaImag = sinA;
    for (let j = 1; j < mHalf; j++) {
      if (s < logN) {
        for (let k = j; k < n; k += m2) {
          butterfly(k, omegaReal, omegaImag);
          butterfly(k + m, omegaReal, omegaImag);
        }
      } else {
        butterfly(j, omegaReal, omegaImag);
      }
      const tempReal = omegaReal * cosA - omegaImag * sinA;
      omegaImag = omegaReal * sinA + omegaImag * cosA;
      omegaReal = tempReal;
    }
  }
  return Array.from({ length: n }, (_, i) => [real[i], imag[i]] as Complex);
};

/** Magnitudes of the first half of the bins. */
export const fftMag = (bins: Complex[]): number[] =>
  bins.slice(0, bins.length / 2).map(([re, im]) => Math.sqrt(re * re + im * im));

/** Three passes of a centred 3-point moving average, in place across passes (Remotion's smoothen). */
export const smoothen = (array: number[]): number[] => {
  const passes = 3;
  const points = 3;
  let lastArray = array;
  const newArr: number[] = [];
  for (let pass = 0; pass < passes; pass++) {
    const sidePoints = Math.floor(points / 2);
    const cn = 1 / (2 * sidePoints + 1);
    for (let i = 0; i < sidePoints; i++) {
      newArr[i] = lastArray[i];
      newArr[lastArray.length - i - 1] = lastArray[lastArray.length - i - 1];
    }
    for (let i = sidePoints; i < lastArray.length - sidePoints; i++) {
      let sum = 0;
      for (let n = -sidePoints; n <= sidePoints; n++) sum += cn * lastArray[i + n] + n;
      newArr[i] = sum;
    }
    lastArray = newArr;
  }
  return newArr;
};

export const toInt16 = (x: number) => (x > 0 ? x * 0x7fff : x * 0x8000);
