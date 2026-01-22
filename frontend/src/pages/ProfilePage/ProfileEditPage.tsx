import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"; 
import { useProfileEdit } from "@/hooks/useProfileEdit";
import { useChangePassword } from "@/hooks/useChangePassword"; 
import ProfileEditForm from "@/features/auth/ui/ProfileEditForm";
import { ChangePasswordForm } from "@/features/auth/ui/ChangePasswordForm"; 

export const ProfileEditPage = () => {
    const { updateProfile, isLoading: isUpdating, error: updateError, user } = useProfileEdit();
    const { changePassword, isLoading: isChangingPass, error: passError, success: passSuccess } = useChangePassword();

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
            <Card className="w-full max-w-lg shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl text-center">Cài đặt tài khoản</CardTitle>
                    <CardDescription className="text-center">Quản lý thông tin cá nhân và bảo mật</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="general">Thông tin chung</TabsTrigger>
                            <TabsTrigger value="security">Mật khẩu</TabsTrigger>
                        </TabsList>

                        <TabsContent value="general">
                            <ProfileEditForm
                                defaultValues={{
                                    name: user?.name ?? "",
                                    bio: user?.bio ?? "",
                                    avatarUrl: user?.avatarUrl 
                                }}
                                onSubmit={updateProfile}
                                isLoading={isUpdating}
                                error={updateError}
                            />
                        </TabsContent>

                        <TabsContent value="security">
                            <ChangePasswordForm
                                onSubmit={changePassword}
                                isLoading={isChangingPass}
                                error={passError}
                                success={passSuccess}
                            />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
};