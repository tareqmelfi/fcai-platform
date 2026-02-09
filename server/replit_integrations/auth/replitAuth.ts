import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { Strategy as LocalStrategy } from "passport-local";
import { authStorage } from "./storage";

// Default admin user
const DEV_USER = {
  id: "dev-admin-001",
  email: "admin@fc.sa",
  password: "Hh8787965@!",
  firstName: "مدير",
  lastName: "النظام",
};

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || "fcai-secret-key-change-in-production",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy for email/password auth
  passport.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      async (email, password, done) => {
        try {
          if (email === DEV_USER.email && password === DEV_USER.password) {
            return done(null, {
              claims: {
                sub: DEV_USER.id,
                email: DEV_USER.email,
                first_name: DEV_USER.firstName,
                last_name: DEV_USER.lastName,
              },
              expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
            });
          }
          return done(null, false, { message: "بيانات الدخول غير صحيحة" });
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (email === DEV_USER.email && password === DEV_USER.password) {
      await authStorage.upsertUser({
        id: DEV_USER.id,
        email: DEV_USER.email,
        firstName: DEV_USER.firstName,
        lastName: DEV_USER.lastName,
        profileImageUrl: null,
      });
      const sessionUser: any = {
        claims: {
          sub: DEV_USER.id,
          email: DEV_USER.email,
          first_name: DEV_USER.firstName,
          last_name: DEV_USER.lastName,
        },
        expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      };
      req.login(sessionUser, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        return res.json({ success: true, redirect: "/dashboard" });
      });
    } else {
      return res.status(401).json({ message: "بيانات الدخول غير صحيحة" });
    }
  });

  // Register endpoint
  app.post("/api/auth/register", async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "جميع الحقول مطلوبة" });
    }
    const userId = `user-${Date.now()}`;
    const [firstName, ...lastParts] = name.split(" ");
    const lastName = lastParts.join(" ") || "";
    try {
      await authStorage.upsertUser({
        id: userId,
        email,
        firstName: firstName || name,
        lastName,
        profileImageUrl: null,
      });
      const sessionUser: any = {
        claims: {
          sub: userId,
          email,
          first_name: firstName || name,
          last_name: lastName,
        },
        expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      };
      req.login(sessionUser, (err) => {
        if (err) {
          return res.status(500).json({ message: "فشل إنشاء الحساب" });
        }
        return res.json({ success: true, redirect: "/dashboard" });
      });
    } catch {
      return res.status(500).json({ message: "حدث خطأ أثناء التسجيل" });
    }
  });

  // Login redirect
  app.get("/api/login", (req, res) => {
    res.redirect("/login");
  });

  // Logout
  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user?.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  return res.status(401).json({ message: "Unauthorized" });
};
