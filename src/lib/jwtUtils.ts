import jwt, { JwtPayload } from "jsonwebtoken";

// Never throws — callers branch on `success` instead of wrapping every check
// in a try/catch.
const verifyToken = (token: string, secret: string) => {
  try {
    return {
      success: true as const,
      decoded: jwt.verify(token, secret) as JwtPayload,
      message: "Token is valid",
    };
  } catch (error) {
    return { success: false as const, decoded: undefined, message: "Invalid token", error };
  }
};

const decodeToken = (token: string) => jwt.decode(token) as JwtPayload | null;

export const jwtUtils = { verifyToken, decodeToken };
