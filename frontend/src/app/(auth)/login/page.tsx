"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { fetchApi } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        userNameOrEmail: "",
        password: "",
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.userNameOrEmail || !formData.password) {
            toast.error("Vui lòng điền đầy đủ tài khoản và mật khẩu.");
            return;
        }

        setIsLoading(true);
        try {
            const data: any = await fetchApi("/Auth/login", {
                method: "POST",
                body: JSON.stringify(formData),
            });

            // Backend đã set httpOnly cookie 'authToken' — ta chỉ lưu thông tin hiển thị UI
            if (data?.userName || data?.email) {
                localStorage.setItem("userData", JSON.stringify({
                    email: data.email,
                    userName: data.userName,
                    fullName: data.fullName,
                    roles: data.roles,
                    avatarUrl: data.avatarUrl
                }));

                toast.success(`Đăng nhập thành công! Xin chào ${data.fullName || data.userName}`);

                const userRoles = data.roles || [];
                const isManager = userRoles.some((r: string) => ["SuperAdmin", "Admin", "Editor"].includes(r));
                if (isManager) {
                    router.push("/admin");
                } else {
                    router.push("/");
                }
            }
        } catch (error) {
            // API client already handled the toast error, so we just catch it here to stop loading state
            console.error("Login Error: ", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4">
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[10%] left-[20%] w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-pulse"></div>
                <div className="absolute top-[40%] right-[20%] w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative w-full max-w-md">
                {/* Glassmorphism Card */}
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-3xl shadow-2xl transition-all duration-300">

                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">
                            Source Base
                        </h1>
                        <p className="text-slate-400 mt-2 text-sm">Đăng nhập vào hệ thống quản trị</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 ml-1">Tài khoản / Email</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
                                placeholder="admin hoặc admin@localhost.com"
                                value={formData.userNameOrEmail}
                                onChange={(e) => setFormData({ ...formData, userNameOrEmail: e.target.value })}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 ml-1">Mật khẩu</label>
                            <input
                                type="password"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                disabled={isLoading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-300 transform hover:scale-[1.02] active:scale-95 flex items-center justify-center ${isLoading ? 'opacity-70 cursor-not-allowed' : ''
                                }`}
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                "Đăng Nhập"
                            )}
                        </button>
                    </form>

                    <p className="text-center mt-6 text-sm text-slate-400">
                        Chưa có tài khoản? <span className="text-indigo-400 hover:text-indigo-300 cursor-pointer transition-colors">Liên hệ Quản trị viên</span>
                    </p>

                </div>
            </div>
        </div>
    );
}
