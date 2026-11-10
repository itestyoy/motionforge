'use client';'use strict';

var chunkM5DYJOS5_cjs = require('../chunk-M5DYJOS5.cjs');
var chunkVLRD4ANM_cjs = require('../chunk-VLRD4ANM.cjs');
var react = require('react');

// src/core/generated-audio.ts
var Generated = class {
  constructor(kind, key, make) {
    this.kind = kind;
    this.key = key;
    this.make = make;
    this.rendered = null;
    this.pending = null;
  }
  get buffer() {
    return this.rendered;
  }
  render() {
    if (this.rendered) return Promise.resolve(this.rendered);
    if (this.pending) return this.pending;
    let made;
    try {
      made = this.make();
    } catch (error) {
      return Promise.reject(error);
    }
    if (!(made instanceof Promise)) {
      this.rendered = made;
      return Promise.resolve(made);
    }
    const pending = made.then(
      (buffer) => {
        this.rendered = buffer;
        this.pending = null;
        return buffer;
      },
      (error) => {
        this.pending = null;
        throw error;
      }
    );
    this.pending = pending;
    return pending;
  }
  renderNow() {
    if (!this.rendered) {
      const made = this.make();
      if (made instanceof Promise) throw new Error(`renderNow: ${this.kind} audio renders asynchronously`);
      this.rendered = made;
    }
    return this.rendered;
  }
};
var LIMIT = 64;
var descriptors = /* @__PURE__ */ new Map();
var generatedAudio = (kind, key, make) => {
  let descriptor = descriptors.get(key);
  if (descriptor) {
    descriptors.delete(key);
  } else {
    descriptor = new Generated(kind, key, make);
  }
  descriptors.set(key, descriptor);
  while (descriptors.size > LIMIT) descriptors.delete(descriptors.keys().next().value);
  return descriptor;
};

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

