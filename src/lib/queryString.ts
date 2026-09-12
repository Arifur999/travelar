/**
 * Serializes Next's resolved `searchParams` into the query string the backend
 * QueryBuilder expects.
 *
 * `new URLSearchParams(object)` cannot be used here: an array value would
 * stringify to `status=A,B`, and the API's `qs` parser needs the repeated-key
 * form `status=A&status=B` to produce a Prisma `{ in: [...] }`. Bracket keys
 * like `fare[gte]` pass through encoded but intact, which is also what `qs`
 * wants.
 */
export const buildQueryString = (
  searchParams: Record<string, string | string[] | undefined>,
): string =>
  Object.keys(searchParams)
    .map((key) => {
      const value = searchParams[key];
      if (value === undefined) return "";

      if (Array.isArray(value)) {
        return value
          .map((item) => `${encodeURIComponent(key)}=${encodeURIComponent(item)}`)
          .join("&");
      }

      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .filter(Boolean)
    .join("&");

/** The `searchParams` prop shape every server-paginated page receives. */
export type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;
