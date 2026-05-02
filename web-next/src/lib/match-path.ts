export function matchPath(pattern: { path: string; end?: boolean }, pathname: string) {
  // Convert /path/:slug to a simple regex.
  // This simplistic approach handles the basic routes used in routeMeta.ts.
  const regexPath = pattern.path.replace(/:([^\/]+)/g, '(?<$1>[^/]+)');
  const regex = new RegExp(`^${regexPath}${pattern.end ? '$' : '(/|$)'}`);
  
  const match = pathname.match(regex);
  if (!match) return null;

  return {
    params: match.groups || {},
    pathname: match[0],
    pattern,
  };
}
