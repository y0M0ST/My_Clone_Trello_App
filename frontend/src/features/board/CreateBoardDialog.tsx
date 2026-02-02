"use client"

import { useState } from "react"
import { useForm } from "react-hook-form" // 👇 Import thêm useWatch nếu cần, hoặc dùng watch từ useForm
import { boardApi } from "@/shared/api/board.api"
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
import { Textarea } from "@/shared/ui/textarea"
import { Loader2, Plus } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/ui/select"
import { toast } from "sonner"

interface CreateBoardDialogProps {
    workspaceId: string
    onSuccess?: () => void
    children?: React.ReactNode
}

export function CreateBoardDialog({ workspaceId, onSuccess, children }: CreateBoardDialogProps) {
    const [open, setOpen] = useState(false)

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch, // 👇 Lấy hàm watch để theo dõi độ dài text
        formState: { errors, isSubmitting }
    } = useForm({
        defaultValues: {
            title: "",
            description: "",
            visibility: "public" as "public" | "private"
        }
    })

    // 👇 Theo dõi độ dài ký tự đang nhập
    const titleValue = watch("title") || "";
    const descriptionValue = watch("description") || "";

    const onSubmit = async (data: any) => {
        try {
            await boardApi.createBoard({
                ...data,
                workspaceId
            })

            toast.success("Tạo bảng mới thành công!")
            setOpen(false)
            reset()
            onSuccess?.()
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi tạo bảng")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="outline" size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Tạo bảng mới
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogHeader>
                        <DialogTitle>Tạo bảng mới</DialogTitle>
                        <DialogDescription>
                            Tạo một bảng mới để bắt đầu quản lý công việc trong Workspace này.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* --- TIÊU ĐỀ --- */}
                        <div className="grid gap-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="title">Tiêu đề bảng <span className="text-red-500">*</span></Label>
                                {/* 👇 Bộ đếm ký tự nhỏ xinh */}
                                <span className={`text-xs ${titleValue.length >= 50 ? "text-red-500 font-bold" : "text-muted-foreground"}`}>
                                    {titleValue.length}/50
                                </span>
                            </div>

                            <Input
                                id="title"
                                placeholder="Ví dụ: Dự án Marketing..."
                                maxLength={50} // 👈 Chặn cứng không cho nhập quá 50
                                {...register("title", {
                                    required: "Vui lòng nhập tiêu đề",
                                    maxLength: {
                                        value: 50,
                                        message: "Tiêu đề không được quá 50 ký tự"
                                    }
                                })}
                            />
                            {errors.title && <span className="text-xs text-red-500">{errors.title.message as string}</span>}
                        </div>

                        {/* --- QUYỀN RIÊNG TƯ --- */}
                        <div className="grid gap-2">
                            <Label>Quyền riêng tư</Label>
                            <Select defaultValue="public" onValueChange={(val: any) => setValue("visibility", val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn quyền" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="public">Công khai (Public)</SelectItem>
                                    <SelectItem value="private">Riêng tư (Private)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* --- MÔ TẢ --- */}
                        <div className="grid gap-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="description">Mô tả (Tùy chọn)</Label>
                                {/* 👇 Bộ đếm ký tự cho Description */}
                                <span className={`text-xs ${descriptionValue.length >= 200 ? "text-red-500 font-bold" : "text-muted-foreground"}`}>
                                    {descriptionValue.length}/200
                                </span>
                            </div>

                            <Textarea
                                id="description"
                                placeholder="Mô tả ngắn gọn về bảng này..."
                                className="resize-none"
                                maxLength={200} // 👈 Chặn cứng 200 ký tự
                                {...register("description", {
                                    maxLength: {
                                        value: 200,
                                        message: "Mô tả không được quá 200 ký tự"
                                    }
                                })}
                            />
                            {errors.description && <span className="text-xs text-red-500">{errors.description.message as string}</span>}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Hủy
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Tạo bảng
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}