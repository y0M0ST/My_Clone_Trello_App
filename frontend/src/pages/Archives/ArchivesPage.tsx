import { Archive } from "lucide-react";
// import { RotateCcw } from "lucide-react";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
// import { Button } from "@/shared/ui/button";
// import { workspaceApi } from "@/shared/api/workspace.api";
// import { boardApi } from "@/shared/api/board.api";
// import { listApi } from "@/shared/api/list.api";
// import { cardApi } from "@/shared/api/card.api";
// import { toast } from "sonner";

export default function ArchivesPage() {
    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold flex items-center gap-2 mb-6">
                <Archive className="w-8 h-8 text-orange-500" />
                Kho lưu trữ
            </h1>
            <p className="text-gray-500 mb-8">
                Quản lý và khôi phục các dự án, bảng, danh sách và thẻ đã lưu trữ của bạn.
            </p>

            <div className="bg-white rounded-lg border shadow-sm p-6 min-h-[400px] flex items-center justify-center text-gray-400">
                Tính năng đang được phát triển (Đang chờ API BE cho Global Archive)
            </div>
        </div>
    );
}
