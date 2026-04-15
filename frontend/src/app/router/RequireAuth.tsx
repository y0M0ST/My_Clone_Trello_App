import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { tokenStorage } from "@/shared/utils/tokenStorage"

/**
 * Blocks protected routes when there is no access token (sync check — no dashboard flash before redirect).
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation()
  const token = tokenStorage.getAccessToken()

  if (!token) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <>{children}</>
}
