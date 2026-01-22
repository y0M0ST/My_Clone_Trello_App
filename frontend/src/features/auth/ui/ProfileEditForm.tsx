import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { useForm, Controller } from "react-hook-form";
import { useRef, useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Camera } from "lucide-react";
interface ProfileEditFormProps {
    defaultValues: {
        name: string;
        bio: string;
        avatar?: FileList;
        avatarUrl?: string | null;
    };
    onSubmit: (data: { name: string; bio: string; avatar?: FileList }) => void;
    isLoading: boolean;
    error: string | null;
}

const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
    defaultValues,
    onSubmit,
    isLoading,
    error,
}) => {
    const { control, handleSubmit, setValue, register, formState: { errors } } = useForm({
        defaultValues: {
            name: defaultValues.name,
            bio: defaultValues.bio,
            avatar: undefined
        },
    });

    const [previewUrl, setPreviewUrl] = useState<string | null>(defaultValues.avatarUrl || null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
            setSelectedFile(file);
        }
    };

    const handleTriggerUpload = (e: React.MouseEvent) => {
        e.preventDefault();
        fileInputRef.current?.click();
    };

    const onFormSubmit = (formData: any) => {
        const finalData = {
            ...formData,
            avatar: selectedFile ? [selectedFile] : undefined
        };

        onSubmit(finalData);
    };

    const initials = defaultValues.name
        ? defaultValues.name.charAt(0).toUpperCase()
        : "U";

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">

            <div className="flex flex-col items-center gap-4 p-4 border rounded-lg bg-gray-50">
                <Label className="text-base font-semibold text-gray-700">Ảnh đại diện</Label>

                <div className="relative group cursor-pointer" onClick={handleTriggerUpload}>
                    <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                        <AvatarImage
                            src={previewUrl || ""}
                            className="object-cover"
                            alt="Avatar Preview"
                        />
                        <AvatarFallback className="text-4xl bg-gray-200 text-gray-500 font-bold">
                            {initials}
                        </AvatarFallback>
                    </Avatar>

                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="text-white w-8 h-8" />
                    </div>
                </div>

                <input
                    id="avatar-upload"
                    title="Tải ảnh đại diện lên"
                    aria-label="Tải ảnh đại diện lên"
                    type="file"
                    ref={(e) => {
                        register("avatar").ref(e);
                        fileInputRef.current = e;
                    }}
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                />

                <Button
                    type="button"
                    variant="secondary"
                    onClick={handleTriggerUpload}
                    className="flex items-center gap-2"
                >
                    <Camera className="w-4 h-4" />
                    Tải ảnh lên
                </Button>
            </div>


            <div className="space-y-2">
                <Label htmlFor="name">Họ và tên</Label>
                <Controller
                    name="name"
                    control={control}
                    rules={{ required: "Tên không được để trống" }}
                    render={({ field }) => <Input {...field} id="name" disabled={isLoading} />}
                />
                {errors.name && <span className="text-sm text-red-500">{errors.name.message}</span>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="bio">Giới thiệu bản thân</Label>
                <Controller
                    name="bio"
                    control={control}
                    render={({ field }) => <Input {...field} id="bio" disabled={isLoading} />}
                />
            </div>

            {error && <div className="text-sm text-red-500 bg-red-50 p-2 rounded text-center font-medium">{error}</div>}

            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
        </form>
    );
};

export default ProfileEditForm;