/**
 * Where static files come from, as the host passes it to FrameProvider: a
 * base URL (the path is appended, each segment URL-encoded), or a function
 * that returns the URL of a path (a CDN, blob: or signed URLs).
 */
export type StaticFiles = string | ((path: string) => string);

const describe = (value: unknown) => {
  try {
    return typeof value === 'function' ? 'a function' : JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
};

const checkPath = (path: unknown): string => {
  if (typeof path !== 'string' || path === '') {
    throw new Error(`staticFile: path must be a non-empty string, got ${describe(path)}`);
  }
  if (/^[a-z][a-z\d+.-]*:/i.test(path)) {
    throw new Error(`staticFile(${JSON.stringify(path)}): this is already a URL; use it as it is`);
  }
  if (path.startsWith('/')) {
    throw new Error(
      `staticFile(${JSON.stringify(path)}): pass the path inside the static files without a leading slash (${JSON.stringify(path.replace(/^\/+/, ''))})`,
    );
  }
  if (path.split('/').some((segment) => segment === '' || segment === '.' || segment === '..') || path.includes('\\')) {
    throw new Error(`staticFile(${JSON.stringify(path)}): the path must not contain empty, "." or ".." segments or backslashes`);
  }
  return path;
};

/** The resolver of FrameProvider's `staticFiles`; throws on a wrong value. */
export const makeStaticFileResolver = (staticFiles: unknown): ((path: string) => string) => {
  if (typeof staticFiles === 'string') {
    if (staticFiles === '') {
      throw new Error('FrameProvider: staticFiles must be a base URL (a non-empty string, e.g. "/static/") or a function (path) => url, got ""');
    }
    const base = staticFiles.replace(/\/+$/, '');
    // As Remotion's staticFile(): each segment is URL-encoded ("my image#1.png" → "my%20image%231.png").
    return (path) => `${base}/${checkPath(path).split('/').map(encodeURIComponent).join('/')}`;
  }
  if (typeof staticFiles === 'function') {
    return (path) => {
      const url: unknown = staticFiles(checkPath(path));
      if (typeof url !== 'string' || url === '') {
        throw new Error(`staticFile(${JSON.stringify(path)}): the staticFiles function of the FrameProvider must return a non-empty string (a URL), got ${describe(url)}`);
      }
      return url;
    };
  }
  throw new Error(`FrameProvider: staticFiles must be a base URL (a non-empty string) or a function (path) => url, got ${describe(staticFiles)}`);
};

/** What useStaticFile() returns when the host set no staticFiles: it throws, naming the path. */
export const noStaticFiles = (path: string): string => {
  throw new Error(
    `staticFile(${JSON.stringify(checkPath(path))}): the FrameProvider has no staticFiles. The host app decides where static files ` +
      'come from: <FrameProvider staticFiles="https://cdn.example.com/creative/"> (a base URL) or staticFiles={(path) => url}.',
  );
};

