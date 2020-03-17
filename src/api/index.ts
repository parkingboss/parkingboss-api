import { qs } from '@parkingboss/utils';
import { apiBase } from './base';
import { User } from './loadUser';
import { session, SessionControl } from './session';
import { queries, ApiQueries } from './queries';

export interface ApiOptions {
  client: string;
  apiBase?: string;
  skipNormalization?: boolean;
  skipUrlRewrite?: boolean;
}

export interface ApiSettings {
  readonly client: string;
  user: User | null;
  apiBase: string;
  skipNormalization: boolean;
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
    skipNormalization: !!opts.skipNormalization
  };
  if (!opts.apiBase) {
    const watcher = apiBase();
    watcher.subscribe(newBase => settings.apiBase = newBase);
  }
  return settings;
}

export function Api(opts: ApiOptions): Api {
  const settings = optsToSettings(opts);
  const api = Object.assign({ settings },
    session(settings),
    queries(settings),
  );
  if (!opts.skipUrlRewrite) {
    self.history.replaceState(null, '', urlWithoutToken());
  }
  return api;
}

const removables = [ 'token', 'access_token', 'accessToken' ];
function urlWithoutToken(): string {
  const url = new URL(location.toString());
  const hash = qs.parse(url.hash);
  removables.forEach(key => {
    url.searchParams.delete('token');
    delete hash[key];
  });
  url.hash = qs.stringify(hash);
  return url.toString();
}
