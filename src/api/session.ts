import { ApiSettings } from './index';
import { urls } from '@parkingboss/utils';
import { loadUser, setUser, unsetUser, jwtUser, User } from './loadUser';

type Action<T> = (t: T) => void;
type UserUpdater = Action<User | null>;

export interface SessionControl {
  user: {
    subscribe(fn: UserUpdater): () => void;
    set(user: User | null): void;
  },
  isLoggedIn(): boolean;
  logIn(redirect: true): void;
  logIn(email: string, password: string): Promise<void>;
  logOut(skipRedirect?: boolean): void;
  renew(password: string): Promise<void>;
  requestPasswordReset(password: string): Promise<any>;
}

export function session(settings: ApiSettings): SessionControl {
  settings.user = loadUser();
  const user = userStore(settings);
  return Object.assign({
    user,
    isLoggedIn: () => isLoggedIn(settings),
    logIn: (email: string | true, password?: string) => logIn(settings, user.set, email, password),
    renew: (password: string) => renew(settings, user.set, password),
    requestPasswordReset: (email: string) => requestPasswordReset(settings, email),
    logOut: (skipRedirect?: boolean) => logOut(user.set, skipRedirect),
  });
}

function userStore(settings: ApiSettings) {
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
    subscribe,
    set(user: User | null): void {
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
    window.location.href = urls.build({ login: true });
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
    setUser(jwtUser(responseBody));
    return responseBody;
  }

  return responseBody;
}

async function requestPasswordReset(settings: ApiSettings, email: string) {
  if (!email) throw new Error('Email must be provided.');

  const url = new URL(settings.apiBase + '/auth/tokens/email');
  url.searchParams.set('ts', new Date().toISOString());

  const body = new FormData();
  body.set('email', email);

  const result = await self.fetch(url.toString(), { method: 'POST', body });
  const responseBody = await result.json();

  return responseBody;
}

function isLoggedIn(settings: ApiSettings) {
  return !!settings.user;
}

async function logOut(setUser: UserUpdater, skipRedirect = false) {
  setUser(null);
  if (!skipRedirect) window.location.href = 'https://my.parkingboss.com/user/logout';
}

function renew(settings: ApiSettings, setUser: UserUpdater, password: string): Promise<void> {
  if (!settings.user) {
    throw new Error("Use logIn. Cannot log in without current user data.");
  }
  return logIn(settings, setUser, settings.user.email, password);
}
