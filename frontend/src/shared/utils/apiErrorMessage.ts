import type { AxiosError } from "axios"

/**
 * Lấy thông báo lỗi thân thiện từ lỗi axios / mạng (dùng cho toast).
 */
export function getApiErrorMessage(error: unknown, fallback = "Có lỗi xảy ra"): string {
  if (typeof error !== "object" || error === null) return fallback

  const err = error as AxiosError<{ message?: string }> & { code?: string }

  if (err.code === "ECONNABORTED") {
    return "Hết thời gian chờ máy chủ — thường do gửi email chậm hoặc mạng không ổn định. Thử lại sau vài giây."
  }
  if (!err.response) {
    return "Không kết nối được máy chủ. Kiểm tra mạng hoặc cấu hình API (VITE_API_URL)."
  }

  const msg = err.response.data?.message
  if (typeof msg === "string" && msg.trim()) return msg

  return fallback
}
