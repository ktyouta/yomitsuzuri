/**
 * APIエンドポイント定数
 */
export const API_ENDPOINT = {
  HEALTH: "/api/v1/health",
  SAMPLE: "/api/v1/sample",
  USER: "/api/v1/user",
  USER_LOGIN: "/api/v1/user-login",
  REFRESH: "/api/v1/refresh",
  VERIFY: "/api/v1/verify",
  USER_LOGOUT: "/api/v1/user-logout",
  USER_PASSWORD: "/api/v1/user-password",
  USER_DARK_MODE: "/api/v1/user/dark-mode",
} as const;

export type ApiEndpointType = (typeof API_ENDPOINT)[keyof typeof API_ENDPOINT];
