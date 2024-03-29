import storage from "store/dist/store.modern";
import decodeJwt from "jwt-decode";

interface Jwt {
  /* Official JWT elements: */

  // Subject of the JWT. (User ID of logged in user).
  sub: string;

  // Issuer of the JWT. (api url that issued JWT)
  iss: string;
  // Audience of the JWT. (api url that accepts JWT)
  aud: string;

  // Expiration date in seconds from epoch.
  exp: number;
  // Start date (not before) in seconds from epoch.
  nbf: number;
  // Created date (issued at) in seconds from epoch
  iat: number;

  // Token ID, unique id for JWT.
  jti: string;

  /* JWT Extensions for Parking Boss: */
  // The encoded JWT Token.
  token: string;
  type: "bearer";

  // Email address for user.
  email: string;
  // User display name.
  name: string;
  // User unique name (guaranteed unique displayable name)
  unique_name: string;
}

// User expands on the JWT interface adding convenience fields.
export interface User extends Jwt {
  // Same as 'sub,' but better name.
  user: string;

  // Created in ms from epoch.
  nbfms: number;
  // Created date
  starts: Date;

  // Expiration in ms from epoch
  expms: number;
  // Expiration date
  expires: Date;

  // Issued in ms from epoch
  iatms: number;
  // Created date
  created: Date;
}

const AUTH_KEY = "user/auth";

function loadFromUrl(skipExpiryCheck: boolean): User | null {
  const url = new URL(location.toString());

  const source = Array.from(url.searchParams.entries())
    .concat(
      Array.from(new URLSearchParams(url.hash.replace(/^#/, "")).entries())
    )
    .reduce(
      (
        acc: Record<string, string>,
        item: [string, string]
      ): Record<string, string> => {
        acc[item[0]] = item[1];
        return acc;
      },
      {} as Record<string, string>
    );

  const token = source.access_token || source.token;

  if (!token) return null;

  const usr = jwtUser({ token, type: "bearer" }, skipExpiryCheck);

  if (usr) setUser(usr);

  return usr;
}

function loadFromStorage(skipExpiryCheck: boolean): User | null {
  const data: any = storage.get(AUTH_KEY);

  return jwtUser(data, skipExpiryCheck);
}

export function jwtUser(jwt: any, skipExpiryCheck?: boolean) {
  return jwtToUser(parseJwt(jwt, !!skipExpiryCheck));
}

export function loadUser(skipExpiryCheck: boolean = false): User | null {
  return loadFromUrl(skipExpiryCheck) || loadFromStorage(skipExpiryCheck);
}

export function setUser(data: User) {
  storage.set(AUTH_KEY, data);
}

export function unsetUser() {
  storage.remove(AUTH_KEY);
}

function parseJwt(data: any, skipExpiryCheck: boolean): Jwt | null {
  if (data && data.token) {
    try {
      const jwt = decodeJwt(data.token) as Jwt;

      if (jwt && (skipExpiryCheck || notExpired(jwt))) {
        return Object.assign(data, jwt);
      }
    } catch (e) {
      console.warn("Failed to Decode JWT. Use is not logged in.", e);
      unsetUser();
    }
  }
  return null;
}

function notExpired(jwt: Jwt): boolean {
  if (jwt && jwt.exp) {
    return jwt.exp * 1000 > Date.now();
  }
  return false;
}

function jwtToUser(jwt: Jwt | null): User | null {
  if (!jwt) return jwt;

  const expms = jwt.exp * 1000;
  const iatms = jwt.iat * 1000;
  const nbfms = jwt.nbf * 1000;

  return Object.assign(jwt, {
    user: jwt.sub,
    expms,
    expires: new Date(expms),
    iatms,
    created: new Date(iatms),
    nbfms,
    starts: new Date(nbfms),
  });
}
