import { describe, expect, it } from "vitest";
import {
  forgotPasswordServerZodSchema,
  resetPasswordFormZodSchema,
  resetPasswordServerZodSchema,
} from "./auth.validation";

describe("forgotPasswordServerZodSchema", () => {
  it("trims and lowercases the address before it is sent", () => {
    const result = forgotPasswordServerZodSchema.safeParse({ email: "  Rahim@Gmail.COM " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("rahim@gmail.com");
  });

  it("rejects something that is not an email", () => {
    expect(forgotPasswordServerZodSchema.safeParse({ email: "rahim" }).success).toBe(false);
  });
});

describe("resetPasswordFormZodSchema", () => {
  it("requires the two passwords to match", () => {
    const result = resetPasswordFormZodSchema.safeParse({ newPassword: "Correct@123", confirmPassword: "Correct@124" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(["confirmPassword"]);
  });

  it("passes matching passwords of at least 8 characters", () => {
    expect(resetPasswordFormZodSchema.safeParse({ newPassword: "Correct@123", confirmPassword: "Correct@123" }).success).toBe(true);
  });
});

describe("resetPasswordServerZodSchema", () => {
  // Bounds mirror the API's resetPasswordZodSchema.
  it("needs a plausible token and an 8–128 character password", () => {
    expect(resetPasswordServerZodSchema.safeParse({ token: "abcdefghijklmnopqrstuvwx", newPassword: "Correct@123" }).success).toBe(true);
    expect(resetPasswordServerZodSchema.safeParse({ token: "short", newPassword: "Correct@123" }).success).toBe(false);
    expect(resetPasswordServerZodSchema.safeParse({ token: "abcdefghijklmnopqrstuvwx", newPassword: "short" }).success).toBe(false);
    expect(resetPasswordServerZodSchema.safeParse({ token: "abcdefghijklmnopqrstuvwx", newPassword: "x".repeat(129) }).success).toBe(false);
  });
});
