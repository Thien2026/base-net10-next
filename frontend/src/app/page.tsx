"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function PublicHome() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const userDataStr = localStorage.getItem("userData");
    if (userDataStr) {
      try {
        const parsed = JSON.parse(userDataStr);
        setUser(parsed);
        const roles = parsed.roles || [];
        if (roles.some((r: string) => ["SuperAdmin", "Admin", "Editor"].includes(r))) {
          setIsAdmin(true);
        }
      } catch {
        localStorage.clear();
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setIsAdmin(false);
    toast.success("Đã đăng xuất.");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>

      <div className="relative z-10 text-center max-w-2xl">
        <h1 className="text-5xl font-extrabold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
          Lên Mạng Dễ Dàng.
        </h1>
        <p className="text-xl text-slate-400 mb-10 leading-relaxed">
          Nền tảng Source Base hiện đại, thiết kế theo chuẩn Clean Architecture tích hợp sẵn Backend và Frontend siêu tốc.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {user ? (
            <>
              {isAdmin && (
                <Link href="/admin" className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/25 transition-all w-full sm:w-auto">
                  Vào Trang Quản Trị
                </Link>
              )}
              <button onClick={handleLogout} className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium border border-white/10 transition-all w-full sm:w-auto">
                Đăng xuất ({user.fullName})
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/25 transition-all w-full sm:w-auto">
                Đăng nhập hệ thống
              </Link>
              <button className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium border border-white/10 transition-all cursor-not-allowed opacity-50 w-full sm:w-auto">
                Đăng ký thành viên
              </button>
            </>
          )}
        </div>

      </div>

      <p className="absolute bottom-8 text-slate-500 text-sm">
        Hỗ trợ phân quyền: SuperAdmin, Admin, Editor, Member.
      </p>
    </div>
  );
}
