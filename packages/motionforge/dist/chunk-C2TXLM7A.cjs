'use client';'use strict';

var chunk64PBRZLD_cjs = require('./chunk-64PBRZLD.cjs');
var react = require('react');

var useIsomorphicLayoutEffect = typeof window === "undefined" ? react.useEffect : react.useLayoutEffect;
var toError = (error) => {
  if (error instanceof Error) return error;
  return new Error(typeof error === "string" ? error : `cancelRender: ${JSON.stringify(error)}`);
};
var useDelayRender = () => {
  const context = react.useContext(chunk64PBRZLD_cjs.GateContext);
  if (!context) {
    throw new Error("useDelayRender must be used within a FrameProvider");
  }
  const mounted = react.useRef(false);
  const owned = react.useRef(/* @__PURE__ */ new Set());
  useIsomorphicLayoutEffect(() => {
    mounted.current = true;
    const handles = owned.current;
    return () => {
      mounted.current = false;
      handles.forEach(({ internals, handle }) => internals.continue(handle));
      handles.clear();
    };
  }, []);
  return react.useMemo(() => {
    const internals = chunk64PBRZLD_cjs.getGateInternals(context.gate);
    return {
      delayRender: (label) => {
        if (label !== void 0 && typeof label !== "string") {
          throw new Error(`delayRender: label must be a string, got ${JSON.stringify(label)}`);
        }
        if (!mounted.current) {
          throw new Error(
            "delayRender() must be called from an effect or a callback of a mounted component, not during render (React may render a component twice and that handle would never be continued) and not after unmount"
          );
        }
        const handle = internals.delay(label ?? null, context.scope);
        owned.current.add({ internals, handle });
        return handle;
      },
      continueRender: (handle) => {
        internals.continue(handle);
        owned.current.forEach((entry) => {
          if (entry.internals === internals && entry.handle === handle) owned.current.delete(entry);
        });
      },
      cancelRender: (error) => internals.cancel(toError(error))
    };
  }, [context]);
};

exports.useDelayRender = useDelayRender;
//# sourceMappingURL=chunk-C2TXLM7A.cjs.map
//# sourceMappingURL=chunk-C2TXLM7A.cjs.map