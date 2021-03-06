import { ApiSettings } from './index';
import { User } from './loadUser';
import { AuthorizationsQuery, MediaQuery, MediasQuery, PermitsQuery, TenantQuery, PropertyQuery, PropertiesQuery, SpaceQuery, SpacesQuery, VehicleQuery, ViolationsQuery, Query, UsersQuery, UnitsQuery, GeoPropertyQuery, ObservePlateQuery, TenantsQuery } from './args';
import { AuthorizationsPayload, MediaPayload, MediasPayload, PermitsPayload, TenantPayload, PropertyPayload, PropertiesPayload, SpacePayload, SpacesPayload, VehiclePayload, ViolationsPayload, UsersPayload, UnitsPayload, ObservePlatePayload, TenantsPayload } from './payloads';

import { isInterval, intervalString } from '../time';
import { modernize } from './modernize';
import { normalize } from './normalize';

export interface ApiQueries {
  fetch(method: string, url: string, query?: Record<string, unknown>, body?: null | FormData | Blob, useAuthHeader?: boolean): Promise<Record<string, unknown>>;
  get(url: string, query?: Record<string, unknown>, useAuthHeader?: boolean): Promise<Record<string, unknown>>;
  post(url: string, query?: Record<string, unknown>, body?: FormData | Blob, useAuthHeader?: boolean): Promise<Record<string, unknown>>;
  authorizations(query: AuthorizationsQuery, skipAuth?: boolean): Promise<AuthorizationsPayload>;
  media(propertyId: string, id:string, query: MediaQuery, skipAuth?: boolean): Promise<MediaPayload>;
  medias(propertyId: string, query: MediasQuery, skipAuth?: boolean): Promise<MediasPayload>;
  permits(propertyId: string, query: PermitsQuery, skipAuth?: boolean): Promise<PermitsPayload>;
  tenant(propertyId: string, id: string, query: TenantQuery, skipAuth?: boolean): Promise<TenantPayload>;
  tenants(query: TenantsQuery, skipAuth?: boolean): Promise<TenantsPayload>;
  property(id: string, query: PropertyQuery, skipAuth?: boolean): Promise<PropertyPayload>;
  geoProperties(coords: [number, number] | { lon: number, lat: number }, query: GeoPropertyQuery, skipAuth?: boolean): Promise<PropertiesPayload>;
  properties(query: PropertiesQuery, skipAuth?: boolean): Promise<PropertiesPayload>;
  space(propertyId: string, id: string, query: SpaceQuery, skipAuth?: boolean): Promise<SpacePayload>;
  spaces(propertyId: string, query: SpacesQuery, skipAuth?: boolean): Promise<SpacesPayload>;
  vehicle(propertyId: string, id: string, query: VehicleQuery, skipAuth?: boolean): Promise<VehiclePayload>;
  violations(propertyId: string, query: ViolationsQuery, skipAuth?: boolean): Promise<ViolationsPayload>;
  users(userId: string, query: UsersQuery, skipAuth?: boolean): Promise<UsersPayload>;
  units(propertyId: string, query: UnitsQuery, skipAuth?: boolean): Promise<UnitsPayload>;
  observePlate(frame: Blob, query: ObservePlateQuery, skipAuth?: boolean): Promise<ObservePlatePayload>;
}

