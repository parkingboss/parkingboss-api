import { ApiSettings } from "./index";
import { User } from "./loadUser";

import { isInterval, intervalString } from "../time";

export type QueryParams = Record<string, unknown>;

export interface ApiQueries {
  fetch(
    method: string,
    url: string,
    query?: QueryParams,
    body?: null | FormData | Blob,
    useAuthHeader?: boolean
  ): Promise<unknown>;
  get(
    url: string,
    query?: QueryParams,
    useAuthHeader?: boolean
  ): Promise<unknown>;
  post(
    url: string,
    query?: QueryParams,
    body?: FormData | Blob,
    useAuthHeader?: boolean
  ): Promise<unknown>;
}

export function queries(settings: ApiSettings): ApiQueries {
  return {
    fetch: (
      method: string,
      url: string,
      query: QueryParams = {},
      body: null | FormData | Blob = null,
      useAuthHeader: boolean = true
    ) => apiFetch(settings, method, url, body, query, useAuthHeader),
    get: (
      url: string,
      query: QueryParams = {},
      useAuthHeader: boolean = true
    ) => apiFetch(settings, "GET", url, null, query, useAuthHeader),
    post: (
      url: string,
      query: QueryParams = {},
      body: null | FormData | Blob = null,
      useAuthHeader: boolean = true
    ) => apiFetch(settings, "POST", url, body, query, useAuthHeader),
  };
}

export class HttpError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function loadAuthHeader(user: User | null): string | null {
  return user && [user.type, user.token].filter((x) => x).join(" ");
}

async function resultJson(response: Response) {
  let result;
  try {
    result = await response.clone().json();
  } catch (e) {
    result = { body: await response.text() };
  }

  let date = response.headers.get("Date") || response.headers.get("date");
  if (date) {
    date = new Date(date).toISOString();
  }

  let modified =
    response.headers.get("Last-Modified") ||
    response.headers.get("last-modified");
  if (modified) {
    modified = new Date(modified).toISOString();
  }

  let status = response.status;
  return Object.assign(result, {
    date,
    modified,
    status,
  });
}

function apiQuery(
  query: QueryParams,
  authHeader: string | boolean,
  settings: ApiSettings
) {
  const result = Object.assign({}, query, {
    viewpoint: query.viewpoint || new Date(),
    client: settings.client,
  });

  if (authHeader !== false) {
    result.Authorization =
      authHeader === true ? loadAuthHeader(settings.user)! : authHeader;
  }

  return result;
}

function apiUrl(
  settings: ApiSettings,
  url: string,
  query: QueryParams
): string {
  const fullUrl = new URL(settings.apiBase + url);

  Object.entries(query || {}).forEach(([key, val]) => {
    if (Array.isArray(val)) {
      val.forEach((v) => fullUrl.searchParams.append(key, v));
    } else if (isInterval(val)) {
      fullUrl.searchParams.append(key, intervalString(val));
    } else if (val instanceof Date) {
      fullUrl.searchParams.append(key, val.toISOString());
    } else if (val) {
      fullUrl.searchParams.append(key, val as any);
    }
  });

  return fullUrl.toString();
}

async function apiRequest(
  method: string,
  url: string,
  body: null | FormData | Blob
) {
  try {
    const init: RequestInit = { method };
    if (body) init.body = body;
    return await self.fetch(url, init);
  } catch (e) {
    throw Object.assign(new Error("Network Error"), { url });
  }
}

async function apiFetch(
  settings: ApiSettings,
  method: string,
  url: string,
  body: null | FormData | Blob = null,
  query: QueryParams = {},
  authHeader: boolean | string = true
) {
  const requested = new Date().toISOString();

  const fullUrl = apiUrl(settings, url, apiQuery(query, authHeader, settings));
  const result = await apiRequest(method, fullUrl, body);
  const json = await resultJson(result);

  if (json) json.requested = requested;

  if (result.ok) {
    return json;
  } else {
    throw Object.assign(new Error("API Error"), json);
  }
}
