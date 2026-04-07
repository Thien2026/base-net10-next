"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import {
    Plus, Edit2, Trash2, X, AlertTriangle, GripVertical,
    ToggleLeft, ToggleRight, ChevronDown, ChevronUp, ClipboardList
} from "lucide-react";
import toast from "react-hot-toast";

const FIELD_TYPES = ["Text", "Textarea", "Number", "Date", "Boolean", "Select"];

interface FieldDefinition {
    id: string;
    label: string;
    fieldKey: string;
    fieldType: string;
    isRequired: boolean;
    displayOrder: number;
    selectOptions: string[] | null;
    placeholder: string | null;
    groupId: string | null;
    groupName: string | null;
    isActive: boolean;
    createdAt: string;
}

interface ProfileGroup {
    id: string;
    name: string;
}

const emptyForm = {
    id: "",
    label: "",
    fieldKey: "",
    fieldType: "Text",
    isRequired: false,
    displayOrder: 0,
    placeholder: "",
    groupId: "",
    isActive: true,
    selectOptionsRaw: "", // comma-separated for UI
};

export default function ProfileFieldsPage() {
    const [fields, setFields] = useState<FieldDefinition[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [deleteTarget, setDeleteTarget] = useState<FieldDefinition | null>(null);
    const [groups, setGroups] = useState<ProfileGroup[]>([]);

    const loadFields = useCallback(async () => {
        try {
            setIsLoading(true);
            const [fieldsData, groupsData] = await Promise.all([
                fetchApi<FieldDefinition[]>("/AdminProfileFields"),
                fetchApi<ProfileGroup[]>("/AdminProfileGroups")
            ]);
            setFields(fieldsData);
            setGroups(groupsData);
        } catch {
            toast.error("Không thể tải danh sách.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { loadFields(); }, [loadFields]);

    const openCreate = () => {
        setForm({ ...emptyForm, displayOrder: fields.length });
        setIsModalOpen(true);
    };

    const openEdit = (f: FieldDefinition) => {
        setForm({
            id: f.id,
            label: f.label,
            fieldKey: f.fieldKey,
            fieldType: f.fieldType,
            isRequired: f.isRequired,
            displayOrder: f.displayOrder,
            placeholder: f.placeholder ?? "",
            groupId: f.groupId ?? "",
            isActive: f.isActive,
            selectOptionsRaw: f.selectOptions?.join(", ") ?? "",
        });
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const isCreate = !form.id;
            const selectOptions = form.fieldType === "Select"
                ? form.selectOptionsRaw.split(",").map(s => s.trim()).filter(Boolean)
                : null;

            const payload = {
                label: form.label,
                fieldKey: form.fieldKey,
                fieldType: form.fieldType,
                isRequired: form.isRequired,
                displayOrder: Number(form.displayOrder),
                placeholder: form.placeholder || null,
                groupId: form.groupId || null,
                isActive: form.isActive,
                selectOptions,
            };

            if (isCreate) {
                await fetchApi("/AdminProfileFields", { method: "POST", body: JSON.stringify(payload) });
            } else {
                await fetchApi(`/AdminProfileFields/${form.id}`, { method: "PUT", body: JSON.stringify(payload) });
            }

            toast.success(isCreate ? "Đã tạo trường mới!" : "Đã cập nhật trường!");
            setIsModalOpen(false);
            loadFields();
        } catch {
            // toast already shown by fetchApi
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleActive = async (field: FieldDefinition) => {
        try {
            const selectOptions = field.selectOptions;
            await fetchApi(`/AdminProfileFields/${field.id}`, {
                method: "PUT",
                body: JSON.stringify({
                    label: field.label,
                    fieldType: field.fieldType,
                    isRequired: field.isRequired,
                    displayOrder: field.displayOrder,
                    placeholder: field.placeholder,
                    groupId: field.groupId,
                    isActive: !field.isActive,
                    selectOptions,
                }),
            });
            toast.success(`Đã ${!field.isActive ? "kích hoạt" : "vô hiệu hoá"} trường "${field.label}".`);
            loadFields();
        } catch { }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await fetchApi(`/AdminProfileFields/${deleteTarget.id}`, { method: "DELETE" });
            toast.success(`Đã xoá trường "${deleteTarget.label}".`);
            setDeleteTarget(null);
            loadFields();
        } catch { }
    };

    const fieldTypeColor: Record<string, string> = {
        Text: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30",
        Textarea: "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30",
        Number: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/30",
        Date: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30",
        Boolean: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30",
        Select: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30",
    };


    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-blue-400 dark:to-indigo-300">
                        Thông Tin Người Dùng
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Quản lý các trường dữ liệu tùy chỉnh cho hồ sơ người dùng
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-indigo-500/25 transition-all w-full sm:w-auto"
                >
                    <Plus size={18} />
                    <span>Thêm Trường Mới</span>
                </button>
            </div>

            {/* Info Banner */}
            <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl p-4 flex items-start gap-3">
                <ClipboardList className="text-indigo-500 dark:text-indigo-400 mt-0.5 shrink-0" size={20} />
                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                    Các trường bạn tạo ở đây sẽ xuất hiện trong trang hồ sơ của người dùng. Người dùng có thể điền thông tin vào các trường này.
                    Bật/tắt trường để ẩn/hiện mà không xoá dữ liệu.
                </p>
            </div>

            {/* Table */}
            <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-xl dark:shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="bg-slate-100 dark:bg-black/20 text-slate-600 dark:text-slate-400 text-sm border-b border-slate-200 dark:border-white/10">
                                <th className="px-6 py-4 font-semibold w-8">#</th>
                                <th className="px-6 py-4 font-semibold">Tên Trường</th>
                                <th className="px-6 py-4 font-semibold">Nhóm (Group)</th>
                                <th className="px-6 py-4 font-semibold">Khoá</th>
                                <th className="px-6 py-4 font-semibold">Kiểu Dữ Liệu</th>
                                <th className="px-6 py-4 font-semibold text-center">Bắt buộc</th>
                                <th className="px-6 py-4 font-semibold text-center">Trạng thái</th>
                                <th className="px-6 py-4 font-semibold text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <div className="w-8 h-8 mx-auto border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                        <p className="mt-4 text-slate-500 dark:text-slate-400">Đang tải...</p>
                                    </td>
                                </tr>
                            ) : fields.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center">
                                        <ClipboardList className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                                        <p className="font-medium text-slate-500 dark:text-slate-400">Chưa có trường nào được tạo.</p>
                                        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Nhấn "Thêm Trường Mới" để bắt đầu.</p>
                                    </td>
                                </tr>
                            ) : (
                                fields.map((f, idx) => (
                                    <tr key={f.id} className={`hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group ${!f.isActive ? 'opacity-50' : ''}`}>
                                        <td className="px-6 py-4 text-slate-400 dark:text-slate-500 text-sm">{f.displayOrder}</td>
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-slate-800 dark:text-slate-200">{f.label}</span>
                                            {f.placeholder && <span className="block text-xs text-slate-400 mt-0.5 italic">{f.placeholder}</span>}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                            {f.groupName ? (
                                                <span className="bg-slate-100 dark:bg-white/10 px-2 py-1 rounded-md">{f.groupName}</span>
                                            ) : (
                                                <span className="text-slate-400 italic">Mặc định</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <code className="text-xs font-mono bg-slate-100 dark:bg-black/30 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-md">{f.fieldKey}</code>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${fieldTypeColor[f.fieldType] ?? ''}`}>
                                                {f.fieldType}
                                            </span>
                                            {f.fieldType === "Select" && f.selectOptions && (
                                                <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">
                                                    ({f.selectOptions.join(", ")})
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {f.isRequired
                                                ? <span className="text-xs font-bold text-rose-500">Có</span>
                                                : <span className="text-xs text-slate-400">Không</span>}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleToggleActive(f)}
                                                title={f.isActive ? "Vô hiệu hoá" : "Kích hoạt"}
                                                className="inline-flex items-center gap-1.5 text-sm transition-colors"
                                            >
                                                {f.isActive
                                                    ? <ToggleRight size={22} className="text-emerald-500" />
                                                    : <ToggleLeft size={22} className="text-slate-400" />}
                                                <span className={f.isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}>
                                                    {f.isActive ? "Bật" : "Tắt"}
                                                </span>
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openEdit(f)}
                                                    className="p-2.5 text-indigo-600 hover:bg-indigo-100 rounded-xl dark:text-indigo-400 dark:hover:bg-indigo-500/20 transition-colors"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(f)}
                                                    className="p-2.5 text-red-600 hover:bg-red-100 rounded-xl dark:text-red-400 dark:hover:bg-red-500/20 transition-colors"
                                                    title="Xoá"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CREATE / EDIT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isSaving && setIsModalOpen(false)} />
                    <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200/50 dark:border-white/10 overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/5">
                            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-300">
                                {form.id ? "Cập nhật Trường" : "Tạo Trường Mới"}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 p-1.5 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tên hiển thị *</label>
                                    <input
                                        required
                                        type="text"
                                        value={form.label}
                                        onChange={e => setForm({ ...form, label: e.target.value })}
                                        placeholder="vd: Ngày sinh"
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Khoá field *
                                        {!form.id && <span className="text-xs font-normal text-slate-400 ml-1">(không đổi được sau khi tạo)</span>}
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        readOnly={!!form.id}
                                        value={form.fieldKey}
                                        onChange={e => setForm({ ...form, fieldKey: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                                        placeholder="vd: date_of_birth"
                                        className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all dark:text-white font-mono text-sm ${form.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Kiểu dữ liệu</label>
                                    <select
                                        value={form.fieldType}
                                        onChange={e => setForm({ ...form, fieldType: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all dark:text-white"
                                    >
                                        {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Thứ tự hiển thị</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={form.displayOrder}
                                        onChange={e => setForm({ ...form, displayOrder: Number(e.target.value) })}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Gợi ý (placeholder)</label>
                                    <input
                                        type="text"
                                        value={form.placeholder ?? ""}
                                        onChange={e => setForm({ ...form, placeholder: e.target.value })}
                                        placeholder="vd: Nhập ngày tháng năm sinh..."
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Phân nhóm (Group)</label>
                                    <select
                                        value={form.groupId}
                                        onChange={e => setForm({ ...form, groupId: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all dark:text-white"
                                    >
                                        <option value="">-- Mặc định (Thông tin khác) --</option>
                                        {groups.map(g => (
                                            <option key={g.id} value={g.id}>{g.name}</option>
                                        ))}
                                    </select>
                                    <p className="mt-1.5 text-[10px] text-slate-400 italic">
                                        Mẹo: Bạn có thể quản lý danh sách nhóm tại trang Quản lý Nhóm.
                                    </p>
                                </div>
                            </div>

                            {form.fieldType === "Select" && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Các lựa chọn <span className="font-normal text-slate-400">(cách nhau bằng dấu phẩy)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.selectOptionsRaw}
                                        onChange={e => setForm({ ...form, selectOptionsRaw: e.target.value })}
                                        placeholder="vd: Kỹ thuật, Kinh doanh, HR, Marketing"
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all dark:text-white"
                                    />
                                </div>
                            )}

                            <div className="flex gap-6 pt-1">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.isRequired}
                                        onChange={e => setForm({ ...form, isRequired: e.target.checked })}
                                        className="w-4 h-4 rounded accent-indigo-600"
                                    />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Bắt buộc nhập</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.isActive}
                                        onChange={e => setForm({ ...form, isActive: e.target.checked })}
                                        className="w-4 h-4 rounded accent-indigo-600"
                                    />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Kích hoạt ngay</span>
                                </label>
                            </div>

                            <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-300 rounded-xl font-semibold transition-colors">
                                    Huỷ bỏ
                                </button>
                                <button type="submit" disabled={isSaving} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-70 flex items-center justify-center">
                                    {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Lưu thay đổi"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRM */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
                    <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200/50 dark:border-white/10 p-6 text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Xác nhận xoá?</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">
                            Xoá trường <strong className="text-slate-800 dark:text-slate-200">"{deleteTarget.label}"</strong> sẽ xoá toàn bộ dữ liệu người dùng đã nhập cho trường này.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-300 rounded-xl font-semibold transition-colors">Huỷ</button>
                            <button onClick={confirmDelete} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors">Xoá ngay</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
