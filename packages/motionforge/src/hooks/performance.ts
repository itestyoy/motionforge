// Optimized Hooks for Frame Rendering and Memoization
// These hooks are designed to work within React's strict rules

import { useMemo, useCallback } from 'react';
import { useCurrentFrame, useVideoConfig } from '../core/context';
import { spring, interpolate } from '../utils/animation';

/**
 * Memoized frame value hook: `compute()` runs again when the frame or one of
 * `deps` changes. The value belongs to the calling component.
 */
export function useMemoizedFrame<T>(
  compute: () => T,
  deps: unknown[] = []
): T {
  const frame = useCurrentFrame();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => compute(), [frame, ...deps]);
}

/**
 * Memoized animation value hook
 * Only recomputes when frame changes
 */
export function useAnimationValue<T>(
  compute: (frame: number) => T,
  _frameDeps?: number[]
): T {
  const frame = useCurrentFrame();
  
  // Simply recompute each frame - React's useMemo will handle deduplication
  return useMemo(() => compute(frame), [frame, compute]);
}

/**
 * Cached frame hook - simplified version
 */
export function useCachedFrame<T>(
  compositionId: string,
  renderer: (frame: number) => T
): T {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  
  return useMemo(() => {
    return renderer(frame);
  }, [compositionId, frame, width, height, renderer]);
}

/**
 * Frame range hook for efficient range queries
 */
export function useFrameRange(
  startFrame: number,
  endFrame: number
): number[] {
  return useMemo(() => {
    const frames: number[] = [];
    for (let i = startFrame; i <= endFrame; i++) {
      frames.push(i);
    }
    return frames;
  }, [startFrame, endFrame]);
}

/**
 * Pre-compute frames hook - returns pre-computed values
 */
export function usePrecomputeFrames<T>(
  compute: (frame: number) => T,
  lookahead: number = 10
): Map<number, T> {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  
  return useMemo(() => {
    const cache = new Map<number, T>();
    for (let i = frame; i < Math.min(frame + lookahead, durationInFrames); i++) {
      cache.set(i, compute(i));
    }
    return cache;
  }, [frame, lookahead, durationInFrames, compute]);
}

/**
 * Optimized spring hook with caching
 */
export function useOptimizedSpring(
  config: { damping?: number; stiffness?: number; mass?: number },
  from: number = 0,
  to: number = 1
): number {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  return useMemo(() => {
    return spring({ frame, fps, config, from, to });
  }, [frame, fps, config, from, to]);
}

/**
 * Optimized interpolate hook with caching
 */
export function useOptimizedInterpolate(
  inputRange: number[],
  outputRange: number[],
  options?: { easing?: (t: number) => number; extrapolateLeft?: 'clamp' | 'extend' | 'identity'; extrapolateRight?: 'clamp' | 'extend' | 'identity' }
): (frame: number) => number {
  return useCallback((frame: number) => {
    return interpolate(frame, inputRange, outputRange, options);
  }, [inputRange, outputRange, options]);
}

// Default export for module
const performanceHooks = {
  useMemoizedFrame,
  useAnimationValue,
  useCachedFrame,
  useFrameRange,
  usePrecomputeFrames,
  useOptimizedSpring,
  useOptimizedInterpolate,
};

export default performanceHooks;
