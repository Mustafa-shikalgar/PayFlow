import axios from "axios";

// FIX: In production (Vercel), this must be set to the Render backend URL
// via the VITE_API_URL environment variable in Vercel's dashboard.
// e.g. VITE_API_URL=https://payflow-api-82ff.onrender.com/api
const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Keep this so HttpOnly cookies are still sent when available
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request Interceptor ────────────────────────────────────────────────────
// Always attach the access token from localStorage as an Authorization header.
// This is the primary authentication mechanism (the protect middleware reads
// from req.headers.authorization).
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ───────────────────────────────────────────────────
// On 401, attempt a token refresh then replay the failed request.
//
// FIX: When calling /auth/refresh, send the refreshToken from localStorage
// in the request BODY. This is the fallback for cross-origin deployments
// (Vercel frontend <-> Render backend) where modern browsers (Chrome 120+)
// block third-party HttpOnly cookies, causing req.cookies to arrive empty.
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Backend error codes that mean "the access token itself is bad/expired"
    // and therefore worth attempting a refresh. Everything else (validation
    // errors, payment-gateway/business errors, etc.) must NOT trigger a token
    // refresh loop.
    const data = error.response?.data || {};
    const tokenErrorCodes = ['NO_TOKEN', 'INVALID_TOKEN', 'TOKEN_EXPIRED'];

    const shouldAttemptRefresh =
      error.response?.status === 401 &&
      tokenErrorCodes.includes(data.code) &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/login") &&
      !originalRequest.url.includes("/auth/register") &&
      !originalRequest.url.includes("/auth/refresh");

    if (!shouldAttemptRefresh) {
      // A 401/400/500 that is NOT a token problem (e.g. a payment gateway
      // error or a validation error) is rejected as-is — no refresh attempt.
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // FIX: Read stored refresh token and send it in the request body.
      // The backend /auth/refresh endpoint now accepts the token from
      // req.body.refreshToken as a fallback when req.cookies is empty.
      const storedRefreshToken = localStorage.getItem("refreshToken");

      const res = await api.post("/auth/refresh", {
        refreshToken: storedRefreshToken || undefined,
      });

      const { accessToken, refreshToken: newRefreshToken } = res.data.data;

      // Persist new tokens
      localStorage.setItem("accessToken", accessToken);
      if (newRefreshToken) {
        localStorage.setItem("refreshToken", newRefreshToken);
      }

      processQueue(null, accessToken);

      originalRequest.headers.Authorization = `Bearer ${accessToken}`;

      return api(originalRequest);
    } catch (err) {
      processQueue(err);

      // Clear all auth state and redirect to login
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");

      window.dispatchEvent(new CustomEvent("auth:logout"));

      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;