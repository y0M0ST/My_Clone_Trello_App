import { useEffect, useState } from "react"
import { apiFactory, API_ENDPOINTS } from "@/shared/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar"
import { Button } from "@/shared/ui/button"
import type { User } from "@/shared/types"
import { useNavigate } from "react-router-dom"
import { tokenStorage } from "@/shared/utils/tokenStorage"
import { ArrowLeft } from "lucide-react"

export const ProfilePage = () => {
    const [user, setUser] = useState<User | null>(() => tokenStorage.getUser())
    const navigate = useNavigate()

    useEffect(() => {
        const fetchUser = async () => {
            try {
                if (!tokenStorage.getAccessToken()) return;
                const response = await apiFactory.get(API_ENDPOINTS.AUTH.ME)
                const userData = response.responseObject
                if (userData) {
                    setUser(userData)
                    tokenStorage.setUser(userData)
                }
            } catch (err) {
                console.error("Failed to fetch user profile", err)
            }
        }
        fetchUser()
    }, [])

    const getInitials = (name: string) => {
        return name ? name.charAt(0).toUpperCase() : "U";
    }

    if (!user) {
        return <p className="text-center mt-10">Loading profile...</p>
    }

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
            <Card className="w-full max-w-md shadow-lg relative">
                <CardHeader className="text-center border-b bg-white rounded-t-xl relative p-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900"
                        onClick={() => navigate("/dashboard")}
                        title="Quay lại Dashboard"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <CardTitle>Hồ sơ cá nhân</CardTitle>
                </CardHeader>

                <CardContent className="flex flex-col items-center gap-6 p-6">
                    <div className="relative">
                        <Avatar className="w-24 h-24 text-2xl border-4 border-white shadow-md">
                            <AvatarImage
                                src={user.avatarUrl || "https://github.com/shadcn.png"}
                                alt={user.name}
                                className="object-cover" 
                            />
                            <AvatarFallback className="bg-gray-200 text-gray-600">
                                {getInitials(user.name)}
                            </AvatarFallback>
                        </Avatar>
                    </div>

                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
                        <p className="text-gray-500 font-medium">{user.email}</p>

                        {user.bio ? (
                            <p className="text-sm text-gray-600 italic bg-gray-100 px-4 py-2 rounded-lg mt-2 inline-block">
                                "{user.bio}"
                            </p>
                        ) : (
                            <p className="text-sm text-gray-400 italic mt-2">Chưa có giới thiệu bản thân</p>
                        )}
                    </div>

                    <div className="w-full h-px bg-gray-200 my-2"></div>

                    <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={() => navigate("/profile/edit")}
                    >
                        Chỉnh sửa thông tin
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}