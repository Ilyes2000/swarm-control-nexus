const defaultHttpBase = (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? "";
const explicitWsBase = (import.meta.env.VITE_BACKEND_WS_URL as string | undefined) ?? "";

export function getMissionApiBaseUrl() {
  return defaultHttpBase.replace(/\/$/, "");
}

export function getMissionApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getMissionApiBaseUrl()}${normalizedPath}`;
}

export function getMissionWsUrl() {
  if (explicitWsBase) {
    return explicitWsBase;
  }

  if (defaultHttpBase) {
    const url = new URL(defaultHttpBase);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = "/ws";
    url.search = "";
    url.hash = "";
    return url.toString();
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws`;
}
