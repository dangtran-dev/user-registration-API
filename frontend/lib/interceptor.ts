import { useTokensStore } from "@/stores/use-tokens-store";
import { Tokens } from "@/types/tokens";
import axios, { AxiosInstance } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Create a main axios instance for authenticated calls
const instance: AxiosInstance = axios.create({
    baseURL: API_URL,
});

// A plain axios instance without interceptors for refresh to avoid cycles
const refreshClient = axios.create({ baseURL: API_URL });

let isRefreshing = false;
let refreshPromise: Promise<Tokens> | null = null;

// Attach access token to outgoing requests when present
instance.interceptors.request.use(
    (config: any) => {
        try {
            const accessToken = useTokensStore.getState().accessToken;
            if (accessToken && config && config.headers) {
                config.headers = {
                    ...config.headers,
                    Authorization: `Bearer ${accessToken}`,
                };
            }
        } catch (err) {
            // ignore - store might not be ready in SSR
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Helper to perform refresh using the refresh token
const performRefresh = async (refreshToken: string) => {
    try {
        const response = await refreshClient.post("/auth/refresh", null, {
            headers: {
                Authorization: `Bearer ${refreshToken}`,
            },
        });

        const newTokens = response.data as Tokens;
        // update store
        useTokensStore
            .getState()
            .setTokens(newTokens.accessToken, newTokens.refreshToken);
        return newTokens;
    } catch (err: unknown) {
        // If refresh failed with 403 (forbidden) assume refresh token invalid/expired
        if (axios.isAxiosError(err)) {
            const status = err.response?.status;
            if (status === 403) {
                useTokensStore.getState().clearTokens();
                if (typeof window !== "undefined")
                    window.location.href = "/login";
            }
        }

        throw err;
    }
};

// Response interceptor: on 401 try to refresh then retry the request
instance.interceptors.response.use(
    (res) => res,
    async (error: any) => {
        const originalRequest = error.config as any & { _retry?: boolean };

        if (!originalRequest || originalRequest._retry) {
            return Promise.reject(error);
        }

        const status = error.response?.status;

        // Don't attempt refresh for the refresh endpoint itself or signin/signup endpoints
        const requestUrl = originalRequest.url || "";
        if (
            status === 401 &&
            !requestUrl.includes("/auth/refresh") &&
            !requestUrl.includes("/auth/local/login") &&
            !requestUrl.includes("/auth/local/register")
        ) {
            const refreshToken = useTokensStore.getState().refreshToken;

            if (!refreshToken) {
                useTokensStore.getState().clearTokens();
                if (typeof window !== "undefined")
                    window.location.href = "/login";
                return Promise.reject(error);
            }

            // If a refresh is already in progress, wait for it
            if (!isRefreshing) {
                isRefreshing = true;
                refreshPromise = performRefresh(refreshToken).finally(() => {
                    isRefreshing = false;
                    refreshPromise = null;
                });
            }

            try {
                const newTokens = await refreshPromise!;

                // Mark original request as retried to avoid loops
                originalRequest._retry = true;
                if (!originalRequest.headers) originalRequest.headers = {};
                originalRequest.headers[
                    "Authorization"
                ] = `Bearer ${newTokens.accessToken}`;

                return instance(originalRequest);
            } catch (err) {
                // refresh failed, ensure tokens cleared and redirect already handled inside performRefresh
                return Promise.reject(err);
            }
        }

        return Promise.reject(error);
    }
);

export default instance;
