import crypto from "crypto";

// Use db.query for magic-link-token since auto-generated types
// don't exist until after the first build with this content type
const TOKEN_UID = "api::magic-link-token.magic-link-token";

async function findOrCreateUser(email: string) {
  const user = await strapi.db
    .query("plugin::users-permissions.user")
    .findOne({ where: { email } });

  if (user) {
    if (!user.confirmed) {
      return strapi.db
        .query("plugin::users-permissions.user")
        .update({ where: { id: user.id }, data: { confirmed: true } });
    }
    return { user, isNewUser: false };
  }

  const defaultRole = await strapi.db
    .query("plugin::users-permissions.role")
    .findOne({ where: { type: "authenticated" } });

  const randomPassword = crypto.randomBytes(32).toString("hex");

  const newUser = await strapi
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

  return { user: newUser, isNewUser: true };
}

function issueJwt(userId: number) {
  return strapi.service("plugin::users-permissions.jwt").issue({ id: userId });
}

export default {
  /**
   * POST /api/magic-link/send
   * Body: { email: string, returnUrl?: string }
   *
   * Generates a magic link token + 4-digit OTP, stores them, and emails both.
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

    const token = crypto.randomBytes(32).toString("hex");
    const otp = String(Math.floor(1000 + Math.random() * 9000));

    const expiryMinutes = parseInt(
      process.env.MAGIC_LINK_EXPIRY_MINUTES || "5",
      10,
    );
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    await strapi.db.query(TOKEN_UID).create({
      data: { email: normalizedEmail, token, otp, expiresAt, used: false },
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    let magicLink = `${frontendUrl}/auth/verify?token=${token}`;
    if (returnUrl) {
      magicLink += `&returnUrl=${encodeURIComponent(returnUrl)}`;
    }

    const time = new Date().toLocaleTimeString("hy-AM", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Yerevan",
    });

    try {
      await strapi.plugin("email").service("email").send({
        to: normalizedEmail,
        subject: `Մուտք գործել — Ինստեփանավան (${time})`,
        text: `Ձեր մուտքի կոդը՝ ${otp}\n\nԿամ սեղմեք հղումին:\n${magicLink}\n\nԿոդը գործում է ${expiryMinutes} րոպե:`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Մուտք գործել Ինստեփանավան</h2>
            <p style="color: #555;">Մուտքի կոդը.</p>
            <div style="text-align: center; margin: 24px 0;">
              <span style="display: inline-block; font-size: 52px; font-weight: bold;
                letter-spacing: 16px; color: #c2410c; background: #fff7ed;
                border: 2px solid #fed7aa; border-radius: 12px; padding: 16px 40px;">
                ${otp}
              </span>
            </div>
            <p style="color: #555;">Կամ սեղմեք կոճակին.</p>
            <p style="margin: 16px 0;">
              <a href="${magicLink}"
                style="display: inline-block; padding: 12px 24px;
                  background: linear-gradient(to right, #ec4899, #f43f5e);
                  color: white; text-decoration: none; border-radius: 8px;
                  font-weight: bold;">
                Մուտք գործել
              </a>
            </p>
            <p style="color: #666; font-size: 14px;">Կոդը գործում է ${expiryMinutes} րոպե:</p>
            <p style="color: #999; font-size: 12px;">Եթե դուք չեք պահանջել այս կոդը, անտեսեք այն:</p>
          </div>
        `,
      });
    } catch (err) {
      strapi.log.error("Failed to send magic link email:", err);
    }

    return ctx.send({ message: "ok" }, 200);
  },

  /**
   * GET /api/magic-link/verify?token=xxx
   * Validates the hex token (from email link), issues JWT.
   */
  async verify(ctx) {
    const { token } = ctx.query as any;

    if (!token) {
      return ctx.send({ error: "Token is required" }, 400);
    }

    const magicToken = await strapi.db.query(TOKEN_UID).findOne({
      where: { token, used: false },
    });

    if (!magicToken) {
      return ctx.send({ error: "Անվավեր կամ ժամկետանց անցած հղում" }, 400);
    }

    if (new Date(magicToken.expiresAt) < new Date()) {
      await strapi.db.query(TOKEN_UID).update({
        where: { id: magicToken.id },
        data: { used: true },
      });
      return ctx.send({ error: "Հղումի ժամկետը լրացել է" }, 400);
    }

    await strapi.db.query(TOKEN_UID).update({
      where: { id: magicToken.id },
      data: { used: true },
    });

    const { user: finalUser, isNewUser } = await findOrCreateUser(magicToken.email);

    const jwt = issueJwt(finalUser.id);

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

  /**
   * POST /api/magic-link/verify-otp
   * Body: { email: string, otp: string }
   * Validates the 4-digit OTP, issues JWT.
   */
  async verifyOtp(ctx) {
    const { email, otp } = ctx.request.body as any;

    if (!email || !otp) {
      return ctx.send({ error: "Email and OTP are required" }, 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    const magicToken = await strapi.db.query(TOKEN_UID).findOne({
      where: { email: normalizedEmail, otp, used: false },
    });

    if (!magicToken) {
      return ctx.send({ error: "Սխալ կոդ" }, 400);
    }

    if (new Date(magicToken.expiresAt) < new Date()) {
      await strapi.db.query(TOKEN_UID).update({
        where: { id: magicToken.id },
        data: { used: true },
      });
      return ctx.send({ error: "Կոդի ժամկետը լրացել է" }, 400);
    }

    await strapi.db.query(TOKEN_UID).update({
      where: { id: magicToken.id },
      data: { used: true },
    });

    const { user: finalUser, isNewUser } = await findOrCreateUser(normalizedEmail);

    const jwt = issueJwt(finalUser.id);

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
