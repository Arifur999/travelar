import { describe, expect, it } from "vitest";
import { buildQueryString } from "./queryString";

/**
 * The server prefetches under buildQueryString(searchParams) and the table
 * reads under the URL's searchParams.toString(). Both strings are the React
 * Query key, so they must be byte-identical or the prefetch is thrown away.
 */
const clientSide = (url: string) => new URL(url, "http://localhost").searchParams.toString();

describe("buildQueryString", () => {
  // Regression: encodeURIComponent wrote a space as %20 while the client
  // wrote +, so every multi-word search missed its prefetch.
  it("encodes a multi-word search exactly as the browser does", () => {
    const server = buildQueryString({ searchTerm: "Smoke ticket 42" });
    expect(server).toBe("searchTerm=Smoke+ticket+42");
    expect(server).toBe(clientSide("/x?searchTerm=Smoke%20ticket%2042"));
  });

  it("repeats a key for multi-select values instead of joining with commas", () => {
    expect(buildQueryString({ status: ["OPEN", "RESOLVED"] })).toBe("status=OPEN&status=RESOLVED");
  });

  it("keeps bracket range keys, percent-encoded the way URLSearchParams does", () => {
    const server = buildQueryString({ "fare[gte]": "1000", "fare[lte]": "5000" });
    expect(server).toBe(clientSide("/x?fare[gte]=1000&fare[lte]=5000"));
  });

  it("skips undefined values and keeps empty strings", () => {
    expect(buildQueryString({ page: "2", sortBy: undefined, searchTerm: "" })).toBe("page=2&searchTerm=");
  });

  it("matches the client for a realistic table URL, key for key", () => {
    const url = "/dashboard/tickets?page=2&limit=20&sortBy=issueDate&sortOrder=desc&status=ISSUED&status=VOID&searchTerm=Rahim Uddin&fare[gte]=500";
    const params = new URL(url, "http://localhost").searchParams;
    const asRecord: Record<string, string | string[]> = {};
    for (const key of new Set(params.keys())) {
      const values = params.getAll(key);
      asRecord[key] = values.length > 1 ? values : values[0]!;
    }
    expect(buildQueryString(asRecord)).toBe(params.toString());
  });

  it("returns an empty string for no params", () => {
    expect(buildQueryString({})).toBe("");
  });
});
