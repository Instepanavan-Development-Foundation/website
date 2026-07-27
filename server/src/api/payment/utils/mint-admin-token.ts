// Mints a real Strapi admin session token for a given admin userId, in-process.
// Used so automated callers (the recurring-payments worker, tests) authenticate
// through the same verifyAdminAuth path as a human admin — no static shared secret.
export async function mintAdminToken(strapiInstance: any, userId: string | number): Promise<string> {
  const sessionManager = strapiInstance.sessionManager("admin");
  const { token: refreshToken } = await sessionManager.generateRefreshToken(
    String(userId),
    undefined,
    { type: "session" }
  );
  const result = await sessionManager.generateAccessToken(refreshToken);
  if ("error" in result) {
    throw new Error(`Failed to mint admin token: ${result.error}`);
  }

  return result.token;
}
