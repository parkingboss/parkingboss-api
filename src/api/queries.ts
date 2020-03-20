import { ApiSettings } from './index';
import { User } from './loadUser';
import { AuthorizationsQuery, MediaQuery, MediasQuery, PermitsQuery, TenantQuery, PropertyQuery, PropertiesQuery, SpaceQuery, SpacesQuery, VehicleQuery, ViolationsQuery, Query } from './args';
import { AuthorizationsPayload, MediaPayload, MediasPayload, PermitsPayload, TenantPayload, PropertyPayload, PropertiesPayload, SpacePayload, SpacesPayload, VehiclePayload, ViolationsPayload } from './payloads';

import { isInterval, intervalString } from '../time';
import { modernize } from './modernize';
import { normalize } from './normalize';

export interface ApiQueries {
  fetch(method: string, url: string, query?: Record<string, unknown>, body?: null | FormData | Blob, useAuthHeader?: boolean): Promise<Record<string, unknown>>;
  get(url: string, query?: Record<string, unknown>, useAuthHeader?: boolean): Promise<Record<string, unknown>>;
  post(url: string, query?: Record<string, unknown>, body?: FormData | Blob, useAuthHeader?: boolean): Promise<Record<string, unknown>>;
  authorizations(query: AuthorizationsQuery): Promise<AuthorizationsPayload>;
  media(propertyId: string, id:string, query: MediaQuery): Promise<MediaPayload>;
  medias(propertyId: string, query: MediasQuery): Promise<MediasPayload>;
  permits(propertyId: string, query: PermitsQuery): Promise<PermitsPayload>;
  tenant(propertyId: string, id: string, query: TenantQuery): Promise<TenantPayload>;
  property(id: string, query: PropertyQuery): Promise<PropertyPayload>;
  properties(query: PropertiesQuery): Promise<PropertiesPayload>;
  space(propertyId: string, id: string, query: SpaceQuery): Promise<SpacePayload>;
  spaces(propertyId: string, query: SpacesQuery): Promise<SpacesPayload>;
  vehicle(propertyId: string, id: string, query: VehicleQuery): Promise<VehiclePayload>;
  violations(propertyId: string, query: ViolationsQuery): Promise<ViolationsPayload>;
}

