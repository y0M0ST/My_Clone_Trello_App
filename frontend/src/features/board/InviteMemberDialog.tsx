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
        if (open) {
            fetchRoles()
        }
    }, [open])

    const fetchRoles = async () => {
        try {
            setLoadingRoles(true)
            const response: any = await roleApi.getByGroup('board')
            console.log("🛠️ Role API Response Raw:", response);

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
            setRoles(inviteableRoles)

            // Set default role to 'board_member' if exists and nothing selected yet
            if (!roleId) {
                const memberRole = inviteableRoles.find((r: Role) => r.name === 'board_member')
                if (memberRole) {
                    setValue('roleId', memberRole.id)
                } else if (inviteableRoles.length > 0) {
                    setValue('roleId', inviteableRoles[0].id)
                }
            }
        } catch (error) {
            console.error("Failed to fetch roles", error)
            toast.error("Không thể tải danh sách quyền")
        } finally {
            setLoadingRoles(false)
        }
    }

    const onSubmit = async (data: any) => {
        try {
            await boardApi.inviteMember(boardId, data.email, data.roleId)
            toast.success("Đã gửi lời mời thành công!")
            setOpen(false)
            reset()
            onSuccess?.()
        } catch (error: any) {
            const message = error.response?.data?.message || "Lỗi gửi lời mời";
            if (message === 'User not found') {
                toast.error("Email này chưa đăng ký tài khoản trong hệ thống!");
            } else {
                toast.error(message);
            }
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
                        <DialogDescription>
                            Gửi email mời người khác tham gia vào bảng làm việc này.
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
