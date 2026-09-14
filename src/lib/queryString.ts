/**
 * Serializes Next's resolved `searchParams` into the query string the backend
 * QueryBuilder expects.
 *
 * The output must be byte-identical to the client's `searchParams.toString()`,
 * because both become the React Query key: the page prefetches under this
 * string and the table reads under the URL's. Hand-rolling it with
 * `encodeURIComponent` broke that for any search with a space (`%20` here,
 * `+` there), so a multi-word search rendered a spinner on the server and
 * fetched twice. Serializing through `URLSearchParams` on both sides keeps the
 * encoding the same.
 *
 * `new URLSearchParams(object)` is still not used: an array value would
 * stringify to `status=A,B`, and the API's `qs` parser needs the repeated-key
 * form `status=A&status=B` to produce a Prisma `{ in: [...] }` — hence one
 * `append` per item. Bracket keys like `fare[gte]` come out percent-encoded,
 * which `qs` decodes back.
 */
export const buildQueryString = (
  searchParams: Record<string, string | string[] | undefined>,
): string => {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) continue;

    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    } else {
      params.append(key, value);
    }
  }

  return params.toString();
};

/** The `searchParams` prop shape every server-paginated page receives. */
export type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;
