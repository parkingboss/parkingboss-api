import { apiBase, BaseWatcher } from './base';
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
    watcher.subscribe(newBase => opts.apiBase = newBase);
  }
  return settings;
}

export function Api(opts: ApiOptions): Api {
  const settings = optsToSettings(opts);
  return Object.assign({ settings },
    session(settings),
    queries(settings),
  );
}
