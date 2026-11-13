import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// En emulador Android, 10.0.2.2 mapea a localhost de la máquina anfitriona
const BASE_URL = 'http://10.0.2.2:5000/api';

class ApiClient {
  private static instance: AxiosInstance;

  public static getInstance(): AxiosInstance {
    if (!ApiClient.instance) {
      ApiClient.instance = axios.create({
        baseURL: BASE_URL,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      // Interceptor de Peticiones: inyecta Bearer token si existe
      ApiClient.instance.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
          // Token gestionado vía closure o memoria
          const token = ApiClient.authToken;
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        },
        (error) => Promise.reject(error)
      );

      // Interceptor de Respuestas: manejo centralizado de errores
      ApiClient.instance.interceptors.response.use(
        (response) => response,
        (error) => {
          if (error.response?.status === 401) {
            if (ApiClient.onUnauthorizedCallback) {
              ApiClient.onUnauthorizedCallback();
            }
          }
          return Promise.reject(error);
        }
      );
    }

    return ApiClient.instance;
  }

  public static authToken: string | null = null;
  public static onUnauthorizedCallback: (() => void) | null = null;

  public static setToken(token: string | null) {
    ApiClient.authToken = token;
  }

  public static setOnUnauthorized(cb: () => void) {
    ApiClient.onUnauthorizedCallback = cb;
  }
}

export const api = ApiClient.getInstance();
export const setAuthToken = ApiClient.setToken;
export const setOnUnauthorized = ApiClient.setOnUnauthorized;
