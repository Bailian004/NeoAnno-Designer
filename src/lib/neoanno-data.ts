/* NeoAnno data loader: versioned JSON over GitHub Pages (with optional raw fallback)
 *
 * Goals:
 * - Pin to a version (or use latest manifest)
 * - Cache per version in localStorage (simple) + optional integrity checks
 * - Load in parallel and fail gracefully
 * - Support development mode (localhost)
 */

export type DataGame = "anno1800";

export type LatestManifest = {
  [game in DataGame]?: {
    latest: string;        // e.g. "v2.0.1"
    recommended?: string;  // optional alias
    minAppVersion?: string;
    notes?: string;
  };
};

export type VersionManifest = {
  id: string; // "v2.0.1"
  game: DataGame;
  files: string[];
  sha256?: Record<string, string>; // optional checksums per file
};

export type Anno1800Data = {
  meta: any;
  buildings: any;
  goods: any;
  productionChains: any;
  consumption: any;
  services: any;
  residents: any;
  items: any;
  itemEffects: any;
  docklands: any;
  docklandsProgression: any;
  docklandsUi: any;
  buildReport: any;
};

export type LoaderOptions = {
  game?: DataGame; // default "anno1800"
  pinnedVersion?: string; // e.g. "v2.0.1"
  useRecommended?: boolean; // default true
  // Development mode: load from localhost instead of GitHub
  devMode?: boolean; // default false; if true, ignores pagesBaseUrl/rawBaseUrl
  devPort?: number; // default 3000
  // Prefer Pages for browser apps:
  pagesBaseUrl: string; // e.g. "https://bailian004.github.io/neoanno-data"
  // Optional fallback for cases where Pages is blocked:
  rawBaseUrl?: string; // e.g. "https://raw.githubusercontent.com/Bailian004/neoanno-data/main"
  // Cache:
  cacheTtlMs?: number; // default 24h (disabled in devMode)
  // If manifests include sha256, you can validate cached files.
  validateChecksums?: boolean; // default false
};

const DEFAULT_FILES = [
  "meta.json",
  "buildings.json",
  "goods.json",
  "productionChains.json",
  "consumption.json",
  "services.json",
  "residents.json",
  "items.json",
  "itemEffects.json",
  "docklands.json",
  "docklands-progression.json",
  "docklands-ui.json",
  "build-report.json",
];

function nowMs() {
  return Date.now();
}

function cacheKey(parts: string[]) {
  return ["neoanno-data", ...parts].join(":");
}

function safeJsonParse<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

async function fetchJsonWithFallback(urls: string[]): Promise<any> {
  let lastErr: any = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("Failed to fetch JSON");
}

async function fetchTextWithFallback(urls: string[]): Promise<string> {
  let lastErr: any = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.text();
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("Failed to fetch text");
}

// Optional sha256 support (browser SubtleCrypto)
async function sha256Hex(text: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function buildUrls(pagesBase: string, rawBase: string | undefined, path: string): string[] {
  const pages = `${pagesBase.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  const raw = rawBase
    ? `${rawBase.replace(/\/$/, "")}/${path.replace(/^\//, "")}`
    : null;
  return raw ? [pages, raw] : [pages];
}

function buildDevUrls(port: number, path: string): string[] {
  const devBase = `http://localhost:${port}`;
  return [`${devBase}/${path.replace(/^\//, "")}`];
}

export async function loadAnnoData(opts: LoaderOptions): Promise<{ version: string; data: Anno1800Data }> {
  const game: DataGame = opts.game ?? "anno1800";
  const devMode = opts.devMode ?? false;
  const devPort = opts.devPort ?? 3000;
  const cacheTtlMs = devMode ? 0 : (opts.cacheTtlMs ?? 24 * 60 * 60 * 1000);

  // 1) Determine version
  let version = opts.pinnedVersion;
  if (!version) {
    const latestUrls = devMode
      ? buildDevUrls(devPort, "versions/latest.json")
      : buildUrls(opts.pagesBaseUrl, opts.rawBaseUrl, "versions/latest.json");
    const latest = (await fetchJsonWithFallback(latestUrls)) as LatestManifest;
    const entry = latest[game];
    if (!entry?.latest) throw new Error(`No latest version for ${game}`);
    version = (opts.useRecommended ?? true) && entry.recommended ? entry.recommended : entry.latest;
  }

  // 2) Fetch optional version manifest
  const manifestUrls = devMode
    ? buildDevUrls(devPort, `versions/${version}.json`)
    : buildUrls(opts.pagesBaseUrl, opts.rawBaseUrl, `versions/${version}.json`);
  let vManifest: VersionManifest | null = null;
  try {
    vManifest = (await fetchJsonWithFallback(manifestUrls)) as VersionManifest;
  } catch {
    // ok: version manifest is optional
  }

  const files = vManifest?.files?.length ? vManifest.files : DEFAULT_FILES;

  // 3) Load each file with caching (skip caching in dev mode)
  const results: Record<string, any> = {};

  await Promise.all(
    files.map(async (fileName) => {
      const ck = cacheKey([game, version!, fileName]);
      const tk = cacheKey([game, version!, fileName, "ts"]);
      const cachedTs = safeJsonParse<number>(localStorage.getItem(tk));
      const cachedPayload = localStorage.getItem(ck);

      const isFresh = !devMode && cachedTs != null && nowMs() - cachedTs < cacheTtlMs && !!cachedPayload;

      if (isFresh) {
        // Optional checksum validation
        if (opts.validateChecksums && vManifest?.sha256?.[fileName]) {
          const expected = vManifest.sha256[fileName];
          const actual = await sha256Hex(cachedPayload!);
          if (actual !== expected) {
            // Invalidate cache and refetch
            localStorage.removeItem(ck);
            localStorage.removeItem(tk);
          } else {
            results[fileName] = JSON.parse(cachedPayload!);
            return;
          }
        } else {
          results[fileName] = JSON.parse(cachedPayload!);
          return;
        }
      }

      // Fetch fresh
      const urls = devMode
        ? buildDevUrls(devPort, `${game}/${version}/${fileName}`)
        : buildUrls(opts.pagesBaseUrl, opts.rawBaseUrl, `${game}/${version}/${fileName}`);
      const text = await fetchTextWithFallback(urls);

      // Validate checksum if available
      if (opts.validateChecksums && vManifest?.sha256?.[fileName]) {
        const expected = vManifest.sha256[fileName];
        const actual = await sha256Hex(text);
        if (actual !== expected) {
          throw new Error(`Checksum mismatch for ${fileName} (${version})`);
        }
      }

      // Only cache if not in dev mode
      if (!devMode) {
        localStorage.setItem(ck, text);
        localStorage.setItem(tk, JSON.stringify(nowMs()));
      }
      results[fileName] = JSON.parse(text);
    })
  );

  // 4) Shape the data object (fixed keys for convenience)
  const data: Anno1800Data = {
    meta: results["meta.json"],
    buildings: results["buildings.json"],
    goods: results["goods.json"],
    productionChains: results["productionChains.json"],
    consumption: results["consumption.json"],
    services: results["services.json"],
    residents: results["residents.json"],
    items: results["items.json"],
    itemEffects: results["itemEffects.json"],
    docklands: results["docklands.json"],
    docklandsProgression: results["docklands-progression.json"],
    docklandsUi: results["docklands-ui.json"],
    buildReport: results["build-report.json"],
  };

  // 5) Basic sanity check
  if (!data?.meta?.version) {
    throw new Error(`Loaded data missing meta.version (${game} ${version})`);
  }

  return { version, data };
}
