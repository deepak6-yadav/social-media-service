import {
  createAccessToken,
  createCsrfToken,
  createRefreshToken,
} from "./jwt.js";

const ACCESS_COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";
const CSRF_COOKIE = "csrf_token";

const COOKIE_SECURE = process.env.COOKIE_SECURE;
const COOKIE_SAME_SITE = process.env.COOKIE_SAME_SITE;

function createCookieOptions(maxAge) {
  return {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
    path: "/",
    maxAge,
  };
}

function createCsrfCookieOptions(maxAge) {
  return {
    httpOnly: false,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
    path: "/",
    maxAge,
  };
}

export function setAuthCookies(res, userId, role) {
  const accessToken = createAccessToken(userId, role);
  const refreshToken = createRefreshToken(userId, role);
  const csrfToken = createCsrfToken();

  const accessMaxAge = 15 * 60 * 1000;
  const refreshMaxAge = 7 * 24 * 60 * 60 * 1000;

  res.cookie(ACCESS_COOKIE, accessToken, createCookieOptions(accessMaxAge));
  res.cookie(REFRESH_COOKIE, refreshToken, createCookieOptions(refreshMaxAge));
  res.cookie(CSRF_COOKIE, csrfToken, createCsrfCookieOptions());
}

export function clearAuthCookies(res) {
  const clearOptions = {
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
    path: "/",
  };

  res.clearCookie(ACCESS_COOKIE, clearOptions);
  res.clearCookie(REFRESH_COOKIE, clearOptions);
  res.clearCookie(CSRF_COOKIE, clearOptions);
}

export function requireCsrf(req, res, next) {
  const csrfCookie = req.cookies?.[CSRF_COOKIE];
  const csrfHeader = req.header["x-csrf-token"];

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    res.status(403).json({ message: "Invalid CSRF token" });
  }
  next();
}
