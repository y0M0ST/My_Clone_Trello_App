/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiFactory, API_ENDPOINTS } from "../index"
import type { ServiceResponse } from "@/shared/model/service-response"
import type { User } from "@/shared/types"

export interface TokenData {
  accessToken: string
  refreshToken: string
  expiresIn?: string
  tokenType?: string
  user: User
}

export interface LoginRequest {
  email: string
  password: string
}

export type LoginResponse = ServiceResponse<TokenData>

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    return apiFactory.post(API_ENDPOINTS.AUTH.LOGIN, credentials)
  },

  register: async (data: RegisterRequest): Promise<ServiceResponse<any>> => {
    return apiFactory.post(API_ENDPOINTS.AUTH.REGISTER, data)
  },

  logout: async (): Promise<ServiceResponse<any>> => {
    return apiFactory.post(API_ENDPOINTS.AUTH.LOGOUT)
  },

  refreshToken: async (refreshToken: string): Promise<ServiceResponse<any>> => {
    return apiFactory.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, { refreshToken })
  },

  forgotPassword: async (email: string): Promise<ServiceResponse<any>> => {
    return apiFactory.post(API_ENDPOINTS.AUTH.FORGET_PASSWORD, { email })
  },

  resetPassword: async (
    accessToken: string,
    newPassword: string
  ): Promise<ServiceResponse<any>> => {
    return apiFactory.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
      accessToken,
      newPassword,
    })
  },
}
