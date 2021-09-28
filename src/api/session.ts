import { ApiSettings } from "./index";
import { LoginUrlParams, buildLoginUrl } from "@parkingboss/utils/es6/urls";
import { loadUser, setUser, unsetUser, jwtUser, User } from "./loadUser";

type Action<T> = (t: T) => void;
type UserUpdater = Action<User | null>;

export interface SessionControl {
  user: {
    subscribe(fn: UserUpdater): () => void;
    set(user: User | null): void;
  };
  validUser: {
    subscribe(fn: UserUpdater): () => void;
  };
  isLoggedIn(): boolean;
  logIn(): void;
  logIn(email: string, password: string): Promise<void>;
  logOut(): void;
  renew(password: string): Promise<void>;
  requestPasswordReset(password: string): Promise<any>;
}

export function session(settings: ApiSettings): SessionControl {
  settings.user = loadUser();
  const user = userStore(settings);
  const validUser = validUserStore(user);
  return Object.assign({
    user,
    validUser,
    isLoggedIn: () => isLoggedIn(settings),
    logIn: (email?: string, password?: string) =>
      email && password ? logIn(settings, user.set, email, password) : logIn(settings, user.set),
    renew: (password: string) => renew(settings, user.set, password),
    requestPasswordReset: (email: string) => requestPasswordReset(settings, email),
    logOut: () => logOut(user.set),
  });
}

function userStore(settings: ApiSettings) {
  const subscribers = new Set<UserUpdater>();

  function notifyUserChanged(user: User | null) {
    subscribers.forEach((fn) => fn(user));
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

function validUserStore(user: SessionControl["user"]): SessionControl["validUser"] {
  return {
    subscribe(fn) {
      let timeout: number | null = null;

      const unsub = user.subscribe((currentUser) => {
        if (timeout != null) {
          clearTimeout(timeout);
          timeout = null;
        }

        if (isValidUser(currentUser)) {
          fn(currentUser);

          const msToExpiry = +currentUser!.expires - Date.now();
          timeout = setTimeout(() => {
            fn(null);
            timeout = null;
          }, msToExpiry);
        } else {
          fn(null);
        }
      });

      return () => {
        if (timeout != null) {
          clearTimeout(timeout);
        }
        unsub();
      };
    },
  };
}

async function logIn(settings: ApiSettings, setUser: UserUpdater): Promise<void>;
async function logIn(settings: ApiSettings, setUser: UserUpdater, email: string, password: string): Promise<User>;
async function logIn(
  settings: ApiSettings,
  setUser: UserUpdater,
  email?: string,
  password?: string
): Promise<void | User> {
  if (email && password) {
    const url = new URL(settings.apiBase + "/auth/tokens");
    url.searchParams.set("lifetime", "P7D");
    url.searchParams.set("email", email);
    url.searchParams.set("ts", new Date().toISOString());

    const body = new FormData();
    body.set("email", email);
    body.set("password", password);

    const result = await self.fetch(url.toString(), { method: "POST", body });
    const responseBody = await result.json();

    if (result.ok) {
      setUser(jwtUser(responseBody));
      return responseBody;
    }

    return responseBody;
  }

  const loginParams = { clientId: settings.client } as LoginUrlParams;
  if (settings.user?.email) {
    loginParams.email = settings.user.email;
  }

  window.location.href = buildLoginUrl(loginParams);
}

async function requestPasswordReset(settings: ApiSettings, email: string) {
  if (!email) throw new Error("Email must be provided.");

  const url = new URL(settings.apiBase + "/auth/tokens/email");
  url.searchParams.set("ts", new Date().toISOString());

  const body = new FormData();
  body.set("email", email);

  const result = await self.fetch(url.toString(), { method: "POST", body });
  const responseBody = await result.json();

  return responseBody;
}

function isLoggedIn(settings: ApiSettings) {
  return isValidUser(settings.user);
}

function isValidUser(user: User | null): boolean {
  return !!(user && (!user.expires || user.expires < new Date()));
}

async function logOut(setUser: UserUpdater) {
  setUser(null);
}

function renew(settings: ApiSettings, setUser: UserUpdater, password: string): Promise<User> {
  if (!settings.user?.email) {
    throw new Error("Use logIn. Cannot log in without current user data.");
  }

  return logIn(settings, setUser, settings.user.email!, password);
}
