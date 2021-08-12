import { apiBase } from "./base";
import { User } from "./loadUser";
import { session, SessionControl } from "./session";
import { queries, ApiQueries } from "./queries";

export interface ApiOptions {
  client: string;
  apiBase?: string;
  skipUrlRewrite?: boolean;
}

export interface ApiSettings {
  readonly client: string;
  user: User | null;
  apiBase: string;
}

export interface CoreApi {
  settings: ApiSettings;
}

export type Api = CoreApi & SessionControl & ApiQueries;

function optsToSettings(opts: ApiOptions): ApiSettings {
  const settings: ApiSettings = {
    client: opts.client,
    user: null,
    apiBase: opts.apiBase || "TEMP_FAKE",
  };
  if (!opts.apiBase) {
    const watcher = apiBase();
    watcher.subscribe((newBase) => (settings.apiBase = newBase));
  }
  return settings;
}

export function Api(opts: ApiOptions): Api {
  const settings = optsToSettings(opts);
  const api = Object.assign({ settings }, session(settings), queries(settings));
  if (!opts.skipUrlRewrite) {
    self.history.replaceState(null, "", urlWithoutToken());
  }
  return api;
}

const removables = ["token", "access_token", "accessToken"];
function urlWithoutToken(): string {
  const url = new URL(location.toString());

  const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
  removables.forEach((key) => {
    url.searchParams.delete(key);
    hash.delete(key);
  });
  url.hash = hash.toString();

  return url.toString();
}
