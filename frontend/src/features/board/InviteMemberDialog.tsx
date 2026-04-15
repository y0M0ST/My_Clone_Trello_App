"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { boardApi } from "@/shared/api/board.api"
import { roleApi, type Role } from "@/shared/api/role.api"
import { Button } from "@/shared/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/ui/select"
import { Loader2, UserPlus, Mail } from "lucide-react"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/shared/utils/apiErrorMessage"

interface InviteMemberDialogProps {
    boardId: string
    onSuccess?: () => void
    children?: React.ReactNode
}

export function InviteMemberDialog({ boardId, onSuccess, children }: InviteMemberDialogProps) {
    const [open, setOpen] = useState(false)
    const [roles, setRoles] = useState<Role[]>([])
    const [loadingRoles, setLoadingRoles] = useState(false)

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        getValues,
        watch,
        formState: { errors, isSubmitting }
    } = useForm({
        defaultValues: {
            email: "",
            roleId: ""
        }
    })

    const roleId = watch("roleId")

    useEffect(() => {
        if (!open) return
        let cancelled = false

        const run = async () => {
            try {
            setLoadingRoles(true)
            const response: any = await roleApi.getByGroup('board')
            // console.log("🛠️ Role API Response Raw:", response);

            let allRoles: Role[] = [];

            if (Array.isArray(response)) {
                allRoles = response;
            } else if (Array.isArray(response?.data)) {
                allRoles = response.data;
            } else if (Array.isArray(response?.responseObject)) {
                allRoles = response.responseObject;
            } else if (Array.isArray(response?.responseObject?.roles)) {
                allRoles = response.responseObject.roles;
            } else if (Array.isArray(response?.roles)) {
                allRoles = response.roles;
            } else if (Array.isArray(response?.items)) {
                allRoles = response.items;
            } else {
                console.warn("⚠️ Unknown role response structure:", response);
                allRoles = [];
            }

            const inviteableRoles = allRoles.filter((r: Role) => r.name !== 'board_owner')
            if (cancelled) return
            setRoles(inviteableRoles)

            // Set default role to 'board_member' if exists and nothing selected yet
            if (!getValues("roleId")) {
                const memberRole = inviteableRoles.find((r: Role) => r.name === 'board_member')
                if (memberRole) {
                    setValue('roleId', memberRole.id)
                } else if (inviteableRoles.length > 0) {
                    setValue('roleId', inviteableRoles[0].id)
                }
            }
            } catch (error) {
            if (cancelled) return
            console.error("Failed to fetch roles", error)
            toast.error("Không thể tải danh sách quyền")
            } finally {
            if (!cancelled) setLoadingRoles(false)
            }
        }

        void run()
        return () => {
            cancelled = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ tải roles khi mở dialog; getValues/setValue ổn định từ RHF
    }, [open])

    const onSubmit = async (data: any) => {
        const loadingId = toast.loading("Đang gửi lời mời và email…")
        try {
            const res = (await boardApi.inviteMember(
                boardId,
                data.email,
                data.roleId
            )) as { success?: boolean; message?: string } | void

            if (res && typeof res === "object" && res.success === false) {
                toast.error(res.message || "Không gửi được lời mời", { id: loadingId })
                return
            }

            toast.success(
                "Đã gửi lời mời. Người nhận kiểm tra hộp thư và thư mục spam / Quảng cáo.",
                { id: loadingId, duration: 6000 }
            )
            setOpen(false)
            reset()
            onSuccess?.()
        } catch (error: unknown) {
            const raw = getApiErrorMessage(error, "Lỗi gửi lời mời")
            const message =
                raw === "User not found"
                    ? "Email này chưa có tài khoản TaskFlow — chỉ mời được người đã đăng ký."
                    : raw
            toast.error(message, { id: loadingId, duration: 8000 })
        }
    }

    const getRoleLabel = (roleName: string) => {
        switch (roleName) {
            case 'board_admin': return 'Quản trị viên (Admin)'
            case 'board_member': return 'Thành viên (Member)'
            case 'board_observer': return 'Người xem (Observer)'
            default: return roleName
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="outline" size="sm">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Mời
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogHeader>
                        <DialogTitle>Mời thành viên vào bảng</DialogTitle>
                        <DialogDescription className="text-left space-y-1">
                            <span>
                                Chỉ mời được người đã có tài khoản TaskFlow. Họ sẽ nhận email chấp nhận/từ chối.
                            </span>
                            <span className="block text-amber-700 dark:text-amber-500 text-xs">
                                Địa chỉ phải là email thật (domain tồn tại). Email kiểu @domain-không-tồn-tại sẽ bị từ chối bởi máy chủ thư — hệ thống sẽ không thêm thành viên nếu gửi mail thất bại.
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Địa chỉ Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    className="pl-9"
                                    {...register("email", {
                                        required: "Vui lòng nhập email",
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: "Email không hợp lệ"
                                        }
                                    })}
                                />
                            </div>
                            {errors.email && <span className="text-xs text-red-500">{errors.email.message as string}</span>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="role">Vai trò</Label>
                            <Select
                                value={roleId}
                                onValueChange={(val) => setValue("roleId", val)}
                                disabled={loadingRoles || roles.length === 0}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={
                                        loadingRoles ? "Đang tải quyền..." :
                                            roles.length === 0 ? "Không có quyền nào" : "Chọn vai trò"
                                    } />
                                </SelectTrigger>
                                <SelectContent className="z-[9999]">
                                    {roles.map((role) => (
                                        <SelectItem key={role.id} value={role.id}>
                                            {getRoleLabel(role.name)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.roleId && <span className="text-xs text-red-500">Vui lòng chọn vai trò</span>}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting || loadingRoles}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Gửi lời mời
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
