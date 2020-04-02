import { Interval } from '../time';

export type Query = { [key: string]: unknown } & { viewpoint?: string | Date };

type IntervalQuery = string | Interval;

export type AuthorizationsQuery = Query & {
  valid: IntervalQuery;
  principal: 'self' | 'current' | 'authentication' | string;
  scope?: string;
};

export type MediaQuery = Query & {
  valid: IntervalQuery;
};

export type MediasQuery = Query & {
  valid?: IntervalQuery;
  issued?: IntervalQuery;
  revoked?: IntervalQuery;
};

export type PermitsQuery = Query & {
  valid: IntervalQuery;
  issued?: IntervalQuery;
};

export type TenantQuery = Query & {
  valid: IntervalQuery;
};

export type TenantsQuery = Query & {
  scope: string;
  valid: IntervalQuery;
};

export type PropertyQuery = Query & {
};

export type GeoPropertyQuery = Query & {
  principal?: string;
  photos?: true;
}

export type PropertiesQuery = Query & {
  principal?: string;
  photos?: true;
};

export type SpaceQuery = Query & {
  valid?: IntervalQuery;
};

export type SpacesQuery = Query & {
  valid?: IntervalQuery;
};

export type VehicleQuery = Query & {
  valid?: IntervalQuery;
};

export type ViolationsQuery = Query & {
  issued?: IntervalQuery;
};

export type UsersQuery = Query & {
};

export type UnitsQuery = Query & {
};
