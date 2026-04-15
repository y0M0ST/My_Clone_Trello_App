import { z } from "zod"

/** Keep in sync with backend `auth.schema.ts` RegisterSchema / ResetPasswordSchema */
export const PASSWORD_REGEX =
  /(?=^.{8,}$)((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/

export const passwordFieldSchema = z
  .string()
  .min(8, "Mật khẩu ít nhất 8 ký tự")
  .regex(
    PASSWORD_REGEX,
    "Cần chữ hoa, chữ thường, và ít nhất một chữ số hoặc ký tự đặc biệt"
  )
