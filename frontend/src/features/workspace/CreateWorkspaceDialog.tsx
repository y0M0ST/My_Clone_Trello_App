import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { workspaceApi} from "@/shared/api/workspace.api"; 
import type { CreateWorkspacePayload } from "@/shared/api/workspace.api";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

const schema = z.object({
    title: z.string().min(1, "Tên không được để trống"),
    description: z.string().optional(),
    visibility: z.enum(["private", "public"]).default("private"),
});

interface Props {
    children: React.ReactNode;
    onSuccess: () => void; 
}

export const CreateWorkspaceDialog = ({ children, onSuccess }: Props) => {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<CreateWorkspacePayload>({
        resolver: zodResolver(schema),
        defaultValues: { title: "", description: "", visibility: "private" },
    });

    const onSubmit = async (data: CreateWorkspacePayload) => {
        setIsLoading(true);
        try {
            await workspaceApi.create(data);
            toast.success("Tạo Workspace thành công! 🎉");
            setOpen(false); 
            form.reset();   
            onSuccess();   
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Đã xảy ra lỗi!");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Tạo Workspace Mới</DialogTitle></DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Tên Workspace</Label>
                        <Input {...form.register("title")} placeholder="Ví dụ: Team Ăn Nhậu" />
                        {form.formState.errors.title && <p className="text-red-500 text-sm">{form.formState.errors.title.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Mô tả</Label>
                        <Textarea {...form.register("description")} placeholder="Mô tả ngắn..." />
                    </div>

                    <div className="space-y-2">
                        <Label>Quyền riêng tư</Label>
                        <Select onValueChange={(val: any) => form.setValue("visibility", val)} defaultValue="private">
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="private">🔒 Riêng tư</SelectItem>
                                <SelectItem value="public">🌍 Công khai</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>{isLoading ? "Đang tạo..." : "Tạo ngay"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};