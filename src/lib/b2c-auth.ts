import { z } from "zod";

const tokenString = z.string().trim().min(1);

export const b2cAuthTokenSchema = z
  .union([
    tokenString,
    z.object({ access_token: tokenString }),
    z.object({ accessToken: tokenString }),
    z.object({ token: tokenString }),
  ])
  .transform((response) => {
    if (typeof response === "string") return response;
    return "access_token" in response
      ? response.access_token
      : "accessToken" in response
        ? response.accessToken
        : response.token;
  });
