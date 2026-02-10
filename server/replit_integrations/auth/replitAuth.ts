import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { Strategy as LocalStrategy } from "passport-local"; // Keep for dev/fallback if needed, or remove
import { authStorage } from "./storage";
// No separate OAuth2Client needed for Logto OIDC unless verifying manually, 
// but we will use the token endpoint.

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week

  const PgStore = connectPg(session);
  const store = new PgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    tableName: "sessions",
  });

  return session({
    store,
    secret: process.env.SESSION_SECRET || "fcai-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Serialize user to session
  passport.serializeUser((user: any, cb) => cb(null, user));
  passport.deserializeUser((user: any, cb) => cb(null, user));

  const LOGTO_ENDPOINT = process.env.LOGTO_ENDPOINT || "https://auth.fc.sa";
  const LOGTO_APP_ID = process.env.LOGTO_APP_ID;
  const LOGTO_APP_SECRET = process.env.LOGTO_APP_SECRET;
  const LOGTO_CALLBACK_URL = process.env.LOGTO_CALLBACK_URL || "https://fc.sa/api/auth/callback";

  // Login redirects to Logto
  app.get("/api/auth/login", (req, res) => {
    if (!LOGTO_APP_ID) {
      console.error("LOGTO_APP_ID not set");
      return res.status(500).json({ message: "Auth configuration missing" });
    }

    const params = new URLSearchParams({
      client_id: LOGTO_APP_ID,
      redirect_uri: LOGTO_CALLBACK_URL,
      response_type: "code",
      scope: "openid email profile offline_access",
      prompt: "consent",
    });

    res.redirect(`${LOGTO_ENDPOINT}/oidc/auth?${params.toString()}`);
  });

  // OIDC Callback
  app.get("/api/auth/callback", async (req, res) => {
    if (!LOGTO_APP_ID || !LOGTO_APP_SECRET) {
      console.error("LOGTO_APP_ID or LOGTO_APP_SECRET not configured");
      return res.redirect("/login?error=auth_not_configured");
    }

    const { code, error, error_description } = req.query;

    if (error) {
      console.error("Auth Error:", error, error_description);
      return res.redirect("/login?error=" + encodeURIComponent(error as string));
    }

    if (!code || typeof code !== "string") {
      return res.redirect("/login?error=no_code");
    }

    try {
      const tokenParams = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: LOGTO_APP_ID!,
        client_secret: LOGTO_APP_SECRET!,
        redirect_uri: LOGTO_CALLBACK_URL,
      });

      const tokenRes = await fetch(`${LOGTO_ENDPOINT}/oidc/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: tokenParams,
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        throw new Error(`Token exchange failed: ${errText}`);
      }

      const tokens = await tokenRes.json();
      // tokens: { access_token, id_token, refresh_token, ... }

      // Decode ID Token to get user info (no need to verify signature locally if over TLS from trusted issuer, 
      // but ideally use a library. For now, decode payload).
      const idToken = tokens.id_token;
      if (!idToken) throw new Error("No ID Token received");

      const payloadPart = idToken.split(".")[1];
      const payload = JSON.parse(Buffer.from(payloadPart, "base64").toString());

      const userId = payload.sub; // Logto user ID
      const email = payload.email;
      const name = payload.name;
      const picture = payload.picture;

      // Extract first/last name
      const [firstName, ...lastParts] = (name || "").split(" ");
      const lastName = lastParts.join(" ");

      // Upsert user
      const user = await authStorage.upsertUser({
        id: userId,
        email: email,
        firstName: firstName || "User",
        lastName: lastName,
        profileImageUrl: picture,
      });

      // Session claims 
      // We map Logto user to our session structure
      const sessionUser: any = {
        claims: {
          sub: user.id,
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
          picture: user.profileImageUrl,
        },
        expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 1 week
        // We can also store access_token/refresh_token if needed for API calls
        tokens: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
        }
      };

      req.login(sessionUser, (err) => {
        if (err) throw err;
        res.redirect("/dashboard");
      });
    } catch (err) {
      console.error("Callback processing error:", err);
      res.redirect("/login?error=processing_failed");
    }
  });

  // Logout
  app.get("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) console.error("Logout error", err);
      // Redirect to Logto end_session_endpoint if desired, or just home
      // `${LOGTO_ENDPOINT}/oidc/session/end?post_logout_redirect_uri=${...}`
      res.redirect("/");
    });
  });

  // Keep GET /api/login for compatibility if something links to it
  app.get("/api/login", (req, res) => {
    res.redirect("/api/auth/login");
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;
  if (!req.isAuthenticated() || !user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return next();
};
