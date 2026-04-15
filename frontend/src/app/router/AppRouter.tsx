import { lazy, Suspense } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { ROUTES } from "@/shared/config";
import { PageLoader } from "@/shared/components/Loader";
import { RequireAuth } from "@/app/router/RequireAuth";
import { VerifyPage } from "@/pages/RegisterPage/VerifyPage";
import { ForgotPasswordPage } from "@/pages/Auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/Auth/ResetPasswordPage";
import BoardPage from "@/pages/Board/BoardPage";

const LoginPage = lazy(() =>
    import("@/pages/LoginPage/LoginPage").then(module => ({ default: module.LoginPage }))
);
const DashboardPage = lazy(() =>
    import("@/pages/DashboardPage/DashboardPage")
);
const GoogleCallbackPage = lazy(() =>
    import("@/pages/Auth/GoogleCallbackPage").then(module => ({ default: module.GoogleCallbackPage }))
);
const RegisterPage = lazy(() =>
    import("@/pages/RegisterPage/RegisterPage").then(module => ({ default: module.RegisterPage }))
);
const ProfilePage = lazy(() =>
    import("@/pages/ProfilePage/ProfilePage").then(module => ({ default: module.ProfilePage }))
);
const ProfileEditPage = lazy(() =>
    import("@/pages/ProfilePage/ProfileEditPage").then(module => ({ default: module.ProfileEditPage }))
);
const ArchivesPage = lazy(() => import("@/pages/Archives/ArchivesPage"));
const SettingsPage = lazy(() => import("@/pages/Settings/SettingsPage"));
const InviteResponsePage = lazy(() => import("@/pages/Invite/InviteResponsePage").then(module => ({ default: module.InviteResponsePage })));

export const AppRouter = () => {
    return (
        <Suspense fallback={<PageLoader />}>
            <Routes>
                <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.LOGIN} replace />} />
                <Route path={ROUTES.LOGIN} element={<LoginPage />} />
                <Route path={ROUTES.DASHBOARD} element={<RequireAuth><DashboardPage /></RequireAuth>} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
                <Route path="/profile/edit" element={<RequireAuth><ProfileEditPage /></RequireAuth>} />
                <Route path="/verify" element={<VerifyPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
                <Route path="/archives" element={<RequireAuth><ArchivesPage /></RequireAuth>} />
                <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
                <Route path="/boards/:boardId" element={<RequireAuth><BoardPage /></RequireAuth>} />
                <Route path="/invite/accept" element={<InviteResponsePage />} />
                <Route path="/invite/decline" element={<InviteResponsePage />} />
            </Routes>
        </Suspense>
    );
};
