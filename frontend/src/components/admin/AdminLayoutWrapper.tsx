"use client";

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Menu, X, LayoutDashboard, Users, FileText, Settings, LogOut, ChevronLeft, ChevronRight, Folder, Activity, ClipboardList, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [avatarTimestamp, setAvatarTimestamp] = useState(Date.now());
    const avatarInputRef = React.useRef<HTMLInputElement>(null);

    const { theme, setTheme } = useTheme();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        // Client-side auth guard
        const userDataStr = localStorage.getItem("userData");
        if (!userDataStr) {
            router.replace("/login");
        } else {
            try {
                const localUser = JSON.parse(userDataStr);
                setUser(localUser);

                // Fetch fresh data to ensure avatar/info is up to date
                const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5290/api';
                fetch(`${API_BASE}/User/me`, { credentials: 'include' })
                    .then(res => res.ok ? res.json() : null)
                    .then(freshUser => {
                        if (freshUser) {
                            setUser(freshUser);
                            localStorage.setItem("userData", JSON.stringify(freshUser));
                        }
                    })
                    .catch(() => { });
            } catch (e) { }
        }
    }, [router]);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        setIsUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5290/api';
            const res = await fetch(`${API_BASE}/User/me/avatar`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            if (!res.ok) throw new Error("Upload failed");

            const updatedUser = await res.json();
            setUser(updatedUser);
            setAvatarTimestamp(Date.now()); // bust browser cache
            localStorage.setItem("userData", JSON.stringify(updatedUser));
            toast.success("Đã cập nhật ảnh đại diện");
        } catch (err: any) {
            toast.error(err.message || "Không thể tải lên ảnh đại diện");
        } finally {
            setIsUploadingAvatar(false);
            if (avatarInputRef.current) avatarInputRef.current.value = '';
        }
    };

    const handleLogout = async () => {
        try {
            // Clear httpOnly cookie on the server side
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5290/api'}/Auth/logout`, {
                method: 'POST',
                credentials: 'include',
            });
        } catch {
            // Proceed with logout even if API call fails
        }
        localStorage.removeItem("userData");
        toast.success("Đã đăng xuất thành công.");
        router.push("/login");
    };

    const navGroups = [
        {
            label: null, // no label for primary item
            items: [
                { name: 'Bảng Điều Khiển', href: '/admin', icon: LayoutDashboard },
            ]
        },
        {
            label: 'Nội Dung',
            items: [
                { name: 'Bài Viết', href: '#', icon: FileText },
                { name: 'Quản Lý File', href: '/admin/files', icon: Folder },
            ]
        },
        {
            label: 'Quản Trị',
            items: [
                { name: 'Hồ Sơ Cá Nhân', href: '/admin/profile', icon: UserCircle },
                { name: 'Người Dùng', href: '/admin/users', icon: Users },
                { name: 'Nhóm Thông Tin', href: '/admin/profile-groups', icon: Folder },
                { name: 'Thông Tin User', href: '/admin/profile-fields', icon: ClipboardList },
                { name: 'Nhật Ký Hệ Thống', href: '/admin/audit-logs', icon: Activity },
                { name: 'Cài Đặt', href: '#', icon: Settings },
            ]
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 flex overflow-hidden relative">
            {/* Decorative Gradients mapped to Theme */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-indigo-200 dark:bg-indigo-900/30 rounded-full mix-blend-multiply blur-[128px] opacity-70"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-blue-200 dark:bg-blue-900/30 rounded-full mix-blend-multiply blur-[128px] opacity-70"></div>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } lg:translate-x-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'
                    } flex flex-col bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-r border-slate-200/50 dark:border-white/10 shadow-2xl lg:shadow-none`}
            >
                <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/50 dark:border-white/10">
                    {!isCollapsed && (
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-300 truncate">
                            Source Base
                        </span>
                    )}
                    {isCollapsed && <span className="font-bold text-indigo-500 mx-auto">SB</span>}

                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="hidden lg:block p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors"
                    >
                        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>

                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-white/10"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4 scrollbar-hide">
                    {navGroups.map((group, gIdx) => (
                        <div key={gIdx}>
                            {group.label && !isCollapsed && (
                                <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 select-none">
                                    {group.label}
                                </p>
                            )}
                            {group.label && !isCollapsed && gIdx > 0 && (
                                <div className="h-px bg-slate-200/60 dark:bg-white/5 mb-2 mx-1" />
                            )}
                            <div className="space-y-0.5">
                                {group.items.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} px-3 py-2.5 rounded-xl transition-all duration-200 group ${isActive
                                                ? 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-medium'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                                                }`}
                                            title={isCollapsed ? item.name : undefined}
                                        >
                                            <item.icon size={19} className={`shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                                            {!isCollapsed && <span className="ml-3 truncate text-sm">{item.name}</span>}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-200/50 dark:border-white/10">
                    <button
                        onClick={handleLogout}
                        className={`flex w-full items-center ${isCollapsed ? 'justify-center' : 'justify-start'} px-3 py-3 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors`}
                        title={isCollapsed ? "Đăng xuất" : undefined}
                    >
                        <LogOut size={20} />
                        {!isCollapsed && <span className="ml-3">Đăng xuất</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 z-10 relative">
                {/* Top Header */}
                <header className="h-16 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-b border-slate-200/50 dark:border-white/10 flex items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 -ml-2 mr-2 text-slate-500 hover:bg-slate-200/50 dark:hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <Menu size={24} />
                        </button>
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 hidden sm:block">Trang Quản Trị</h2>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Theme Toggle Button */}
                        {mounted && (
                            <button
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="p-2.5 rounded-full bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-all shadow-sm"
                            >
                                {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-indigo-600" />}
                            </button>
                        )}

                        {/* User Avatar */}
                        <div
                            className="relative w-10 h-10 rounded-full border-2 border-white dark:border-slate-800 shadow-md cursor-pointer group flex-shrink-0"
                            onClick={() => avatarInputRef.current?.click()}
                            title="Click để thay đổi ảnh đại diện"
                        >
                            <input
                                type="file"
                                ref={avatarInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                            />
                            {user?.avatarUrl ? (
                                <img
                                    src={(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5290').replace('/api', '') + user.avatarUrl + `?t=${avatarTimestamp}`}
                                    alt="Avatar"
                                    className="w-full h-full rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">
                                        {user?.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'AD'}
                                    </span>
                                </div>
                            )}

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                {isUploadingAvatar ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <span className="text-white text-[10px] font-medium">+Ảnh</span>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
