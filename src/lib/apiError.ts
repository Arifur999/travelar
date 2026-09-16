/**
 * The one safe way to describe a failed API call.
 *
 * An axios error must NEVER be handed to `console.error` or to the logger
 * whole. It carries `config.headers`, and this app forwards the browser's
 * entire cookie jar to the API — so logging the error object printed the live
 * `accessToken`, `refreshToken` and better-auth session token into the web
 * server's log on every failed request, where anyone with log access could
 * replay the session. `describeApiFailure` is an allowlist: it reads a handful
 * of scalars and can never reach a header, a cookie or a request body.
 */

/**
 * A type alias rather than an interface on purpose: only an alias gets an
 * implicit index signature, which is what lets a failure be spread straight
 * into the logger's `Record<string, unknown>` fields.
 */
export type ApiFailure = {
  /** HTTP status the API answered with; absent when the request never landed. */
  status?: number;
  /** The API's own request id, which its logs are searchable by. */
  requestId?: string;
  /** The API's message. Safe: it is written for the caller to read. */
  message?: string;
  /** Axios code for a transport failure, e.g. ECONNREFUSED / ETIMEDOUT. */
  code?: string;
  method?: string;
  /** The request path. Query strings are dropped — they hold search terms and tokens. */
  path?: string;
};

const asString = (value: unknown) => (typeof value === "string" ? value : undefined);
const asNumber = (value: unknown) => (typeof value === "number" ? value : undefined);

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

/** Everything before the "?" — a URL may be relative, so this is not `new URL()`. */
const pathOnly = (url: string | undefined) => (url === undefined ? undefined : url.split("?")[0]);

export const describeApiFailure = (error: unknown): ApiFailure => {
  const root = asRecord(error);
  const response = asRecord(root.response);
  const body = asRecord(response.data);
  const config = asRecord(root.config);

  const status = asNumber(response.status);
  // A transport failure has no response, so the axios message ("timeout of
  // 30000ms exceeded") is the only thing that says what happened.
  const message = asString(body.message) ?? (status === undefined ? asString(root.message) : undefined);

  const failure: ApiFailure = {
    status,
    requestId: asString(body.requestId),
    message,
    code: asString(root.code),
    method: asString(config.method)?.toUpperCase(),
    // `config.url` is the endpoint as the service passed it; baseURL is ours
    // and constant, so it adds nothing.
    path: pathOnly(asString(config.url)),
  };

  // Drop the keys that are not known, so a log line stays short and a JSON
  // line has no `"status": undefined` noise.
  for (const key of Object.keys(failure) as (keyof ApiFailure)[]) {
    if (failure[key] === undefined) delete failure[key];
  }
  return failure;
};

/** True for the axios shape carrying an API response — i.e. the request landed. */
export const hasApiResponse = (error: unknown) => asRecord(asRecord(error).response).status !== undefined;
