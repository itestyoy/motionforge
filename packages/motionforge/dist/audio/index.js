'use client';import { useAudioTrack } from '../chunk-545UZ5CT.js';
import { HostContext, useVideoConfig, useDelayRender, TimelineContext } from '../chunk-L5HQH5HH.js';
import { useContext, useRef, useState, useEffect, useMemo } from 'react';

// src/components/audio/seeded-random.ts
var seededRandom = (seed) => {
  let state = seed >>> 0;
  return () => {
    state = state + 1831565813 >>> 0;
    let t = state;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
};
var withRandom = (random, fn) => {
  const previous = Math.random;
  Math.random = random;
  try {
    return fn();
  } finally {
    if (Math.random === random) Math.random = previous;
  }
};
var checkSeed = (component, seed) => {
  if (!Number.isInteger(seed)) {
    throw new Error(`${component}: seed must be an integer, got ${JSON.stringify(seed)}`);
  }
  return seed;
};

// src/components/audio/generated-cache.ts
var LIMIT = 64;
var entries = /* @__PURE__ */ new Map();
var getGenerated = (key) => {
  if (!entries.has(key)) return void 0;
  const value = entries.get(key);
  entries.delete(key);
  entries.set(key, value);
  return value;
};
var setGenerated = (key, value) => {
  entries.delete(key);
  entries.set(key, value);
  while (entries.size > LIMIT) entries.delete(entries.keys().next().value);
  return value;
};
var deleteGenerated = (key, value) => {
  if (entries.get(key) === value) entries.delete(key);
};
var describe = (value) => {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
};
var checkJson = (component, name, value, seen = /* @__PURE__ */ new Set()) => {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`${component}: ${name} must be JSON data, got ${value}`);
    return;
  }
  const isPlain = typeof value === "object" && (Array.isArray(value) || Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
  if (!isPlain || seen.has(value)) {
    throw new Error(
      `${component}: ${name} must be JSON data (strings, numbers, booleans, null, arrays, plain objects), got ${typeof value === "function" ? "a function" : describe(value)}`
    );
  }
  seen.add(value);
  for (const [key, item] of Object.entries(value)) checkJson(component, `${name}.${key}`, item, seen);
  seen.delete(value);
};
var toAudioBuffer = (component, channels, sampleRate) => {
  if (typeof AudioBuffer === "undefined") {
    throw new Error(`${component} needs the Web Audio API (AudioBuffer) to hand its samples to the host`);
  }
  const buffer = new AudioBuffer({ length: channels[0].length, numberOfChannels: channels.length, sampleRate });
  channels.forEach((samples, index) => buffer.getChannelData(index).set(samples));
  return buffer;
};

