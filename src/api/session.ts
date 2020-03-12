import { ApiSettings } from './index';
import * as urls from '../urls';
import { loadUser, setUser, unsetUser, User } from './loadUser';

type Action<T> = (t: T) => void;
type UserUpdater = Action<User | null>;

export interface SessionControl {
  setUser(user: User | null): void;
  user: {
    subscribe(fn: UserUpdater): () => void;
  },
  isLoggedIn(): boolean;
  logIn(redirect: true): void;
  logIn(email: string, password: string): Promise<void>;
  logOut(): void;
  renew(password: string): Promise<void>;
}

export function session(settings: ApiSettings): SessionControl {
  settings.user = loadUser();
  const userControls = setupSession(settings);
  return Object.assign(userControls, {
    isLoggedIn: () => isLoggedIn(settings),
    logIn: (email: string | true, password?: string) => logIn(settings, userControls.setUser, email, password),
    renew: (password: string) => renew(settings, userControls.setUser, password),
    logOut: () => logOut(userControls.setUser),
  });
}

function setupSession(settings: ApiSettings) {
  const subscribers = new Set<UserUpdater>();

  function notifyUserChanged(user: User | null) {
    subscribers.forEach(fn => fn(user));
  }

  function subscribe(fn: UserUpdater) {
    fn(settings.user);
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  }

  return {
    user: { subscribe },
    setUser(user: User | null): void {
      settings.user = user;
      if (user) {
        setUser(user);
      } else {
        unsetUser();
      }
      notifyUserChanged(user);
    },
  };
}

async function logIn(settings: ApiSettings, setUser: UserUpdater, email: string | true, password?: string) {
  if (email === true) {
    window.location.href = urls.navigate();
    return;
  }

  if (!password) throw new Error("If not redirecting, password and email are both required.");

  const url = new URL(settings.apiBase + '/auth/tokens');
  url.searchParams.set('lifetime', 'P7D');
  url.searchParams.set('email', email);
  url.searchParams.set('ts', new Date().toISOString());

  const body = new FormData();
  body.set('email', email);
  body.set('password', password);

  const result = await self.fetch(url.toString(), { method: 'POST', body });
  const responseBody = await result.json();
  if (result.ok) {
    setUser(responseBody);
    return responseBody;
  }
  return responseBody;
}

function isLoggedIn(settings: ApiSettings) {
  return !!settings.user;
}

async function logOut(setUser: UserUpdater) {
  setUser(null);
  window.location.href = urls.logOut;
}

function renew (settings: ApiSettings, setUser: UserUpdater, password: string): Promise<void> {
  if (!settings.user) {
    throw new Error("Use logIn. Cannot log in without current user data.");
  }
  return logIn(settings, setUser, settings.user.email, password);
}
