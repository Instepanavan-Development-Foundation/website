import crypto from "crypto";

// Use db.query for magic-link-token since auto-generated types
// don't exist until after the first build with this content type
const TOKEN_UID = "api::magic-link-token.magic-link-token";

export default {
  /**
   * POST /api/magic-link/send
   * Body: { email: string, returnUrl?: string }
   *
   * Generates a magic link token, stores it, and emails the link.
   * Always returns 200 to prevent email enumeration.
   */
  async send(ctx) {
    const { email, returnUrl } = ctx.request.body as any;

    if (!email) {
      return ctx.send({ error: "Էլ. հասցեն պարտադիր է" }, 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Rate limit: 1 email per 60 seconds per address
    const recentToken = await strapi.db.query(TOKEN_UID).findOne({
      where: {
        email: normalizedEmail,
        createdAt: { $gte: new Date(Date.now() - 60 * 1000) },
      },
    });

    if (recentToken) {
      return ctx.send({ message: "ok" }, 200);
    }

    // Generate secure random token
    const token = crypto.randomBytes(32).toString("hex");

    // Calculate expiry
    const expiryMinutes = parseInt(
      process.env.MAGIC_LINK_EXPIRY_MINUTES || "15",
      10,
    );
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Store token
    await strapi.db.query(TOKEN_UID).create({
      data: {
        email: normalizedEmail,
        token,
        expiresAt,
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
        subject: "Մուտք գործել — Ինստեպանավան",
        text: `Սեղմեք հղումին մուտք գործելու համար:\n\n${magicLink}\n\nՀղումը գործում է ${expiryMinutes} րոպե:`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Մուտք գործել Ինստեպանավան</h2>
            <p>Սեղմեք ստորև գտնվող կոճակին մուտք գործելու համար:</p>
            <p style="margin: 24px 0;">
              <a href="${magicLink}"
                style="display: inline-block; padding: 12px 24px;
                  background: linear-gradient(to right, #ec4899, #f43f5e);
                  color: white; text-decoration: none; border-radius: 8px;
                  font-weight: bold;">
                Մուտք գործել
              </a>
            </p>
            <p style="color: #666; font-size: 14px;">
              Հղումը գործում է ${expiryMinutes} րոպե:
            </p>
            <p style="color: #999; font-size: 12px;">
              Եթե դուք չեք պահանջել այս հղումը, անտեսեք այն:
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
    const { token } = ctx.query as any;

    if (!token) {
      return ctx.send({ error: "Token is required" }, 400);
    }

    // Look up token
    const magicToken = await strapi.db.query(TOKEN_UID).findOne({
      where: {
        token,
        used: false,
      },
    });

    if (!magicToken) {
      return ctx.send({ error: "Անվավեր կամ ժամկետանց անցած հղում" }, 400);
    }

    // Check expiry
    if (new Date(magicToken.expiresAt) < new Date()) {
      await strapi.db.query(TOKEN_UID).update({
        where: { id: magicToken.id },
        data: { used: true },
      });
      return ctx.send({ error: "Հղումի ժամկետը լրացել է" }, 400);
    }

    // Mark token as used (one-time use)
    await strapi.db.query(TOKEN_UID).update({
      where: { id: magicToken.id },
      data: { used: true },
    });

    const email = magicToken.email;

    // Find existing user by email
    const user = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({ where: { email } });

    let isNewUser = false;
    let finalUser = user;

    if (!user) {
      isNewUser = true;
      // Auto-create user
      const defaultRole = await strapi.db
        .query("plugin::users-permissions.role")
        .findOne({ where: { type: "authenticated" } });

      // Random password (required by Strapi schema but never used)
      const randomPassword = crypto.randomBytes(32).toString("hex");

      // Use the plugin's register method to properly hash the password
      const pluginStore = await strapi.store({
        type: "plugin",
        name: "users-permissions",
      });
      const settings = await pluginStore.get({ key: "advanced" }) as any;

      finalUser = await strapi
        .plugin("users-permissions")
        .service("user")
        .add({
          username: email,
          email,
          password: randomPassword,
          confirmed: true,
          blocked: false,
          role: defaultRole.id,
          provider: "local",
        });
    } else if (!user.confirmed) {
      // Auto-confirm user on magic link verification
      finalUser = await strapi.db
        .query("plugin::users-permissions.user")
        .update({
          where: { id: user.id },
          data: { confirmed: true },
        });
    }

    // Issue JWT
    const jwt = strapi
      .service("plugin::users-permissions.jwt")
      .issue({ id: finalUser.id });

    return ctx.send(
      {
        jwt,
        isNewUser,
        user: {
          id: finalUser.id,
          documentId: finalUser.documentId,
          email: finalUser.email,
          username: finalUser.username,
          fullName: finalUser.fullName,
        },
      },
      200,
    );
  },
};
