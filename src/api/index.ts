import { apiBase, BaseWatcher } from './base';
import { User } from './loadUser';
import { session, SessionControl } from './session';
import { queries, ApiQueries } from './queries';

export interface ApiOptions {
  client: string;
  apiBase?: string | BaseWatcher;
  skipNormalization?: boolean;
  skipUrlRewrite?: boolean;
}

export interface ApiSettings {
  readonly client: string;
  user: User | null;
  apiBase: string | BaseWatcher;
  skipNormalization: boolean;
}

export interface CoreApi {
  settings: ApiSettings;
}

export type Api = CoreApi & SessionControl & ApiQueries;

export function Api(opts: ApiOptions): Api {
  const settings: ApiSettings = {
    client: opts.client,
    user: null,
    apiBase: opts.apiBase || apiBase(),
    skipNormalization: !!opts.skipNormalization,
  };

  return Object.assign({ settings },
    session(settings),
    queries(settings),
  );
}
