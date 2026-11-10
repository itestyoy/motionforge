'use client';// src/utils/fetch-asset.ts
var serializeRequestInit = (requestInit) => {
  if (!requestInit) return null;
  const { signal: _signal, headers, ...rest } = requestInit;
  return JSON.stringify({
    ...rest,
    headers: headers && typeof Headers !== "undefined" ? Array.from(new Headers(headers).entries()) : headers ?? null
  });
};
var resolveSrc = (src) => typeof document === "undefined" ? src : new URL(src, document.baseURI).href;
var checkSrc = (fn, src) => {
  if (typeof src !== "string" || src === "") {
    throw new TypeError(`${fn}: src must be a non-empty string, got ${JSON.stringify(src)}`);
  }
};
var fetchAsset = async (fn, src, requestInit, signal) => {
  let response;
  try {
    response = await fetch(src, { ...requestInit, ...signal ? { signal } : null });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${fn} could not load ${src}: ${message} (a remote file must allow CORS)`);
  }
  if (!response.ok) {
    throw new Error(`${fn} could not load ${src}: HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ""}`);
  }
  return response;
};
var rejectProps = (component, props, names) => {
  for (const name of Object.keys(names)) {
    if (name in props && props[name] !== void 0) {
      throw new Error(`${component} does not take "${name}": ${names[name]}`);
    }
  }
};
var sequenceHint = (name) => `put it inside <Sequence ${name}={...}> instead`;
var SEQUENCE_PROPS = Object.fromEntries(
  [
    "from",
    "durationInFrames",
    "trimBefore",
    "premountFor",
    "postmountFor",
    "styleWhilePremounted",
    "styleWhilePostmounted",
    "name",
    "showInTimeline",
    "hidden",
    "loop",
    "freeze"
  ].map((name) => [name, sequenceHint(name)])
);
var CROP_AND_EFFECT_PROPS = {
  cropLeft: 'crop with style={{ clipPath: "inset(...)" }}',
  cropRight: 'crop with style={{ clipPath: "inset(...)" }}',
  cropTop: 'crop with style={{ clipPath: "inset(...)" }}',
  cropBottom: 'crop with style={{ clipPath: "inset(...)" }}',
  effects: "effects are not supported",
  effectsOutputSize: "effects are not supported"
};

export { CROP_AND_EFFECT_PROPS, SEQUENCE_PROPS, checkSrc, fetchAsset, rejectProps, resolveSrc, serializeRequestInit };
//# sourceMappingURL=chunk-WVAVUOFE.js.map
//# sourceMappingURL=chunk-WVAVUOFE.js.map