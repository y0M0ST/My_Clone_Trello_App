import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosError,
} from "axios"
import { tokenStorage } from "@/shared/utils/tokenStorage"

interface ApiErrorResponse {
  message?: string
  statusCode?: number
  success?: boolean
}

const apiConfig = {
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
}

const apiClient: AxiosInstance = axios.create(apiConfig)

let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}> = []

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    error ? prom.reject(error) : prom.resolve(token)
  })
  failedQueue = []
}

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getAccessToken()

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    console.log("🚀 API Request:", {
      method: config.method?.toUpperCase(),
      url: config.url,
      hasToken: !!token,
    })

    return config
  },
  (error) => {
    console.error("❌ Request Error:", error)
    return Promise.reject(error)
  }
)

apiClient.interceptors.response.use(
  (response) => {
    console.log("✅ API Response:", {
      status: response.status,
      url: response.config.url,
    })
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const errorData = error.response?.data as ApiErrorResponse | undefined
    const status = error.response?.status
    if (status === 403) {
      console.error("Access Denied:", errorData)
      return Promise.reject(error)
    }
    if (status === 500) {
      console.error("Server Error:", errorData)
      return Promise.reject(error)
    }
    if (status === 401 && !originalRequest._retry) {
      if (
        originalRequest.url?.includes("/auth/login") ||
        originalRequest.url?.includes("/auth/refresh-token")
      ) {
        tokenStorage.clearTokens()
        window.location.href = "/login"
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return apiClient(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = tokenStorage.getRefreshToken()
      if (!refreshToken) {
        console.error("No refresh token available")
        tokenStorage.clearTokens()
        window.location.href = "/login"
        return Promise.reject(error)
      }

      try {
        console.log("🔁 Attempting to refresh token...")

        const response = await axios.post(
          `${apiConfig.baseURL}auth/refresh-token`,
          { refreshToken },
          { headers: { "Content-Type": "application/json" } }
        )

        const { accessToken, refreshToken: newRefreshToken } = response.data.responseObject

        tokenStorage.setAccessToken(accessToken)
        if (newRefreshToken) {
          tokenStorage.setRefreshToken(newRefreshToken)
        }
        console.log("Token refreshed successfully")
        processQueue(null, accessToken)

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
        }

        return apiClient(originalRequest)
      } catch (refreshError) {
        console.error("Refresh token failed:", refreshError)

        processQueue(refreshError as AxiosError, null)
        tokenStorage.clearTokens()
        window.location.href = "/login"

        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    console.error("API Error:", {
      status,
      message: errorData?.message || (error as Error).message,
      url: originalRequest?.url,
    })

    return Promise.reject(error)
  }
)

export default apiClient
