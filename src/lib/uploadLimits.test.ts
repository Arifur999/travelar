import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The chain a spreadsheet has to get through to be imported.
 *
 * There are four limits between the file picker and the reader — nginx, the
 * proxy's body clone, the Server Action, and the API's own upload filter — and
 * they are spread across two repositories' worth of configuration. When the smallest of them is lower
 * than the one the screen advertises, the upload fails at a layer that has no
 * way to explain itself: a client's 3.5 MB workbook hit the Server Action's
 * 1 MB default, the action rejected, and the page went quiet.
 *
 * So the order is asserted rather than remembered.
 */

/** The API's multer limit, and what the screen tells people it will take. */
const API_FILE_LIMIT_MB = 15;

const sizeToMb = (value: string) => {
  const match = /^(\d+(?:\.\d+)?)\s*(kb|mb|gb|m|k|g)$/i.exec(value.trim());
  if (!match) throw new Error(`not a size: ${value}`);

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  if (unit.startsWith("k")) return amount / 1024;
  if (unit.startsWith("g")) return amount * 1024;
  return amount;
};

describe("the limits an uploaded spreadsheet has to clear", () => {
  it("lets the proxy clone a whole workbook too", () => {
    const config = readFileSync(join(process.cwd(), "next.config.ts"), "utf8");
    const limit = /proxyClientMaxBodySize:\s*"([^"]+)"/.exec(config)?.[1];

    // The quietest of the four. Next clones the body for middleware with its
    // own 10MB cap, and over that it truncates the stream and only warns in
    // the server log — so the file arrives cut in half and fails to parse.
    expect(limit).toBeDefined();
    expect(sizeToMb(limit as string)).toBeGreaterThan(API_FILE_LIMIT_MB);
  });

  it("lets a Server Action carry a whole workbook", () => {
    const config = readFileSync(join(process.cwd(), "next.config.ts"), "utf8");
    const limit = /bodySizeLimit:\s*"([^"]+)"/.exec(config)?.[1];

    // Without this line Next caps the body at 1MB, which is a quarter of a
    // small agency's sheet.
    expect(limit).toBeDefined();
    expect(sizeToMb(limit as string)).toBeGreaterThan(API_FILE_LIMIT_MB);
  });

  it("lets the proxy in front of it carry one too", () => {
    // Sibling repo: the server kit lives with the API it deploys. The env
    // var is the same one scripts/check-api-contract.mjs takes, because a
    // worktree is not beside the API checkout the way the main one is.
    const apiRepo =
      process.env.API_REPO_DIR ?? join(process.cwd(), "..", "travel_agency_backend");
    const template = join(apiRepo, "deploy", "nginx", "site.conf.template");

    let conf: string;
    try {
      conf = readFileSync(template, "utf8");
    } catch {
      // The API repo is not always checked out beside this one — in CI for the
      // web app it is not. Nothing to assert then, and a failure here would be
      // about the checkout rather than the code.
      return;
    }

    const limit = /client_max_body_size\s+([\w.]+);/.exec(conf)?.[1];
    expect(limit).toBeDefined();
    expect(sizeToMb(limit as string)).toBeGreaterThan(API_FILE_LIMIT_MB);
  });
});