// src/components/audio/ToneAudio.tsx
var loadTone = () => import('tone');
var MISSING_TONE = "<ToneAudio> needs Tone.js, an optional peer dependency of motionforge: install it (npm install tone@15)";
var prewarmed = /* @__PURE__ */ new WeakSet();
var prewarmNoise = (Tone) => {
  if (prewarmed.has(Tone) || typeof Tone.Noise !== "function") return;
  withRandom(seededRandom(1852795251), () => {
    for (const type of ["white", "pink", "brown"]) {
      const noise = new Tone.Noise(type);
      noise.start(0);
      noise.dispose();
    }
  });
  prewarmed.add(Tone);
};
var queue = Promise.resolve();
var renderOffline = async ({ render, fps, durationInSeconds, sampleRate, channels, seed }) => {
  let Tone;
  try {
    Tone = await loadTone();
  } catch (error) {
    throw new Error(`${MISSING_TONE}: ${error instanceof Error ? error.message : String(error)}`);
  }
  const random = seededRandom(seed);
  const context = new Tone.OfflineContext(channels, durationInSeconds, sampleRate);
  const original = Tone.getContext();
  Tone.setContext(context);
  try {
    prewarmNoise(Tone);
    const result = withRandom(
      random,
      () => render(Tone, { context, fps, durationInSeconds, framesToSeconds: (frames) => frames / fps })
    );
    if (typeof result?.then === "function") {
      result.then(void 0, () => void 0);
      throw new Error(
        "<ToneAudio>: render must be synchronous (no async function, no await): Math.random is seeded only while it runs. Samples loaded by Tone are awaited before the render; start them from the transport."
      );
    }
  } finally {
    Tone.setContext(original);
  }
  await Tone.loaded();
  const emit = context.emit;
  context.emit = function seededEmit(...args) {
    return withRandom(random, () => emit.apply(this, args));
  };
  const rendered2 = await context.render();
  const buffer = rendered2.get();
  if (!buffer) throw new Error("<ToneAudio>: the offline render returned no audio");
  return buffer;
};
var renderTone = (key, job) => {
  const cached = getGenerated(key);
  if (cached) return cached;
  const promise = queue.then(() => renderOffline(job));
  queue = promise.catch(() => void 0);
  promise.catch(() => deleteGenerated(key, promise));
  return setGenerated(key, promise);
};
var rendered = /* @__PURE__ */ new Map();
var remember = (key, buffer) => {
  rendered.delete(key);
  rendered.set(key, buffer);
  while (rendered.size > 64) rendered.delete(rendered.keys().next().value);
};
var checkProps = ({ durationInFrames, render, deps, sampleRate, channels }) => {
  if (!Number.isInteger(durationInFrames) || durationInFrames <= 0) {
    throw new Error(`<ToneAudio>: durationInFrames must be a positive integer, got ${JSON.stringify(durationInFrames)}`);
  }
  if (typeof render !== "function") {
    throw new Error(`<ToneAudio>: render must be a function (Tone) => { ... }, got ${JSON.stringify(render)}`);
  }
  if (deps !== void 0 && !Array.isArray(deps)) {
    throw new Error(`<ToneAudio>: deps must be an array, got ${JSON.stringify(deps)}`);
  }
  if (deps !== void 0) checkJson("<ToneAudio>", "deps", deps);
  if (!Number.isInteger(sampleRate) || sampleRate < 3e3 || sampleRate > 768e3) {
    throw new Error(`<ToneAudio>: sampleRate must be an integer from 3000 to 768000 (Hz), got ${JSON.stringify(sampleRate)}`);
  }
  if (channels !== 1 && channels !== 2) {
    throw new Error(`<ToneAudio>: channels must be 1 or 2, got ${JSON.stringify(channels)}`);
  }
};
var ToneAudio = (props) => {
  const { durationInFrames, render, deps = [], seed = 0, sampleRate = 48e3, channels = 2, volume, muted = false, name } = props;
  checkProps({ ...props, sampleRate, channels });
  checkSeed("<ToneAudio>", seed);
  if (typeof muted !== "boolean") throw new Error(`<ToneAudio>: muted must be a boolean, got ${JSON.stringify(muted)}`);
  if (name !== void 0 && typeof name !== "string") throw new Error(`<ToneAudio>: name must be a string, got ${JSON.stringify(name)}`);
  if (volume !== void 0 && typeof volume !== "function" && !(typeof volume === "number" && Number.isFinite(volume) && volume >= 0)) {
    throw new Error(`<ToneAudio>: volume must be a number >= 0 or a function (frame) => number, got ${JSON.stringify(volume)}`);
  }
  const host = useContext(HostContext);
  const collector = host?.audio ?? null;
  const { fps } = useVideoConfig();
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const key = JSON.stringify(["tone", String(render), deps, durationInFrames, fps, sampleRate, channels, seed]);
  const renderRef = useRef(render);
  renderRef.current = render;
  const [done, setDone] = useState(null);
  const buffer = done?.key === key ? done.buffer : rendered.get(key) ?? null;
  const handle = useRef(null);
  useEffect(() => {
    if (!collector || rendered.has(key)) return;
    const current = delayRender(`<ToneAudio> rendering ${durationInFrames} frames offline`);
    handle.current = current;
    let active = true;
    renderTone(key, {
      render: renderRef.current,
      fps,
      durationInSeconds: durationInFrames / fps,
      sampleRate,
      channels,
      seed
    }).then(
      (result) => {
        remember(key, result);
        if (active) setDone({ key, buffer: result });
      },
      (error) => {
        if (!active) return;
        cancelRender(error);
        continueRender(current);
      }
    );
    return () => {
      active = false;
      continueRender(current);
      handle.current = null;
    };
  }, [collector, key, delayRender, continueRender, cancelRender]);
  useAudioTrack(
    "ToneAudio",
    buffer && {
      src: null,
      buffer,
      bufferKey: key,
      name: name ?? null,
      trimBefore: 0,
      trimAfter: null,
      playbackRate: 1,
      loop: false,
      muted,
      volume,
      at: 0,
      lengthInFrames: durationInFrames
    }
  );
  useEffect(() => {
    if (buffer && handle.current !== null) {
      continueRender(handle.current);
      handle.current = null;
    }
  }, [buffer, continueRender]);
  return null;
};