// src/components/audio/generated-utils.ts
var describe = (value) => {
  if (typeof value === "function") return "a function";
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
};
var editDistance = (a, b) => {
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    previous = current;
  }
  return previous[b.length];
};
var closestProp = (name, spec) => {
  const lower = name.toLowerCase().replace(/[-_\s]/g, "");
  if (Object.prototype.hasOwnProperty.call(spec.aliases, lower)) return spec.aliases[lower];
  let best = null;
  let bestDistance = Infinity;
  for (const accepted of spec.accepted) {
    const distance = editDistance(lower, accepted.toLowerCase());
    const limit = accepted.length >= 6 ? 2 : 1;
    if (distance <= limit && distance < bestDistance) {
      best = accepted;
      bestDistance = distance;
    }
  }
  return best;
};
var checkKnownProps = (spec, props) => {
  const unknown = Object.keys(props).filter((name) => !spec.accepted.includes(name));
  if (unknown.length === 0) return;
  const notes = spec.notes ?? {};
  const explained = unknown.map((name) => {
    const lower = name.toLowerCase().replace(/[-_\s]/g, "");
    if (Object.prototype.hasOwnProperty.call(notes, lower)) return `\`${name}\` (${notes[lower]})`;
    const meant = closestProp(name, spec);
    return meant ? `\`${name}\` (did you mean \`${meant}\`?)` : `\`${name}\``;
  });
  const takes = spec.accepted.map((name) => spec.required.includes(name) ? `${name} (required)` : name).join(", ");
  throw new Error(
    `${spec.component}: unknown ${spec.noun}${unknown.length > 1 ? "s" : ""} ${explained.join(", ")}. ${spec.subject ?? spec.component} takes ${takes}, e.g. ${spec.example}`
  );
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
  const rendered = await context.render(false);
  const buffer = rendered.get();
  if (!buffer) throw new Error("<ToneAudio>: the offline render returned no audio");
  return buffer;
};
var renderQueued = (job) => {
  const promise = queue.then(() => renderOffline(job));
  queue = promise.catch(() => void 0);
  return promise;
};
var toneKey = (render, deps, durationInFrames, fps, sampleRate, channels, seed) => JSON.stringify(["tone", String(render), deps, durationInFrames, fps, sampleRate, channels, seed]);
var toneAudio = (job) => generatedAudio(
  "tone",
  toneKey(job.render, job.deps, job.durationInFrames, job.fps, job.sampleRate, job.channels, job.seed),
  () => renderQueued(job)
);
var RENDER_EXAMPLE = "(Tone) => { new Tone.Synth().toDestination().triggerAttackRelease('C5', '8n', 0); }";
var usage = (style, name, value) => style === "jsx" ? `${name}={${value}}` : `${name}: ${value}`;
var checkToneProps = (component, { durationInFrames, render, deps, sampleRate, channels }, style = "jsx") => {
  if (durationInFrames === void 0) {
    throw new Error(
      `${component}: pass the length of the sound in frames as \`${usage(style, "durationInFrames", "30")}\` (got no \`durationInFrames\`)`
    );
  }
  if (!Number.isInteger(durationInFrames) || durationInFrames <= 0) {
    throw new Error(`${component}: durationInFrames must be a positive integer, got ${JSON.stringify(durationInFrames)}`);
  }
  if (render === void 0) {
    throw new Error(`${component}: pass the Tone.js code as \`${usage(style, "render", RENDER_EXAMPLE)}\` (got no \`render\`)`);
  }
  if (typeof render !== "function") {
    throw new Error(
      `${component}: \`render\` must be a function of Tone with the Tone.js code, e.g. \`${usage(style, "render", RENDER_EXAMPLE)}\`, got ${describe(render)}`
    );
  }
  if (deps !== void 0 && !Array.isArray(deps)) {
    throw new Error(`${component}: deps must be an array, got ${JSON.stringify(deps)}`);
  }
  if (deps !== void 0) checkJson(component, "deps", deps);
  if (!Number.isInteger(sampleRate) || sampleRate < 3e3 || sampleRate > 768e3) {
    throw new Error(`${component}: sampleRate must be an integer from 3000 to 768000 (Hz), got ${JSON.stringify(sampleRate)}`);
  }
  if (channels !== 1 && channels !== 2) {
    throw new Error(`${component}: channels must be 1 or 2, got ${JSON.stringify(channels)}`);
  }
};
var TONE_ALIASES = {
  ...Object.fromEntries(
    ["duration", "durationframes", "length", "lengthinframes", "frames", "numframes"].map((name) => [name, "durationInFrames"])
  ),
  ...Object.fromEntries(
    ["code", "fn", "func", "function", "synth", "callback", "cb", "play", "compose", "build", "tone", "music", "onrender", "children"].map(
      (name) => [name, "render"]
    )
  ),
  ...Object.fromEntries(["dependencies", "dependson", "inputs", "data"].map((name) => [name, "deps"])),
  ...Object.fromEntries(["gain", "vol", "level", "loudness"].map((name) => [name, "volume"])),
  ...Object.fromEntries(["mute", "silent"].map((name) => [name, "muted"])),
  ...Object.fromEntries(["label", "title", "trackname"].map((name) => [name, "name"])),
  ...Object.fromEntries(["rate", "hz"].map((name) => [name, "sampleRate"])),
  ...Object.fromEntries(["channelcount", "numberofchannels", "numchannels"].map((name) => [name, "channels"])),
  ...Object.fromEntries(["randomseed", "rngseed"].map((name) => [name, "seed"]))
};
var TONE_NOTES = {
  ...Object.fromEntries(
    ["at", "from", "start", "startat", "startframe", "startfrom", "frame", "delay", "offset", "time", "when"].map((name) => [
      name,
      "<ToneAudio> starts at the start of its sequence: put it in <Sequence from={12}>, or schedule notes later inside render"
    ])
  ),
  ...Object.fromEntries(
    ["durationinseconds", "seconds"].map((name) => [name, "the length is durationInFrames, in frames (seconds \xD7 fps)"])
  ),
  ...Object.fromEntries(
    ["zzfx", "params", "parameters", "preset"].map((name) => [
      name,
      "a ZzFX sound is <Sfx zzfx={[1, 0, 900, 0, 0.02, 0.04]} />, also from 'motionforge/audio'"
    ])
  ),
  ...Object.fromEntries(["src", "url", "file"].map((name) => [name, `a sound file is <Audio src="..." /> from 'motionforge'`]))
};
var TONE_PROPS = {
  component: "<ToneAudio>",
  noun: "prop",
  accepted: ["durationInFrames", "render", "deps", "seed", "sampleRate", "channels", "volume", "muted", "name"],
  required: ["durationInFrames", "render"],
  aliases: TONE_ALIASES,
  notes: TONE_NOTES,
  example: `<ToneAudio durationInFrames={30} render={${RENDER_EXAMPLE}} />`
};
var ToneAudio = (props) => {
  const { durationInFrames, render, deps = [], seed = 0, sampleRate = 48e3, channels = 2, volume, muted = false, name } = props;
  checkKnownProps(TONE_PROPS, props);
  checkToneProps("<ToneAudio>", { ...props, sampleRate, channels });
  checkSeed("<ToneAudio>", seed);
  if (typeof muted !== "boolean") throw new Error(`<ToneAudio>: muted must be a boolean, got ${JSON.stringify(muted)}`);
  if (name !== void 0 && typeof name !== "string") throw new Error(`<ToneAudio>: name must be a string, got ${JSON.stringify(name)}`);
  if (volume !== void 0 && typeof volume !== "function" && !(typeof volume === "number" && Number.isFinite(volume) && volume >= 0)) {
    throw new Error(`<ToneAudio>: volume must be a number >= 0 or a function (frame) => number, got ${JSON.stringify(volume)}`);
  }
  const host = react.useContext(chunkVLRD4ANM_cjs.HostContext);
  const listened = Boolean(host?.audio);
  const { fps } = chunkVLRD4ANM_cjs.useVideoConfig();
  const { delayRender, continueRender, cancelRender } = chunkVLRD4ANM_cjs.useDelayRender();
  const key = toneKey(render, deps, durationInFrames, fps, sampleRate, channels, seed);
  const generated = react.useMemo(
    () => listened ? toneAudio({ render, deps, durationInFrames, fps, durationInSeconds: durationInFrames / fps, sampleRate, channels, seed }) : null,
    // The other inputs are in `key`.
    [listened, key]
  );
  chunkM5DYJOS5_cjs.useAudioTrack(
    "ToneAudio",
    generated && {
      src: null,
      generated,
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
  react.useEffect(() => {
    if (!generated || generated.buffer) return;
    const handle = delayRender(`<ToneAudio> rendering ${durationInFrames} frames offline`);
    let active = true;
    generated.render().then(
      () => {
        if (active) continueRender(handle);
      },
      (error) => {
        if (!active) return;
        cancelRender(error);
        continueRender(handle);
      }
    );
    return () => {
      active = false;
      continueRender(handle);
    };
  }, [generated, durationInFrames, delayRender, continueRender, cancelRender]);
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
var ZZFX_EXAMPLE = "[1, 0, 900, 0, 0.02, 0.04]";
var checkParams = (component, params, usage2 = `zzfx={${ZZFX_EXAMPLE}}`, name = "zzfx") => {
  if (params === void 0) {
    throw new Error(`${component}: pass the ZzFX parameters as \`${usage2}\` (got no \`${name}\`)`);
  }
  if (!Array.isArray(params)) {
    throw new Error(
      `${component}: \`${name}\` must be an array of numbers (the ZzFX parameters), e.g. \`${usage2}\`, got ${describe(params)}`
    );
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
  const values = checkParams("renderZzfx", params, `renderZzfx(${ZZFX_EXAMPLE})`, "params");
  checkSampleRate("renderZzfx", sampleRate);
  checkSeed("renderZzfx", seed);
  const samples = buildZzfxSamples(sampleRate, seededRandom(seed), values);
  for (let i = 0; i < samples.length; i++) samples[i] *= ZZFX_VOLUME;
  return samples;
};
var sfxKey = (params, sampleRate, seed) => JSON.stringify(["zzfx", params, sampleRate, seed]);
var samplesByKey = /* @__PURE__ */ new Map();
var zzfxSamples = (key, params, sampleRate, seed) => {
  let samples = samplesByKey.get(key);
  if (samples) {
    samplesByKey.delete(key);
  } else {
    samples = renderZzfx(params, sampleRate, seed);
  }
  samplesByKey.set(key, samples);
  while (samplesByKey.size > 64) samplesByKey.delete(samplesByKey.keys().next().value);
  return samples;
};
var sfxAudio = (params, sampleRate, seed) => {
  const key = sfxKey(params, sampleRate, seed);
  return {
    generated: generatedAudio("zzfx", key, () => toAudioBuffer("<Sfx>", [zzfxSamples(key, params, sampleRate, seed)], sampleRate)),
    length: () => zzfxSamples(key, params, sampleRate, seed).length
  };
};
var SFX_ALIASES = {
  ...Object.fromEntries(
    ["params", "param", "parameters", "zzfxparams", "zzfxparameters", "sound", "sfx", "preset", "effect", "args", "values", "settings", "config"].map(
      (name) => [name, "zzfx"]
    )
  ),
  ...Object.fromEntries(
    ["start", "startat", "startframe", "startfrom", "from", "frame", "atframe", "delay", "offset", "time", "when"].map((name) => [name, "at"])
  ),
  ...Object.fromEntries(["gain", "vol", "level", "loudness"].map((name) => [name, "volume"])),
  ...Object.fromEntries(["mute", "silent"].map((name) => [name, "muted"])),
  ...Object.fromEntries(["label", "title", "trackname"].map((name) => [name, "name"])),
  ...Object.fromEntries(["rate", "hz"].map((name) => [name, "sampleRate"])),
  ...Object.fromEntries(["randomseed", "rngseed"].map((name) => [name, "seed"]))
};
var SFX_NOTES = {
  ...Object.fromEntries(
    ["duration", "durationinframes", "length", "lengthinframes", "frames"].map((name) => [
      name,
      "a ZzFX sound is as long as its parameters make it: attack, sustain and release, zzfx[3], zzfx[4] and zzfx[5], in seconds"
    ])
  ),
  ...Object.fromEntries(
    ["render", "code", "fn", "synth"].map((name) => [
      name,
      "Tone.js code is <ToneAudio durationInFrames={30} render={(Tone) => { ... }} />, also from 'motionforge/audio'"
    ])
  ),
  ...Object.fromEntries(["src", "url", "file"].map((name) => [name, `a sound file is <Audio src="..." /> from 'motionforge'`])),
  children: "<Sfx> renders nothing and takes no children"
};
var SFX_PROPS = {
  component: "<Sfx>",
  noun: "prop",
  accepted: ["zzfx", "at", "seed", "sampleRate", "volume", "muted", "name"],
  required: ["zzfx"],
  aliases: SFX_ALIASES,
  notes: SFX_NOTES,
  example: `<Sfx at={12} zzfx={${ZZFX_EXAMPLE}} />`
};
var Sfx = (props) => {
  const { zzfx, at = 0, seed = 0, sampleRate = 44100, volume, muted = false, name } = props;
  const host = react.useContext(chunkVLRD4ANM_cjs.HostContext);
  const timeline = react.useContext(chunkVLRD4ANM_cjs.TimelineContext);
  const collecting = chunkM5DYJOS5_cjs.useIsCollectingAudio();
  const { fps } = chunkVLRD4ANM_cjs.useVideoConfig();
  checkKnownProps(SFX_PROPS, props);
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
  const key = sfxKey(params, sampleRate, seed);
  const listened = Boolean(host?.audio);
  const sound = react.useMemo(() => {
    if (!listened) return null;
    const { generated, length } = sfxAudio(params, sampleRate, seed);
    if (!collecting) generated.renderNow();
    return { generated, length: length() };
  }, [listened, collecting, key]);
  chunkM5DYJOS5_cjs.useAudioTrack(
    "Sfx",
    sound && {
      src: null,
      generated: sound.generated,
      name: name ?? null,
      trimBefore: 0,
      trimAfter: null,
      playbackRate: 1,
      loop: false,
      muted,
      volume,
      at,
      lengthInFrames: sound.length / sampleRate * fps
    }
  );
  return null;
};
var PLAYBACK = ["at", "volume", "muted", "name"];
var soundKeys = (type, where, accepted, required, aliases, example) => {
  const component = type === "sfx" ? "<Sfx>" : "<ToneAudio>";
  const playback = (name) => `where and how a sound plays (\`${name}\`) goes on the ${component} that plays it, not in the prepared sound`;
  const notes = Object.fromEntries(PLAYBACK.map((name) => [name.toLowerCase(), playback(name)]));
  const own = {};
  for (const [alias, name] of Object.entries(aliases)) {
    if (accepted.includes(name)) own[alias] = name;
    else if (PLAYBACK.includes(name)) notes[alias] = playback(name);
  }
  return { component: where, subject: `A ${type} sound`, noun: "key", accepted, required, aliases: own, notes, example };
};
var sfxKeys = (where) => soundKeys("sfx", where, ["type", "zzfx", "seed", "sampleRate"], ["type", "zzfx"], SFX_ALIASES, `{ type: 'sfx', zzfx: ${ZZFX_EXAMPLE} }`);
var toneKeys = (where) => soundKeys(
  "tone",
  where,
  ["type", "durationInFrames", "render", "deps", "seed", "sampleRate", "channels"],
  ["type", "durationInFrames", "render"],
  TONE_ALIASES,
  "{ type: 'tone', durationInFrames: 30, render: (Tone) => { new Tone.Synth().toDestination().triggerAttackRelease('C5', '8n', 0); } }"
);
var SOUND_SHAPES = `{ type: 'sfx', zzfx: ${ZZFX_EXAMPLE} } (a ZzFX sound) or { type: 'tone', durationInFrames: 30, render: (Tone) => { ... } } (Tone.js code)`;
var typeHint = (sound) => {
  const keys = Object.keys(sound).map((key) => key.toLowerCase());
  const type = typeof sound.type === "string" ? sound.type.toLowerCase() : null;
  if (type === "zzfx" || keys.includes("zzfx")) return ` (with \`zzfx\` it is \`type: 'sfx'\`)`;
  if (type === "toneaudio" || keys.includes("render") || keys.includes("durationinframes")) {
    return ` (with \`render\` it is \`type: 'tone'\`)`;
  }
  return "";
};
var usePrepareAudio = (sounds) => {
  if (!Array.isArray(sounds)) {
    throw new Error(`usePrepareAudio: sounds must be an array, got ${describe(sounds)}`);
  }
  const host = react.useContext(chunkVLRD4ANM_cjs.HostContext);
  const listened = Boolean(host?.audio);
  const collecting = chunkM5DYJOS5_cjs.useIsCollectingAudio();
  const { fps } = chunkVLRD4ANM_cjs.useVideoConfig();
  const { delayRender, continueRender, cancelRender } = chunkVLRD4ANM_cjs.useDelayRender();
  const keys = sounds.map((sound, index) => {
    const where = `usePrepareAudio: sounds[${index}]`;
    if (typeof sound !== "object" || sound === null || Array.isArray(sound)) {
      throw new Error(`${where} must be ${SOUND_SHAPES}, got ${describe(sound)}`);
    }
    if (sound.type !== "sfx" && sound.type !== "tone") {
      const raw = sound;
      const got = "type" in raw ? `\`type: ${describe(raw.type)}\`` : "no `type`";
      throw new Error(`${where} must be ${SOUND_SHAPES}${typeHint(raw)}, got ${got}: ${describe(raw)}`);
    }
    checkKnownProps(sound.type === "sfx" ? sfxKeys(where) : toneKeys(where), sound);
    const seed = sound.seed ?? 0;
    checkSeed(where, seed);
    if (sound.type === "sfx") {
      const sampleRate2 = sound.sampleRate ?? 44100;
      checkSampleRate(where, sampleRate2);
      return sfxKey(checkParams(where, sound.zzfx, `zzfx: ${ZZFX_EXAMPLE}`), sampleRate2, seed);
    }
    const sampleRate = sound.sampleRate ?? 48e3;
    const channels = sound.channels ?? 2;
    checkToneProps(where, { ...sound, sampleRate, channels }, "object");
    return toneKey(sound.render, sound.deps ?? [], sound.durationInFrames, fps, sampleRate, channels, seed);
  });
  const key = keys.join("\n");
  const latest = react.useRef(sounds);
  latest.current = sounds;
  const generated = react.useMemo(
    () => listened && !collecting ? latest.current.map(
      (sound) => sound.type === "sfx" ? sfxAudio(checkParams("usePrepareAudio", sound.zzfx), sound.sampleRate ?? 44100, sound.seed ?? 0).generated : toneAudio({
        render: sound.render,
        deps: sound.deps ?? [],
        durationInFrames: sound.durationInFrames,
        fps,
        durationInSeconds: sound.durationInFrames / fps,
        sampleRate: sound.sampleRate ?? 48e3,
        channels: sound.channels ?? 2,
        seed: sound.seed ?? 0
      })
    ) : [],
    [listened, collecting, key, fps]
  );
  const cached = generated.every((sound) => sound.buffer !== null);
  const [renderedKey, setRenderedKey] = react.useState(null);
  const handle = react.useRef(null);
  react.useEffect(() => {
    if (cached) return void 0;
    const current = delayRender(`usePrepareAudio rendering ${generated.length} sound${generated.length === 1 ? "" : "s"}`);
    handle.current = current;
    let active = true;
    Promise.all(generated.map((sound) => sound.render())).then(
      () => {
        if (active) setRenderedKey(key);
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
  }, [generated, cached, key, delayRender, continueRender, cancelRender]);
  react.useEffect(() => {
    if (renderedKey === key && handle.current !== null) {
      continueRender(handle.current);
      handle.current = null;
    }
  }, [renderedKey, key, continueRender]);
  return cached || renderedKey === key;
};

exports.Sfx = Sfx;
exports.ToneAudio = ToneAudio;
exports.renderZzfx = renderZzfx;
exports.usePrepareAudio = usePrepareAudio;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map