export function queries(settings: ApiSettings): ApiQueries {
  return {
    fetch: (method: string, url: string, query: Record<string, unknown> = {}, body: null | FormData | Blob = null, useAuthHeader: boolean = true) => apiFetch(settings, method, url, body, query, useAuthHeader),
    get: (url: string, query: Record<string, unknown> = {}, useAuthHeader: boolean = true) => apiFetch(settings, 'GET', url, null, query, useAuthHeader),
    post: (url: string, query: Record<string, unknown> = {}, body: null | FormData | Blob = null, useAuthHeader: boolean = true) => apiFetch(settings, 'POST', url, body, query, useAuthHeader),
    authorizations: (query: AuthorizationsQuery) => authorizations(settings, query),
    media: (propertyId: string, id: string, query: MediaQuery) => media(settings, propertyId, id, query),
    medias: (propertyId: string, query: MediasQuery) => medias(settings, propertyId, query),
    permits: (propertyId: string, query: PermitsQuery) => permits(settings, propertyId, query),
    tenant: (propertyId: string, id: string, query: TenantQuery) => tenant(settings, propertyId, id, query),
    property: (id: string, query: PropertyQuery) => property(settings, id, query),
    properties: (query: PropertiesQuery) => properties(settings, query),
    space: (propertyId: string, id: string, query: SpaceQuery) => space(settings, propertyId, id, query),
    spaces: (propertyId: string, query: SpacesQuery) => spaces(settings, propertyId, query),
    vehicle: (propertyId: string, id: string, query: VehicleQuery) => vehicle(settings, propertyId, id, query),
    violations: (propertyId: string, query: ViolationsQuery) => violations(settings, propertyId, query),
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
  return user && [user.type, user.token].filter(x => x).join(' ');
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

  let modified = response.headers.get("Last-Modified") || response.headers.get("last-modified");
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

function apiQuery(query: Query & Record<string, unknown>, authHeader: string | boolean, settings: ApiSettings) {
  const result = Object.assign({}, query, {
    viewpoint: query.viewpoint || new Date(),
    client: settings.client,
  });

  if (authHeader !== false) {
    result.Authorization = authHeader === true
      ? loadAuthHeader(settings.user)
      : authHeader;
  }

  return result;
}

function apiUrl(settings: ApiSettings, url: string, query: Query & Record<string, unknown>): string {
  const fullUrl = new URL(settings.apiBase + url);

  Object.entries(query || {})
    .forEach(([key, val]) => {
      if (Array.isArray(val)) {
        val.forEach(v => fullUrl.searchParams.append(key, v));
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

async function apiRequest(method: string, url: string, body: null|FormData|Blob) {
  try {
    const init: RequestInit = { method };
    if (body) init.body = body;
    return await self.fetch(url, init);
  } catch (e) {
    throw Object.assign(new Error('Network Error'), { url });
  }
}

async function apiFetch(
    settings: ApiSettings,
    method: string,
    url: string,
    body: null|FormData|Blob = null,
    query: Query & Record<string, unknown> = {},
    authHeader: boolean|string = true,
    ...modernizeFields: string[]
  ) {
  const shouldNormalize = !settings.skipNormalization;
  const requested = new Date().toISOString();

  const fullUrl = apiUrl(settings, url, apiQuery(query, authHeader, settings));
  const result = await apiRequest(method, fullUrl, body);
  const json = await resultJson(result);

  if (json) json.requested = requested;

  if (result.ok) {
    modernize(json, ...modernizeFields);
    if (shouldNormalize) normalize(json);
    return json;
  } else {
    throw Object.assign(new Error("API Error"), json);
  }
}

function authorizations(settings: ApiSettings, query: AuthorizationsQuery): Promise<AuthorizationsPayload> {
  return apiFetch(settings, 'GET', `/authorizations`, null, query, true, 'authorizations', 'users');
}

function media(settings: ApiSettings, propertyId: string, id: string, query: MediaQuery): Promise<MediaPayload> {
  return apiFetch(settings, 'GET', `/locations/${propertyId}/media/${id}}`, null, query, true, 'media', 'locations');
}

function medias(settings: ApiSettings, propertyId: string, query: MediasQuery): Promise<MediasPayload> {
  return apiFetch(settings, 'GET', `/locations/${propertyId}/media`, null, query, true, 'media', 'locations');
}

function permits(settings: ApiSettings, propertyId: string, query: PermitsQuery): Promise<PermitsPayload> {
  return apiFetch(settings, 'GET', `/permits`, null, Object.assign({ scope: propertyId }, query), true, 'notes', 'contacts');
}

function tenant(settings: ApiSettings, propertyId: string, id: string, query: TenantQuery): Promise<TenantPayload> {
  return apiFetch(settings, 'GET', `/locations/${propertyId}/tenants/${id}`, null, query, true, 'tenants', 'locations');
}

function property(settings: ApiSettings, propertyId: string, query: PropertyQuery): Promise<PropertyPayload> {
  return apiFetch(settings, 'GET', `/locations/${propertyId}`, null, query, false, 'locations', 'addresses');
}

function properties(settings: ApiSettings, query: PropertiesQuery): Promise<PropertiesPayload> {
  return apiFetch(settings, 'GET', `/locations`, null, query, true, 'locations', 'addresses');
}

function space(settings: ApiSettings, propertyId: string, id: string, query: SpaceQuery): Promise<SpacePayload> {
  return apiFetch(settings, 'GET', `/locations/${propertyId}/spaces/${id}`, null, query, true, 'spaces', 'locations');
}

function spaces(settings: ApiSettings, propertyId: string, query: SpacesQuery): Promise<SpacesPayload> {
  return apiFetch(settings, 'GET', `/locations/${propertyId}/spaces`, null, query, true, 'spaces', 'locations');
}

function vehicle(settings: ApiSettings, propertyId: string, id: string, query: VehicleQuery): Promise<VehiclePayload> {
  return apiFetch(settings, 'GET', `/locations/${propertyId}/vehicles/${id}`, null, query, true, 'vehicles', 'locations');
}

function violations(settings: ApiSettings, propertyId: string, query: ViolationsQuery): Promise<ViolationsPayload> {
  return apiFetch(settings, 'GET', `/violations`, null, Object.assign({ scope: propertyId }, query), true, 'authorizations', 'users');
}