// src/components/audio/zzfx.ts
var ZZFX_VOLUME = 0.3;
var buildZzfxSamples = (sampleRate, random, parameters) => {
  let [
    volume = 1,
    randomness = 0.05,
    frequency = 220,
    attack = 0,
    sustain = 0,
    release = 0.1,
    shape = 0,
    shapeCurve = 1,
    slide = 0,
    deltaSlide = 0,
    pitchJump = 0,
    pitchJumpTime = 0,
    repeatTime = 0,
    noise = 0,
    modulation = 0,
    bitCrush = 0,
    delay = 0,
    sustainVolume = 1,
    decay = 0,
    tremolo = 0,
    filter = 0
  ] = parameters;
  let PI2 = Math.PI * 2, abs = Math.abs, sign = (v) => v < 0 ? -1 : 1, startSlide = slide *= 500 * PI2 / sampleRate / sampleRate, startFrequency = frequency *= (1 + randomness * 2 * random() - randomness) * PI2 / sampleRate, modOffset = 0, repeat = 0, crush = 0, jump = 1, length, b, t = 0, i = 0, s = 0, f, quality = 2, w = PI2 * abs(filter) * 2 / sampleRate, cos = Math.cos(w), alpha = Math.sin(w) / 2 / quality, a0 = 1 + alpha, a1 = -2 * cos / a0, a2 = (1 - alpha) / a0, b0 = (1 + sign(filter) * cos) / 2 / a0, b1 = -(sign(filter) + cos) / a0, b2 = b0, x2 = 0, x1 = 0, y2 = 0, y1 = 0;
  const minAttack = 9;
  attack = attack * sampleRate || minAttack;
  decay *= sampleRate;
  sustain *= sampleRate;
  release *= sampleRate;
  delay *= sampleRate;
  deltaSlide *= 500 * PI2 / sampleRate ** 3;
  modulation *= PI2 / sampleRate;
  pitchJump *= PI2 / sampleRate;
  pitchJumpTime *= sampleRate;
  repeatTime = repeatTime * sampleRate | 0;
  length = attack + decay + sustain + release + delay | 0;
  b = new Float32Array(length > 0 ? length : 0);
  for (; i < length; b[i++] = s * volume) {
    if (!(++crush % (bitCrush * 100 | 0))) {
      s = shape ? shape > 1 ? shape > 2 ? shape > 3 ? shape > 4 ? (
        // wave shape
        t / PI2 % 1 < shapeCurve / 2 ? 1 : -1
      ) : (
        // 5 square duty
        Math.sin(t ** 3)
      ) : (
        // 4 noise
        Math.max(Math.min(Math.tan(t), 1), -1)
      ) : (
        // 3 tan
        1 - (2 * t / PI2 % 2 + 2) % 2
      ) : (
        // 2 saw
        1 - 4 * abs(Math.round(t / PI2) - t / PI2)
      ) : (
        // 1 triangle
        Math.sin(t)
      );
      s = (repeatTime ? 1 - tremolo + tremolo * Math.sin(PI2 * i / repeatTime) : 1) * (shape > 4 ? s : sign(s) * abs(s) ** shapeCurve) * // shape curve
      (i < attack ? i / attack : (
        // attack
        i < attack + decay ? (
          // decay
          1 - (i - attack) / decay * (1 - sustainVolume)
        ) : (
          // decay falloff
          i < attack + decay + sustain ? (
            // sustain
            sustainVolume
          ) : (
            // sustain volume
            i < length - delay ? (
              // release
              (length - i - delay) / release * // release falloff
              sustainVolume
            ) : (
              // release volume
              0
            )
          )
        )
      ));
      s = delay ? s / 2 + (delay > i ? 0 : (
        // delay
        (i < length - delay ? 1 : (length - i) / delay) * // release delay
        b[i - delay | 0] / 2 / volume
      )) : s;
      if (filter)
        s = y1 = b2 * x2 + b1 * (x2 = x1) + b0 * (x1 = s) - a2 * y2 - a1 * (y2 = y1);
    }
    f = (frequency += slide += deltaSlide) * // frequency
    Math.cos(modulation * modOffset++);
    t += f + f * noise * (i * i * PI2 % 2 - 1);
    if (jump && ++jump > pitchJumpTime) {
      frequency += pitchJump;
      startFrequency += pitchJump;
      jump = 0;
    }
    if (repeatTime && !(++repeat % repeatTime)) {
      frequency = startFrequency;
      slide = startSlide;
      jump || (jump = 1);
    }
  }
  return b;
};

