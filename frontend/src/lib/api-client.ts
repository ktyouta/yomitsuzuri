import { env } from '@/config/env';
import { getAccessToken, handleRefresh } from '@/lib/refresh-handler';
import { default as Axios, InternalAxiosRequestConfig } from 'axios';

function authRequestInterceptor(config: InternalAxiosRequestConfig) {

  config.headers = config.headers || {};
  config.headers.Accept = 'application/json';

  const accessToken = getAccessToken();
  if (accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`;
  }

  config.withCredentials = true;

  return config;
}

export const api = Axios.create({
  baseURL: env.API_URL
});

api.interceptors.request.use(authRequestInterceptor);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {

    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {

      originalRequest._retry = true;

      try {
        const newAccessToken = await handleRefresh();

        originalRequest.headers = {
          ...(originalRequest.headers || {}),
          Authorization: `Bearer ${newAccessToken}`,
        };

        return api(originalRequest);
      } catch {
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);
