import crypto from "crypto";

export default {
  /**
   * POST /api/magic-link/send
   * Body: { email: string, returnUrl?: string }
   *
   * Generates a magic link token, stores it, and emails the link.
   * Always returns 200 to prevent email enumeration.
   */
  async send(ctx) {
    const { email, returnUrl } = ctx.request.body;

    if (!email) {
      return ctx.send({ error: "Email is required" }, 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Rate limit: 1 email per 60 seconds per address
    const recentTokens = await strapi
      .documents("api::magic-link-token.magic-link-token")
      .findMany({
        filters: {
          email: { $eq: normalizedEmail },
          createdAt: {
            $gte: new Date(Date.now() - 60 * 1000).toISOString(),
          },
        },
        limit: 1,
      });

    if (recentTokens?.length > 0) {
      return ctx.send({ message: "ok" }, 200);
    }

    // Generate secure random token
    const token = crypto.randomBytes(32).toString("hex");

    // Calculate expiry
    const expiryMinutes = parseInt(
      process.env.MAGIC_LINK_EXPIRY_MINUTES || "15",
      10
    );
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Store token
    await strapi
      .documents("api::magic-link-token.magic-link-token")
      .create({
        data: {
          email: normalizedEmail,
          token,
          expiresAt: expiresAt.toISOString(),
          used: false,
        },
      });

    // Build magic link URL
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    let magicLink = `${frontendUrl}/auth/verify?token=${token}`;
    if (returnUrl) {
      magicLink += `&returnUrl=${encodeURIComponent(returnUrl)}`;
    }

    // Send email
    try {
      await strapi.plugin("email").service("email").send({
        to: normalizedEmail,
        subject: "Login — Instepanavan",
        text: `Click the link to log in:\n\n${magicLink}\n\nThis link expires in ${expiryMinutes} minutes.`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Log in to Instepanavan</h2>
            <p>Click the button below to log in:</p>
            <p style="margin: 24px 0;">
              <a href="${magicLink}"
                style="display: inline-block; padding: 12px 24px;
                  background: linear-gradient(to right, #ec4899, #f43f5e);
                  color: white; text-decoration: none; border-radius: 8px;
                  font-weight: bold;">
                Log in
              </a>
            </p>
            <p style="color: #666; font-size: 14px;">
              This link expires in ${expiryMinutes} minutes.
            </p>
            <p style="color: #999; font-size: 12px;">
              If you did not request this link, you can ignore this email.
            </p>
          </div>
        `,
      });
    } catch (err) {
      strapi.log.error("Failed to send magic link email:", err);
    }

    // Always return success to prevent email enumeration
    return ctx.send({ message: "ok" }, 200);
  },

  /**
   * GET /api/magic-link/verify?token=xxx
   *
   * Validates the token, finds or creates user, issues JWT.
   */
  async verify(ctx) {
    const { token } = ctx.query;

    if (!token) {
      return ctx.send({ error: "Token is required" }, 400);
    }

    // Look up token
    const tokens = await strapi
      .documents("api::magic-link-token.magic-link-token")
      .findMany({
        filters: {
          token: { $eq: token },
          used: { $eq: false },
        },
        limit: 1,
      });

    const magicToken = tokens?.[0];

    if (!magicToken) {
      return ctx.send({ error: "Invalid or expired link" }, 400);
    }

    // Check expiry
    if (new Date(magicToken.expiresAt) < new Date()) {
      await strapi
        .documents("api::magic-link-token.magic-link-token")
        .update({
          documentId: magicToken.documentId,
          data: { used: true },
        });
      return ctx.send({ error: "Link has expired" }, 400);
    }

    // Mark token as used (one-time use)
    await strapi
      .documents("api::magic-link-token.magic-link-token")
      .update({
        documentId: magicToken.documentId,
        data: { used: true },
      });

    const email = magicToken.email;

    // Find existing user by email
    const existingUsers = await strapi
      .documents("plugin::users-permissions.user")
      .findMany({
        filters: { email: { $eq: email } },
        limit: 1,
      });

    let user = existingUsers?.[0];
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      // Auto-create user
      const defaultRole = await strapi
        .query("plugin::users-permissions.role")
        .findOne({ where: { type: "authenticated" } });

      // Random password (required by Strapi schema but never used)
      const randomPassword = crypto.randomBytes(32).toString("hex");

      user = await strapi
        .documents("plugin::users-permissions.user")
        .create({
          data: {
            username: email,
            email,
            password: randomPassword,
            confirmed: true,
            blocked: false,
            role: defaultRole.id,
            provider: "local",
          },
        });
    } else if (!user.confirmed) {
      // Auto-confirm user on magic link verification
      await strapi
        .documents("plugin::users-permissions.user")
        .update({
          documentId: user.documentId,
          data: { confirmed: true },
        });
    }

    // Issue JWT
    const jwt = strapi
      .service("plugin::users-permissions.jwt")
      .issue({ id: user.id });

    return ctx.send(
      {
        jwt,
        isNewUser,
        user: {
          id: user.id,
          documentId: user.documentId,
          email: user.email,
          username: user.username,
          fullName: (user as any).fullName,
        },
      },
      200
    );
  },
};