// src/components/audio/Sfx.tsx
var MAX_PARAMS = 21;
var checkParams = (component, params) => {
  if (!Array.isArray(params)) {
    throw new Error(`${component}: the ZzFX parameters must be an array of numbers, got ${JSON.stringify(params)}`);
  }
  if (params.length > MAX_PARAMS) {
    throw new Error(`${component}: ZzFX takes at most ${MAX_PARAMS} parameters, got ${params.length}`);
  }
  return Array.from(params, (value, index) => {
    if (value === void 0 || value === null) return void 0;
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error(`${component}: ZzFX parameter ${index} must be a finite number or left out, got ${JSON.stringify(value)}`);
    }
    return value;
  });
};
var checkSampleRate = (component, sampleRate) => {
  if (!Number.isInteger(sampleRate) || sampleRate < 3e3 || sampleRate > 768e3) {
    throw new Error(`${component}: sampleRate must be an integer from 3000 to 768000 (Hz), got ${JSON.stringify(sampleRate)}`);
  }
  return sampleRate;
};
var renderZzfx = (params, sampleRate = 44100, seed = 0) => {
  const values = checkParams("renderZzfx", params);
  checkSampleRate("renderZzfx", sampleRate);
  checkSeed("renderZzfx", seed);
  const samples = buildZzfxSamples(sampleRate, seededRandom(seed), values);
  for (let i = 0; i < samples.length; i++) samples[i] *= ZZFX_VOLUME;
  return samples;
};
var Sfx = ({ zzfx, at = 0, seed = 0, sampleRate = 44100, volume, muted = false, name }) => {
  const host = useContext(HostContext);
  const timeline = useContext(TimelineContext);
  const { fps } = useVideoConfig();
  const params = checkParams("<Sfx>", zzfx);
  checkSampleRate("<Sfx>", sampleRate);
  checkSeed("<Sfx>", seed);
  if (!Number.isInteger(at) || at < 0) {
    throw new Error(`<Sfx>: at must be an integer >= 0 (a frame of the enclosing sequence), got ${JSON.stringify(at)}`);
  }
  if (timeline && timeline.offset + at >= timeline.end) {
    throw new Error(
      `<Sfx>: at={${at}} is not before the end of its sequence (it ends at its frame ${timeline.end - timeline.offset})`
    );
  }
  if (volume !== void 0 && typeof volume !== "function" && !(typeof volume === "number" && Number.isFinite(volume) && volume >= 0)) {
    throw new Error(`<Sfx>: volume must be a number >= 0 or a function (frame) => number, got ${JSON.stringify(volume)}`);
  }
  if (typeof muted !== "boolean") throw new Error(`<Sfx>: muted must be a boolean, got ${JSON.stringify(muted)}`);
  if (name !== void 0 && typeof name !== "string") throw new Error(`<Sfx>: name must be a string, got ${JSON.stringify(name)}`);
  const key = JSON.stringify(["zzfx", params, sampleRate, seed]);
  const collect = Boolean(host?.audio);
  const buffer = useMemo(() => {
    if (!collect) return null;
    return getGenerated(key) ?? setGenerated(key, toAudioBuffer("<Sfx>", [renderZzfx(params, sampleRate, seed)], sampleRate));
  }, [collect, key]);
  useAudioTrack(
    "Sfx",
    buffer && {
      src: null,
      buffer,
      bufferKey: key,
      name: name ?? null,
      trimBefore: 0,
      trimAfter: null,
      playbackRate: 1,
      loop: false,
      muted,
      volume,
      at,
      lengthInFrames: buffer.length / buffer.sampleRate * fps
    }
  );
  return null;
};

export { Sfx, ToneAudio, renderZzfx };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map