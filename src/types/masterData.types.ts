/** Mirrors the API response for `AirlineMaster`. Dates are strings — JSON has no Date. */
export interface IAirline {
  id: string;
  agencyId: string;
  name: string;
  /** Stored uppercase by the API (BS, BG, EK), whatever case was submitted. */
  shortCode: string;
  logoUrl?: string | null;
  remark?: string | null;
  createdById?: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateAirlinePayload {
  name: string;
  shortCode: string;
  logoUrl?: string;
  remark?: string;
}

/**
 * A sector as the agency writes it — "DAC-SIN", or "YYZ-DAC-YYZ" for a
 * multi-leg return. Deliberately free-form on the backend, so there is no
 * origin/destination pair to model here.
 */
export interface IRoute {
  id: string;
  agencyId: string;
  name: string;
  remark?: string | null;
  createdById?: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateRoutePayload {
  name: string;
  remark?: string;
}
