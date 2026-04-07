"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function AdminDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Check Authentication and Roles
        const token = localStorage.getItem("authToken");
        const userDataStr = localStorage.getItem("userData");

        if (!token || !userDataStr) {
            router.push("/login");
        } else {
            try {
                const parsedUser = JSON.parse(userDataStr);
                const userRoles = parsedUser.roles || [];
                const isManager = userRoles.some((r: string) => ["SuperAdmin", "Admin", "Editor"].includes(r));

                if (!isManager) {
                    toast.error("Truy cập bị từ chối. Bạn không có quyền (Admin/Editor).");
                    router.push("/"); // Redirect back to public home
                } else {
                    setUser(parsedUser);
                    setIsLoaded(true);
                }
            } catch {
                localStorage.clear();
                router.push("/login");
            }
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.clear();
        toast.success("Đã đăng xuất thành công.");
        router.push("/login");
    };

    if (!isLoaded) return <div className="w-full h-full"></div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="backdrop-blur-md bg-white/40 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl dark:shadow-2xl transition-all">
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-blue-400 dark:to-indigo-300">
                        Cổng Thông Tin Tổng Quan
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Dữ liệu theo thời gian thực từ máy chủ</p>
                </div>

                <div className="bg-white/60 dark:bg-white/5 rounded-xl p-6 border border-slate-200 dark:border-white/5 mb-6">
                    <h2 className="text-xl font-semibold mb-2 text-slate-800 dark:text-white">Xin chào, {user?.fullName}!</h2>
                    <p className="text-slate-600 dark:text-slate-400">Tài khoản: <span className="text-indigo-600 dark:text-indigo-400">{user?.userName}</span></p>
                    <p className="text-slate-600 dark:text-slate-400">Email: <span className="text-indigo-600 dark:text-indigo-400">{user?.email}</span></p>
                    <p className="text-slate-600 dark:text-slate-400 mt-2">Phân quyền hiện tại:
                        {user?.roles?.map((r: string) => (
                            <span key={r} className="ml-2 inline-block px-2 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 text-xs rounded-full border border-indigo-200 dark:border-indigo-500/30">
                                {r}
                            </span>
                        ))}
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl cursor-pointer hover:shadow-lg transition-all group">
                        <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Quản lý Bài viết</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Xem, sửa và biên tập nội dung hệ thống.</p>
                    </div>
                    <div className="p-5 bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl cursor-pointer hover:shadow-lg transition-all group">
                        <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Quản lý Người dùng</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Thiết lập tài khoản và phân quyền Role.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
