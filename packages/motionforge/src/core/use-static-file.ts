'use client';

import { useContext } from 'react';
import { HostContext } from './context';
import { noStaticFiles } from './static-files';

/**
 * Remotion's staticFile() for the FrameProvider this component is in: returns
 * a function from a path inside the static files ("images/hero.png") to its
 * URL, as the host configured with FrameProvider's `staticFiles`. The URLs
 * are plain strings: use them with Img, Video, Audio, prefetch(), CSS or
 * anything else.
 *
 *   const staticFile = useStaticFile();
 *   <Img src={staticFile('images/hero.png')} />
 */
export const useStaticFile = (): ((path: string) => string) => {
  const host = useContext(HostContext);
  if (!host) {
    throw new Error('useStaticFile must be used within a FrameProvider');
  }
  return host.staticFiles ?? noStaticFiles;
};
