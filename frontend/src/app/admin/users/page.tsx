"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import { Search, UserPlus, Edit2, Trash2, CheckCircle2, XCircle, Shield, ChevronLeft, ChevronRight, X, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

interface UserDto {
    id: string;
    email: string;
    userName: string;
    fullName: string;
    isActive: boolean;
    roles: string[];
}

interface PagedResponse<T> {
    pageNumber: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
    data: T;
}

export default function UsersManagementPage() {
    const [users, setUsers] = useState<UserDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Pagination & Search States
    const [searchTerm, setSearchTerm] = useState("");
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    // Modal Form States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitLoading, setIsSubmitLoading] = useState(false);
    const [formData, setFormData] = useState({
        id: "",
        email: "",
        userName: "",
        fullName: "",
        role: "Member",
        password: "",
        isActive: true
    });

    // Modal Delete States
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string, name: string } | null>(null);

    const loadUsers = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await fetchApi<PagedResponse<UserDto[]>>(
                `/User?pageNumber=${pageNumber}&pageSize=${pageSize}&searchTerm=${searchTerm}`
            );
            setUsers(data.data);
            setTotalPages(data.totalPages);
            setTotalRecords(data.totalRecords);
        } catch (error) {
            console.error("Failed to load users", error);
        } finally {
            setIsLoading(false);
        }
    }, [pageNumber, pageSize, searchTerm]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadUsers();
        }, 500);
        return () => clearTimeout(timer);
    }, [loadUsers, searchTerm]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPageNumber(newPage);
        }
    };

    const openCreateModal = () => {
        setFormData({ id: "", email: "", userName: "", fullName: "", role: "Member", password: "", isActive: true });
        setIsModalOpen(true);
    };

    const openEditModal = (user: UserDto) => {
        setFormData({
            id: user.id,
            email: user.email,
            userName: user.userName,
            fullName: user.fullName,
            role: user.roles && user.roles.length > 0 ? user.roles[0] : "Member",
            password: "", // Leave blank on edit
            isActive: user.isActive
        });
        setIsModalOpen(true);
    };

    const openDeleteModal = (id: string, name: string) => {
        setDeleteTarget({ id, name });
        setIsDeleteModalOpen(true);
    };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitLoading(true);
        try {
            const isCreate = !formData.id;
            const url = isCreate ? `/User` : `/User/${formData.id}`;
            const method = isCreate ? "POST" : "PUT";

            await fetchApi(url, {
                method,
                body: JSON.stringify({
                    email: formData.email,
                    userName: formData.userName || formData.email,
                    fullName: formData.fullName,
                    role: formData.role,
                    password: formData.password,
                    isActive: formData.isActive
                }),
            });

            toast.success(isCreate ? "Tạo tài khoản thành công!" : "Cập nhật tài khoản thành công!");
            setIsModalOpen(false);
            loadUsers();
        } catch (error) {
            // Global toast handles the error UI automatically
        } finally {
            setIsSubmitLoading(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setIsSubmitLoading(true);
        try {
            await fetchApi(`/User/${deleteTarget.id}`, { method: "DELETE" });
            toast.success("Đã xoá tài khoản thành công.");
            setIsDeleteModalOpen(false);

            // If deleting the last item on the page, go to previous page
            if (users.length === 1 && pageNumber > 1) {
                setPageNumber(pageNumber - 1);
            } else {
                loadUsers();
            }
        } catch (error) {
            // Handled globally
        } finally {
            setIsSubmitLoading(false);
        }
    };

    return (
        <div className="w-full h-full flex flex-col space-y-6 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-blue-400 dark:to-indigo-300">
                        Quản lý Người Dùng
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Tổng cộng: {totalRecords} tài khoản hệ thống
                    </p>
                </div>

                <button
                    onClick={openCreateModal}
                    className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-indigo-500/25 transition-all w-full sm:w-auto"
                >
                    <UserPlus size={18} />
                    <span>Thêm Mới</span>
                </button>
            </div>

            <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm tài khoản..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPageNumber(1);
                        }}
                        className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-black/20 border border-slate-300 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    />
                </div>
            </div>

            <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-xl dark:shadow-2xl flex-1 flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="bg-slate-100 dark:bg-black/20 text-slate-600 dark:text-slate-400 text-sm border-b border-slate-200 dark:border-white/10">
                                <th className="px-6 py-4 font-semibold">Tài khoản</th>
                                <th className="px-6 py-4 font-semibold">Email</th>
                                <th className="px-6 py-4 font-semibold">Phân quyền</th>
                                <th className="px-6 py-4 font-semibold text-center">Trạng thái</th>
                                <th className="px-6 py-4 font-semibold text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                        <div className="w-8 h-8 mx-auto border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                        <p className="mt-4 font-medium">Đang tải dữ liệu...</p>
                                    </td>
                                </tr>
                            ) : users && users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                        <Shield className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                                        <p className="font-medium">Không tìm thấy tài khoản nào phù hợp.</p>
                                    </td>
                                </tr>
                            ) : users ? (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-800 dark:text-slate-200 block max-w-[200px] truncate" title={user.fullName}>{user.fullName || "Chưa có tên"}</span>
                                                <span className="text-sm text-slate-500 dark:text-slate-400">@{user.userName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium tracking-wide">
                                            {user.email}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-2">
                                                {user.roles && user.roles.map(r => (
                                                    <span key={r} className={`px-2.5 py-1 text-xs font-semibold rounded-full border shadow-sm ${r === 'SuperAdmin' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30' :
                                                        r === 'Admin' ? 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30' :
                                                            r === 'Editor' ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30' :
                                                                'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30'
                                                        }`}>
                                                        {r}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center">
                                                <div className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-semibold border shadow-sm ${user.isActive
                                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'
                                                    : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/20 dark:text-slate-400 dark:border-slate-500/30'
                                                    }`}>
                                                    {user.isActive ? <CheckCircle2 size={14} className="mr-1" /> : <XCircle size={14} className="mr-1" />}
                                                    {user.isActive ? 'Hoạt động' : 'Đã Khoá'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="p-2.5 text-indigo-600 hover:bg-indigo-100 rounded-xl dark:text-indigo-400 dark:hover:bg-indigo-500/20 transition-colors shadow-sm" title="Chỉnh sửa">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => openDeleteModal(user.id, user.fullName || user.userName)}
                                                    disabled={user.userName === "admin"}
                                                    className="p-2.5 text-red-600 hover:bg-red-100 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed dark:text-red-400 dark:hover:bg-red-500/20 transition-colors shadow-sm" title="Xoá">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : null}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {!isLoading && totalPages > 1 && (
                    <div className="border-t border-slate-200 dark:border-white/10 px-6 py-4 flex items-center justify-between bg-slate-50/50 dark:bg-black/10">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Trang <span className="font-bold text-indigo-600 dark:text-indigo-400">{pageNumber}</span> trên <span className="font-bold text-slate-700 dark:text-slate-300">{totalPages}</span>
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePageChange(pageNumber - 1)}
                                disabled={pageNumber === 1}
                                className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-sm"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                onClick={() => handlePageChange(pageNumber + 1)}
                                disabled={pageNumber === totalPages}
                                className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-sm"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* --- CREATE/UPDATE MODAL FORM --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => !isSubmitLoading && setIsModalOpen(false)}></div>
                    <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden transform transition-all scale-100">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/5">
                            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-300">
                                {formData.id ? "Cập nhật Thông tin" : "Tạo Tài Khoản Mới"}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 p-1.5 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveUser} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email *</label>
                                    <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all dark:text-white" placeholder="vd: nhanvien@congty.com" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tên Đăng Nhập</label>
                                    <input type="text" value={formData.userName} onChange={(e) => setFormData({ ...formData, userName: e.target.value.toLowerCase().replace(/\s/g, '') })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all dark:text-white" placeholder="Bỏ trống thì lấy Email" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Họ và Tên</label>
                                <input required type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all dark:text-white" placeholder="Nguyễn Văn A" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Phân quyền</label>
                                    <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all dark:text-white font-medium">
                                        <option value="Member">Member</option>
                                        <option value="Editor">Editor</option>
                                        <option value="Admin">Admin</option>
                                        <option value="SuperAdmin">SuperAdmin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Trạng thái</label>
                                    <select value={formData.isActive.toString()} onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all dark:text-white font-medium">
                                        <option value="true">Hoạt động</option>
                                        <option value="false">Đã Khoá</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Mật khẩu {formData.id && <span className="text-xs font-normal text-slate-400 ml-1">(Bỏ trống nếu không muốn đổi)</span>}
                                </label>
                                <input required={!formData.id} type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all dark:text-white" placeholder={formData.id ? "••••••••" : "Nhập mật khẩu an toàn..."} />
                            </div>

                            <div className="pt-4 mt-2 border-t border-slate-100 dark:border-white/5 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-300 rounded-xl font-semibold transition-colors">
                                    Huỷ bỏ
                                </button>
                                <button type="submit" disabled={isSubmitLoading} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-70 flex items-center justify-center">
                                    {isSubmitLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Lưu thay đổi"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- CONFIRM DELETE DIALOG --- */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => !isSubmitLoading && setIsDeleteModalOpen(false)}></div>
                    <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200/50 dark:border-white/10 p-6 text-center transform transition-all scale-100">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Xác nhận xoá?</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">
                            Bạn có chắc chắn muốn xoá tài khoản <br /><strong className="text-slate-800 dark:text-slate-200">{deleteTarget?.name}</strong> vĩnh viễn không? Dữ liệu này không thể khôi phục.
                        </p>

                        <div className="flex gap-3">
                            <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-300 rounded-xl font-semibold transition-colors">
                                Huỷ bỏ
                            </button>
                            <button type="button" onClick={confirmDelete} disabled={isSubmitLoading} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-70 flex items-center justify-center">
                                {isSubmitLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Xoá ngay"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
