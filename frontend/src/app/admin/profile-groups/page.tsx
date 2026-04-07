"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import {
    Plus, Edit2, Trash2, X, AlertTriangle, GripVertical,
    ChevronDown, ChevronUp, Layers
} from "lucide-react";
import toast from "react-hot-toast";

interface ProfileGroup {
    id: string;
    name: string;
    displayOrder: number;
    isActive: boolean;
}

const emptyForm = {
    id: "",
    name: "",
    displayOrder: 0,
    isActive: true,
};

export default function ProfileGroupsPage() {
    const [groups, setGroups] = useState<ProfileGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [deleteTarget, setDeleteTarget] = useState<ProfileGroup | null>(null);

    const loadGroups = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await fetchApi<ProfileGroup[]>("/AdminProfileGroups");
            setGroups(data);
        } catch {
            toast.error("Không thể tải danh sách nhóm.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadGroups(); }, [loadGroups]);

    const openCreate = () => {
        setForm({ ...emptyForm, displayOrder: groups.length });
        setIsModalOpen(true);
    };

    const openEdit = (g: ProfileGroup) => {
        setForm({
            id: g.id,
            name: g.name,
            displayOrder: g.displayOrder,
            isActive: g.isActive,
        });
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const isCreate = !form.id;
            const payload = {
                name: form.name,
                displayOrder: Number(form.displayOrder),
                isActive: form.isActive,
            };

            if (isCreate) {
                await fetchApi("/AdminProfileGroups", {
                    method: "POST",
                    body: JSON.stringify(payload),
                });
                toast.success("Đã tạo nhóm mới.");
            } else {
                await fetchApi(`/AdminProfileGroups/${form.id}`, {
                    method: "PUT",
                    body: JSON.stringify(payload),
                });
                toast.success("Đã cập nhật nhóm.");
            }
            setIsModalOpen(false);
            loadGroups();
        } catch {
            toast.error("Có lỗi xảy ra khi lưu.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await fetchApi(`/AdminProfileGroups/${deleteTarget.id}`, { method: "DELETE" });
            toast.success("Đã xoá nhóm.");
            setDeleteTarget(null);
            loadGroups();
        } catch {
            toast.error("Không thể xoá nhóm.");
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                        <Layers className="w-8 h-8 text-indigo-500" />
                        Quản lý Nhóm Thông Tin
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Thiết lập các nhóm để phân loại trường thông tin người dùng.</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                >
                    <Plus className="w-5 h-5" /> Thêm nhóm mới
                </button>
            </div>

            <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                            <th className="px-6 py-4 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-16 text-center">STT</th>
                            <th className="px-6 py-4 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tên Nhóm</th>
                            <th className="px-6 py-4 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center w-32">Thứ tự</th>
                            <th className="px-6 py-4 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center w-32">Trạng thái</th>
                            <th className="px-6 py-4 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right w-32">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">Đang tải dữ liệu...</td>
                            </tr>
                        ) : groups.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">Chưa có nhóm nào được định nghĩa.</td>
                            </tr>
                        ) : (
                            groups.map((group, idx) => (
                                <tr key={group.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 text-center font-mono text-slate-400">{group.displayOrder}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-700 dark:text-white text-lg">{group.name}</div>
                                        <div className="text-xs text-slate-400 font-mono mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tighter">ID: {group.id}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-full text-sm font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                                            {group.displayOrder}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {group.isActive ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold uppercase tracking-wider">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Đang dùng
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 rounded-full text-xs font-bold uppercase tracking-wider">
                                                Tạm ẩn
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openEdit(group)}
                                                className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors border border-transparent hover:border-indigo-100 dark:hover:border-indigo-500/30"
                                                title="Sửa nhóm"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteTarget(group)}
                                                className="p-2 hover:bg-rose-50 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg transition-colors border border-transparent hover:border-rose-100 dark:hover:border-rose-500/30"
                                                title="Xoá nhóm"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Create/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 border border-slate-200 dark:border-white/10">
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                {form.id ? <Edit2 className="w-5 h-5 text-indigo-500" /> : <Plus className="w-5 h-5 text-emerald-500" />}
                                {form.id ? "Sửa nhóm thông tin" : "Tạo nhóm thông tin mới"}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tên nhóm</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        placeholder="vd: Thông tin cá nhân, Công việc..."
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all dark:text-white"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Thứ tự hiển thị</label>
                                        <input
                                            type="number"
                                            value={form.displayOrder}
                                            onChange={e => setForm({ ...form, displayOrder: parseInt(e.target.value) })}
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all dark:text-white"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Trạng thái</label>
                                        <div className="flex-1 flex items-center">
                                            <button
                                                type="button"
                                                onClick={() => setForm({ ...form, isActive: !form.isActive })}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-xs uppercase tracking-widest ${form.isActive ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/20'}`}
                                            >
                                                <div className={`w-2 h-2 rounded-full ${form.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                                {form.isActive ? "Đang kích hoạt" : "Đang tạm ẩn"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 font-semibold transition-all"
                                >
                                    Huỷ bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-8 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/25 active:scale-95 flex items-center gap-2"
                                >
                                    {isSaving ? "Đang lưu..." : (form.id ? "Cập nhật ngay" : "Tạo nhóm mới")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirm Delete */}
            {deleteTarget && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setDeleteTarget(null)} />
                    <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 fade-in border border-slate-200 dark:border-white/10">
                        <div className="bg-rose-100 dark:bg-rose-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                            <AlertTriangle className="w-8 h-8 text-rose-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">Xoá nhóm này?</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-center mb-8 px-2">
                            Bạn có chắc muốn xoá nhóm <span className="text-slate-900 dark:text-white font-bold">"{deleteTarget.name}"</span>?
                            Các trường thông tin thuộc nhóm này sẽ trở thành <span className="italic font-semibold italic text-indigo-500">Không có nhóm</span>.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="px-4 py-3 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-all font-bold"
                            >
                                Quay lại
                            </button>
                            <button
                                onClick={handleDelete}
                                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-3 rounded-2xl transition-all font-bold shadow-lg shadow-rose-500/25 active:scale-95"
                            >
                                Đồng ý xoá
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
