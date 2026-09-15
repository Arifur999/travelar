import { describe, expect, it } from "vitest";
import {
  agencyProfileFormZodSchema,
  createTeamMemberServerZodSchema,
  updateAgencyProfileServerZodSchema,
  updateTeamMemberServerZodSchema,
} from "./team.validation";

describe("createTeamMemberServerZodSchema", () => {
  const valid = { name: "Karim", email: "karim@example.test", password: "Temp@12345" };

  // The API stores addresses lowercased; sending it that way keeps the row
  // that comes back reading the same as what was typed.
  it("trims and lowercases the email", () => {
    const result = createTeamMemberServerZodSchema.safeParse({ ...valid, email: "  Karim@Example.TEST " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("karim@example.test");
  });

  it("only accepts the two agency roles", () => {
    expect(createTeamMemberServerZodSchema.safeParse({ ...valid, role: "AGENCY_ADMIN" }).success).toBe(true);
    expect(createTeamMemberServerZodSchema.safeParse({ ...valid, role: "SUPER_ADMIN" }).success).toBe(false);
  });

  it("matches the API's password and name minimums", () => {
    expect(createTeamMemberServerZodSchema.safeParse({ ...valid, password: "short" }).success).toBe(false);
    expect(createTeamMemberServerZodSchema.safeParse({ ...valid, name: "K" }).success).toBe(false);
  });
});

describe("updateTeamMemberServerZodSchema", () => {
  it("refuses SUPER_ADMIN", () => {
    expect(updateTeamMemberServerZodSchema.safeParse({ role: "SUPER_ADMIN" }).success).toBe(false);
  });
});

describe("agency profile schemas", () => {
  const form = { name: "Sonar Bangla Travels", email: "", phone: "", address: "", logo: "" };

  it("the form accepts blank optional fields", () => {
    expect(agencyProfileFormZodSchema.safeParse(form).success).toBe(true);
  });

  // The API treats null as "clear this field" and undefined as "leave it".
  it("the server schema turns blanks into null so they clear on the API", () => {
    const result = updateAgencyProfileServerZodSchema.safeParse({ ...form, phone: "  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({ email: null, phone: null, address: null, logo: null });
    }
  });

  it("rejects a malformed email or logo URL", () => {
    expect(updateAgencyProfileServerZodSchema.safeParse({ ...form, email: "not-an-email" }).success).toBe(false);
    expect(updateAgencyProfileServerZodSchema.safeParse({ ...form, logo: "logo.png" }).success).toBe(false);
    expect(agencyProfileFormZodSchema.safeParse({ ...form, logo: "ftp//nope" }).success).toBe(false);
  });
});
