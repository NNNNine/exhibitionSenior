import axios, { AxiosRequestConfig, AxiosError } from 'axios';
import { refreshToken as refreshTokenAPI } from '@/lib/api/auth';

// Create axios instance with base URL and default headers
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track if we're currently refreshing token
let isRefreshing = false;
// Queue of requests that should be retried after token refresh
let failedQueue: any[] = [];

// Process failed queue (retry or reject)
const processQueue = (error: any = null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Add a request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token refresh and common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // If we can't access the config or it's already retried, reject
    if (!originalRequest || originalRequest._retry) {
      return Promise.reject(formatError(error));
    }

    // Check for token expiration (401 unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If we're not already refreshing, try to refresh
      if (!isRefreshing) {
        isRefreshing = true;
        originalRequest._retry = true;

        try {
          const refreshTokenStr = localStorage.getItem('refreshToken');
          
          if (!refreshTokenStr) {
            // No refresh token, force logout
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            window.location.href = '/auth/login?expired=true';
            return Promise.reject(formatError(error));
          }

          // Try to refresh the token
          const response = await refreshTokenAPI(refreshTokenStr);
          const { token, refreshToken: newRefreshToken } = response;
          
          // Update tokens in storage
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          // Update Authorization header
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Process queued requests
          processQueue(null, token);
          
          // Retry the original request
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${token}`,
          };
          
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, process queue with error
          processQueue(refreshError);
          
          // Force logout
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/auth/login?expired=true';
          
          return Promise.reject(formatError(refreshError));
        } finally {
          isRefreshing = false;
        }
      } else {
        // If we're already refreshing, add request to queue
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(api(originalRequest));
            },
            reject: (err: any) => {
              reject(err);
            }
          });
        });
      }
    }
    
    // Handle other error cases
    return Promise.reject(formatError(error));
  }
);

// Format error messages from API responses
export const formatError = (error: any): Error => {
  let message = 'An unexpected error occurred';
  
  if (error.response) {
    // Server responded with an error status code
    message = 
      error.response.data?.message || 
      error.response.data?.error || 
      `Error ${error.response.status}: ${error.response.statusText}`;
  } else if (error.request) {
    // Request made but no response received
    message = 'No response from server. Please check your connection.';
  } else if (error.message) {
    // Error in request setup
    message = error.message;
  }
  
  return new Error(message);
};

export default api;

// Export individual API services
export * from '@/lib/api/auth';
export * from '@/lib/api/artwork';
export * from '@/lib/api/exhibition';
export * from '@/lib/api/user';