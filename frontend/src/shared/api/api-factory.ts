/* eslint-disable @typescript-eslint/no-explicit-any */

import type { AxiosResponse, AxiosRequestConfig } from "axios"
import apiClient from "./api-config"
import { API_ENDPOINTS } from "./api-endpoint"

export interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

class ApiFactory {
  // Hàm get thêm config
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await apiClient.get(url, config)
    return response.data
  }

  // Hàm post thêm config
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await apiClient.post(url, data, config)
    return response.data
  }

  // Hàm put thêm config 
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await apiClient.put(url, data, config)
    return response.data
  }

  // Hàm patch thêm config
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await apiClient.patch(url, data, config)
    return response.data
  }

  // Hàm delete thêm config
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await apiClient.delete(url, config)
    return response.data
  }

  async uploadFile<T = any>(url: string, file: File, fieldName = "file"): Promise<T> {
    const formData = new FormData()
    formData.append(fieldName, file)

    const response: AxiosResponse<T> = await apiClient.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return response.data
  }

  async downloadFile(url: string, filename: string): Promise<void> {
    const response = await apiClient.get(url, {
      responseType: "blob",
    })

    const blob = new Blob([response.data])
    const link = document.createElement("a")
    link.href = window.URL.createObjectURL(blob)
    link.download = filename
    link.click()
    window.URL.revokeObjectURL(link.href)
  }
}

const apiFactory = new ApiFactory()
export default apiFactory

export { API_ENDPOINTS }
