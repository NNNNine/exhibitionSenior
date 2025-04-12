import axios, { AxiosRequestConfig, AxiosError } from 'axios';
import { refreshToken as refreshTokenAPI } from '@/lib/api/auth';

// Create axios instance with base URL and default headers
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: this enables sending cookies with cross-origin requests
});

// Enhanced token refresh management
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;
let failedQueue: Array<{resolve: (token: string) => void, reject: (error: any) => void}> = [];

// Process queue of waiting requests
const processQueue = (error: any = null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Helper function to set secure cookies
const setCookie = (name: string, value: string, options: Record<string, string | boolean> = {}) => {
  const secure = process.env.NODE_ENV === 'production' ? 'Secure;' : '';
  const cookieString = `${name}=${value}; path=/; SameSite=Strict; HttpOnly; ${secure} ${
    options.maxAge ? `max-age=${options.maxAge};` : ''
  }`;
  document.cookie = cookieString.trim();
};

// Keep track of redirects to prevent loops
let hasRedirectedToLogin = false;
let redirectTimeoutId: NodeJS.Timeout | null = null;

// Add a request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    // Token should now come from the cookie automatically thanks to withCredentials: true
    // We no longer need to manually add the Authorization header as HttpOnly cookies 
    // will be automatically included in the request
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor with improved token refresh logic
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
      originalRequest._retry = true;
      
      // Skip token refresh for auth-related requests
      const isAuthRequest = originalRequest.url?.includes('/auth/');
      if (isAuthRequest) {
        return Promise.reject(formatError(error));
      }
      
      try {
        // Only start a new refresh process if one isn't already in progress
        if (!isRefreshing) {
          isRefreshing = true;
          
          // Use shared promise for all requests that need refreshing
          refreshPromise = (async () => {
            try {
              // Get refresh token from cookie (will be sent automatically with request)
              const { token, refreshToken: newRefreshToken } = await refreshTokenAPI();
              
              // Update auth cookies
              setCookie('token', token, { maxAge: '2592000' });
              setCookie('refreshToken', newRefreshToken, { maxAge: '2592000' });
              
              console.log('Token refreshed successfully');
              
              // Process queued requests
              processQueue(null, token);
              
              return token;
            } catch (refreshError) {
              // Handle token refresh failure
              console.error('Token refresh failed:', refreshError);
              
              // Clear cookies
              setCookie('token', '', { maxAge: '0' });
              setCookie('refreshToken', '', { maxAge: '0' });
              
              // Process queue with error
              processQueue(refreshError, null);
              
              // Only redirect once to prevent redirect loops
              if (!hasRedirectedToLogin) {
                hasRedirectedToLogin = true;
                
                // Clear any existing timeout
                if (redirectTimeoutId) {
                  clearTimeout(redirectTimeoutId);
                }
                
                // Reset the flag after a delay
                redirectTimeoutId = setTimeout(() => {
                  hasRedirectedToLogin = false;
                  redirectTimeoutId = null;
                }, 3000);
                
                // Check if we're not already on the login page
                if (!window.location.pathname.includes('/auth/login')) {
                  window.location.href = '/auth/login?expired=true';
                }
              }
              
              throw refreshError;
            } finally {
              isRefreshing = false;
              refreshPromise = null;
            }
          })();
        }
        
        // Wait for the refresh process to complete and use the new token
        const newToken = await refreshPromise;
        
        // No need to update headers for cookies
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, reject the original request
        return Promise.reject(formatError(refreshError));
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

// Add CSRF protection
export const setupCSRFProtection = () => {
  // Generate a random token
  const generateRandomToken = () => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  };
  
  // Get token from cookie or generate a new one
  const getCsrfToken = () => {
    const tokenCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('XSRF-TOKEN='));
    
    if (tokenCookie) {
      return tokenCookie.split('=')[1];
    }
    
    // Generate and set a new token
    const newToken = generateRandomToken();
    document.cookie = `XSRF-TOKEN=${newToken}; path=/; SameSite=Strict`;
    return newToken;
  };
  
  // Add CSRF token to outgoing requests
  api.interceptors.request.use(config => {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      config.headers['X-XSRF-TOKEN'] = csrfToken;
    }
    return config;
  });
};

// Initialize CSRF protection
setupCSRFProtection();

// Export API instance
export default api;

// Re-export functions from specific API modules
export * from './auth';
export * from './artwork';
export * from './user';
export * from './notification';
export * from './exhibition';