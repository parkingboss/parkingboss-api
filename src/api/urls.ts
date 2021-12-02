export interface URLToPathOpts {
  skipHash?: boolean;
  absolute?: boolean;
}

function urlToPath(url: URL, opts: URLToPathOpts = {}) {
  const copied = new URL(url.href);

  if (opts.skipHash) {
    copied.hash = "";
  }

  // Reminder: replace only replaces the first copy unless the first argument is a global regex
  return copied.href.replace(copied.origin, opts.absolute ? copied.origin : "");
}

export interface UrlOpts {
  query?: Record<string, null | string | string[]>;
  hash?: string | false;
  absolute?: true;
}

export type UrlLike = string | URL | Location;

function isUrlLike(x: any): x is UrlLike {
  return typeof x == "string" || x instanceof URL || x instanceof Location;
}

export function build(url: UrlLike): string;
export function build(opts: UrlOpts): string;
export function build(url: UrlLike, opts: UrlOpts): string;
export function build(urlOrOpt: UrlLike | UrlOpts, maybeOpt?: UrlOpts): string {
  const urlArg: UrlLike = isUrlLike(urlOrOpt) ? urlOrOpt : self.location;
  const opts: UrlOpts = maybeOpt || (isUrlLike(urlOrOpt) ? {} : urlOrOpt);
  const url = new URL(urlArg.toString(), document.baseURI);

  Object.entries(opts.query || {}).forEach(([key, val]) => {
    if (val) {
      (Array.isArray(val) ? val : [val]).forEach((v, ix) => {
        if (ix == 0) {
          url.searchParams.set(key, v);
        } else {
          url.searchParams.append(key, v);
        }
      });
    } else {
      url.searchParams.delete(key);
    }
  });

  if (opts.hash) {
    url.hash = opts.hash;
  }

  return urlToPath(url, { skipHash: opts.hash === false, absolute: opts.absolute });
}

export interface LoginUrlParams {
  clientId: string;
  email?: string;
  redirectUrl?: string;
}

export function buildLoginUrl({ clientId, email, redirectUrl }: LoginUrlParams) {
  return build("https://auth.communityboss.app/login", {
    query: {
      client_id: clientId,
      login_hint: email || null,
      redirect_uri: redirectUrl || location.href,
    },
    absolute: true,
  });
}