export function queries(settings: ApiSettings): ApiQueries {
  return {
    fetch: (method: string, url: string, query: Record<string, unknown> = {}, body: null | FormData | Blob = null, useAuthHeader: boolean = true) => apiFetch(settings, method, url, body, query, useAuthHeader),
    get: (url: string, query: Record<string, unknown> = {}, useAuthHeader: boolean = true) => apiFetch(settings, 'GET', url, null, query, useAuthHeader),
    post: (url: string, query: Record<string, unknown> = {}, body: null | FormData | Blob = null, useAuthHeader: boolean = true) => apiFetch(settings, 'POST', url, body, query, useAuthHeader),
    authorizations: (query: AuthorizationsQuery, skipAuth: boolean = false) => authorizations(settings, query, skipAuth),
    media: (propertyId: string, id: string, query: MediaQuery, skipAuth: boolean = false) => media(settings, propertyId, id, query, skipAuth),
    medias: (propertyId: string, query: MediasQuery, skipAuth: boolean = false) => medias(settings, propertyId, query, skipAuth),
    permits: (propertyId: string, query: PermitsQuery, skipAuth: boolean = false) => permits(settings, propertyId, query, skipAuth),
    tenant: (propertyId: string, id: string, query: TenantQuery, skipAuth: boolean = false) => tenant(settings, propertyId, id, query, skipAuth),
    tenants: (query: TenantsQuery, skipAuth: boolean = false) => tenants(settings, query, skipAuth),
    property: (id: string, query: PropertyQuery, skipAuth: boolean = false) => property(settings, id, query, skipAuth),
    geoProperties: (coords: [number, number] | { lon: number, lat: number }, query: GeoPropertyQuery, skipAuth: boolean = true) => geoProperties(settings, coords, query, skipAuth),
    properties: (query: PropertiesQuery, skipAuth: boolean = false) => properties(settings, query, skipAuth),
    space: (propertyId: string, id: string, query: SpaceQuery, skipAuth: boolean = false) => space(settings, propertyId, id, query, skipAuth),
    spaces: (propertyId: string, query: SpacesQuery, skipAuth: boolean = false) => spaces(settings, propertyId, query, skipAuth),
    vehicle: (propertyId: string, id: string, query: VehicleQuery, skipAuth: boolean = false) => vehicle(settings, propertyId, id, query, skipAuth),
    violations: (propertyId: string, query: ViolationsQuery, skipAuth: boolean = false) => violations(settings, propertyId, query, skipAuth),
    users: (userId: string, query: UsersQuery, skipAuth: boolean = false) => users(settings, userId, query, skipAuth),
    units: (propertyId: string, query: UnitsQuery, skipAuth: boolean = false) => units(settings, propertyId, query, skipAuth),
    observePlate: (frame: Blob, query: ObservePlateQuery, skipAuth = false) => observePlate(settings, frame, query, skipAuth),
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

function authorizations(settings: ApiSettings, query: AuthorizationsQuery, skipAuth: boolean = false): Promise<AuthorizationsPayload> {
  return apiFetch(settings, 'GET', `/authorizations`, null, query, !skipAuth);
}

function media(settings: ApiSettings, propertyId: string, id: string, query: MediaQuery, skipAuth: boolean = false): Promise<MediaPayload> {
  return apiFetch(settings, 'GET', `/locations/${propertyId}/media/${id}}`, null, query, !skipAuth);
}

function medias(settings: ApiSettings, propertyId: string, query: MediasQuery, skipAuth: boolean = false): Promise<MediasPayload> {
  return apiFetch(settings, 'GET', `/media?scope=${propertyId}`, null, query, !skipAuth);
}

function permits(settings: ApiSettings, propertyId: string, query: PermitsQuery, skipAuth: boolean = false): Promise<PermitsPayload> {
  return apiFetch(settings, 'GET', `/permits`, null, Object.assign({ scope: propertyId }, query), true, 'notes', 'contacts');
}

function tenant(settings: ApiSettings, propertyId: string, id: string, query: TenantQuery, skipAuth: boolean = false): Promise<TenantPayload> {
  return apiFetch(settings, 'GET', `/locations/${propertyId}/tenants/${id}`, null, query, !skipAuth, 'tenants', 'locations');
}

function tenants(settings: ApiSettings, query: TenantsQuery, skipAuth: boolean = false): Promise<TenantsPayload> {
  return apiFetch(settings, 'GET', '/units/tenants', null, query, !skipAuth);
}

function property(settings: ApiSettings, propertyId: string, query: PropertyQuery, skipAuth: boolean = true): Promise<PropertyPayload> {
  return apiFetch(settings, 'GET', `/locations/${propertyId}`, null, query, !skipAuth);
}

function geoProperties(settings: ApiSettings, coords: [number,number] | { lat: number, lon: number }, query: GeoPropertyQuery, skipAuth: boolean = false): Promise<PropertiesPayload> {
  const coordId = Array.isArray(coords) ? coords.join(',') : `${coords.lon},${coords.lat}`;
  return apiFetch(settings, 'GET', `/locations/${coordId}`, null, query, !skipAuth);
}

function properties(settings: ApiSettings, query: PropertiesQuery, skipAuth: boolean = false): Promise<PropertiesPayload> {
  return apiFetch(settings, 'GET', `/locations`, null, query, !skipAuth);
}

function space(settings: ApiSettings, propertyId: string, id: string, query: SpaceQuery, skipAuth: boolean = false): Promise<SpacePayload> {
  return apiFetch(settings, 'GET', `/locations/${propertyId}/spaces/${id}`, null, query, !skipAuth, 'spaces', 'locations');
}

function spaces(settings: ApiSettings, propertyId: string, query: SpacesQuery, skipAuth: boolean = false): Promise<SpacesPayload> {
  return apiFetch(settings, 'GET', `/spaces?scope=${propertyId}`, null, query, !skipAuth);
}

function vehicle(settings: ApiSettings, propertyId: string, id: string, query: VehicleQuery, skipAuth: boolean = false): Promise<VehiclePayload> {
  return apiFetch(settings, 'GET', `/locations/${propertyId}/vehicles/${id}`, null, query, !skipAuth, 'vehicles', 'locations');
}

function violations(settings: ApiSettings, propertyId: string, query: ViolationsQuery, skipAuth: boolean = false): Promise<ViolationsPayload> {
  return apiFetch(settings, 'GET', `/violations`, null, Object.assign({ scope: propertyId }, query), !skipAuth, 'notes');
}

function users(settings: ApiSettings, userId: string, query: UsersQuery, skipAuth: boolean = false): Promise<UsersPayload> {
  return apiFetch(settings, 'GET', `/users/${userId}`, null, query, !skipAuth);
}

function units(settings: ApiSettings, propertyId: string, query: UnitsQuery, skipAuth: boolean = false): Promise<UnitsPayload> {
  return apiFetch(settings, 'GET', `/units?scope=${propertyId}`, null, query, !skipAuth);
}

function observePlate(settings: ApiSettings, frame: Blob, query: ObservePlateQuery, skipAuth: boolean = false): Promise<ObservePlatePayload> {
  const formData = new FormData();
  formData.append('file', frame, query.filename);
  delete query.filename;
  return apiFetch(settings, 'POST', '/observations', formData, query, !skipAuth);
}
