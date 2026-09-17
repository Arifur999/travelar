import { describe, expect, it } from "vitest";
import { matchesSearch } from "./SearchableSelect";

/** The value SearchableSelect builds: label, second line, then the id after a separator. */
const value = (label: string, description: string, id: string) => `${label} ${description}␟${id}`;

const RAHIM = value("Rahim Uddin", "01720048055", "0191a5e2-aaaa-4bcd-9abc-def012345678");

describe("matchesSearch", () => {
  it("shows everything before a search starts", () => {
    expect(matchesSearch(RAHIM, "")).toBe(1);
    expect(matchesSearch(RAHIM, "   ")).toBe(1);
  });

  it("finds by any part of the name, ignoring case", () => {
    expect(matchesSearch(RAHIM, "rahim")).toBe(1);
    expect(matchesSearch(RAHIM, "UDD")).toBe(1);
  });

  it("finds by phone digits in order, not scattered", () => {
    expect(matchesSearch(RAHIM, "48055")).toBe(1);
    // Regression: fuzzy matching accepted digits spread through the number.
    expect(matchesSearch(value("Other Person", "01780405050", "x"), "48055")).toBe(0);
  });

  it("needs every word", () => {
    expect(matchesSearch(RAHIM, "rahim 0172")).toBe(1);
    expect(matchesSearch(RAHIM, "rahim karim")).toBe(0);
  });

  it("finds by keywords that are not displayed", () => {
    expect(matchesSearch(RAHIM, "bx1000012", ["BX1000012"])).toBe(1);
    expect(matchesSearch(RAHIM, "bx1000012")).toBe(0);
  });

  it("never matches on the hidden id", () => {
    // uuids are hex: without this, "a" or "def" would match every row.
    expect(matchesSearch(RAHIM, "def012")).toBe(0);
    expect(matchesSearch(RAHIM, "aaaa")).toBe(0);
  });

  it("offers 'clear selection' only before a search starts", () => {
    expect(matchesSearch("__clear__", "")).toBe(1);
    expect(matchesSearch("__clear__", "clear")).toBe(0);
    expect(matchesSearch("__clear__", "c")).toBe(0);
  });
});
