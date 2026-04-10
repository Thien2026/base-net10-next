"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import {
    Plus, Edit2, Trash2, X, AlertTriangle, GripVertical,
    ToggleLeft, ToggleRight, ChevronDown, ChevronUp, ClipboardList
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import toast from "react-hot-toast";
import { ImagePickerDialog } from "@/components/files/ImagePickerDialog";
import { fileApi, FileItem } from "@/lib/api/files";
import { useNavigationContext } from "@/contexts/NavigationContext";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

const FIELD_TYPES = ["Text", "Textarea", "Number", "Date", "Boolean", "Select", "Email", "Phone", "Reference", "Image"];

const FIELD_TYPE_LABELS: Record<string, string> = {
    Text: "Văn bản ngắn (Text)",
    Textarea: "Văn bản dài nhiều dòng (Textarea)",
    Number: "Số (Number)",
    Date: "Ngày tháng (Date)",
    Boolean: "Đồng ý / Từ chối (Boolean)",
    Select: "Danh sách thả xuống (Select)",
    Email: "Địa chỉ Email",
    Phone: "Số điện thoại (Phone)",
    Reference: "Tham chiếu Cấu trúc (Reference)",
    Image: "Hình Ảnh (Upload File)"
};

const COMMON_ICONS = [
    "Phone", "Mail", "User", "MapPin", "Briefcase", "Building", "Globe", "Link",
    "Facebook", "Twitter", "Github", "Linkedin", "Instagram", "Youtube",
    "Calendar", "Clock", "Award", "BookOpen", "CreditCard", "Shield", "Star",
    "FileText", "Heart", "MessageCircle", "Camera", "Music", "Video",
    "Smartphone", "Laptop", "Monitor", "Users", "Settings", "Activity",
    "Bell", "Headphones", "Home", "Info", "Key", "Lock", "Unlock"
];

interface FieldDefinition {
    id: string;
    label: string;
    fieldKey: string;
    fieldType: string;
    isRequired: boolean;
    displayOrder: number;
    selectOptions: string[] | null;
    placeholder: string | null;
    icon: string | null;
    validationRegex: string | null;
    validationMessage: string | null;
    groupId: string | null;
    groupName: string | null;
    referenceSource: string | null;
    dependsOnField: string | null;
    conditionalOptions: Record<string, string[]> | null;
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
    icon: "",
    validationRegex: "",
    validationMessage: "",
    groupId: "",
    referenceSource: "",
    dependsOnField: "",
    conditionalOptionsMap: {} as Record<string, string>, // Structured dynamic mapping
    conditionalOptions: null as Record<string, string[]> | null,
    isCascading: false,
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
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [treeData, setTreeData] = useState<FileItem | null>(null);
    const [showFolderModal, setShowFolderModal] = useState(false);

    const { setDirty } = useNavigationContext();
    useUnsavedChanges();
    const [initialFormState, setInitialFormState] = useState(emptyForm);

    useEffect(() => {
        if (isModalOpen) {
            setDirty(JSON.stringify(form) !== JSON.stringify(initialFormState));
        } else {
            setDirty(false);
        }
    }, [form, initialFormState, isModalOpen, setDirty]);

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

    useEffect(() => { 
        loadFields(); 
        fileApi.getFolderTree().then(setTreeData).catch(() => {});
    }, [loadFields]);

    const openCreate = () => {
        const newForm = { ...emptyForm, displayOrder: fields.length };
        setForm(newForm);
        setInitialFormState(newForm);
        setIsModalOpen(true);
    };

    const openEdit = (f: FieldDefinition) => {
        const map: Record<string, string> = {};
        if (f.conditionalOptions) {
            for (const [k, v] of Object.entries(f.conditionalOptions)) {
                map[k] = v.join(", ");
            }
        }

        const editForm = {
            id: f.id,
            label: f.label,
            fieldKey: f.fieldKey,
            fieldType: f.fieldType,
            isRequired: f.isRequired,
            displayOrder: f.displayOrder,
            placeholder: f.placeholder ?? "",
            icon: f.icon ?? "",
            validationRegex: f.validationRegex ?? "",
            validationMessage: f.validationMessage ?? "",
            groupId: f.groupId ?? "",
            referenceSource: f.referenceSource ?? "",
            dependsOnField: f.dependsOnField ?? "",
            conditionalOptionsMap: map,
            conditionalOptions: f.conditionalOptions,
            isCascading: !!f.dependsOnField,
            isActive: f.isActive,
            selectOptionsRaw: f.selectOptions?.join(", ") ?? "",
        };

        setForm(editForm);
        setInitialFormState(editForm);
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

            if (form.fieldType === "Select" && form.isCascading && !form.dependsOnField) {
                toast.error("Vui lòng chọn Trường Cha để làm tham chiếu Ánh xạ!");
                setIsSaving(false);
                return;
            }

            let finalConditionalOptions: Record<string, string[]> | null = null;
            if (form.fieldType === "Select" && form.isCascading && form.dependsOnField) {
                finalConditionalOptions = {};
                for (const [key, rawValue] of Object.entries(form.conditionalOptionsMap || {})) {
                    if (rawValue) {
                        const vals = rawValue.split(",").map(v => v.trim()).filter(Boolean);
                        if (vals.length > 0) {
                            finalConditionalOptions[key] = vals;
                        }
                    }
                }
            } else if (form.fieldType === "Image") {
                if (form.conditionalOptions?.multiple?.includes("true")) {
                    finalConditionalOptions = { multiple: ["true"] };
                }
            }

            const payload = {
                label: form.label,
                fieldKey: form.fieldKey,
                fieldType: form.fieldType,
                isRequired: form.isRequired,
                displayOrder: Number(form.displayOrder),
                placeholder: form.placeholder || null,
                icon: form.icon || null,
                validationRegex: form.validationRegex || null,
                validationMessage: form.validationMessage || null,
                groupId: form.groupId || null,
                referenceSource: form.fieldType === "Reference" ? (form.referenceSource || "Users") : (form.fieldType === "Image" ? form.referenceSource : null),
                dependsOnField: form.isCascading ? (form.dependsOnField || null) : null,
                conditionalOptions: finalConditionalOptions,
                isActive: form.isActive,
                selectOptions: (!form.isCascading) ? selectOptions : null, // If cascading, normal selectOptions is null
            };

            if (isCreate) {
                await fetchApi("/AdminProfileFields", { method: "POST", body: JSON.stringify(payload) });
            } else {
                await fetchApi(`/AdminProfileFields/${form.id}`, { method: "PUT", body: JSON.stringify(payload) });
            }

            toast.success(isCreate ? "Đã tạo trường mới!" : "Đã cập nhật trường!");
            setDirty(false);
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
                    icon: field.icon,
                    validationRegex: field.validationRegex,
                    validationMessage: field.validationMessage,
                    groupId: field.groupId,
                    referenceSource: field.referenceSource,
                    dependsOnField: field.dependsOnField,
                    conditionalOptions: field.conditionalOptions,
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
        Email: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30",
        Phone: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/30",
        Reference: "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-500/20 dark:text-pink-300 dark:border-pink-500/30",
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
                                                {FIELD_TYPE_LABELS[f.fieldType] || f.fieldType}
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
                            <button onClick={() => { setIsModalOpen(false); setShowIconPicker(false); }} className="text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 p-1.5 rounded-lg transition-colors">
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
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-slate-800 dark:text-white"
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
                                        className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-slate-800 dark:text-white font-mono text-sm ${form.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Kiểu dữ liệu</label>
                                    <select
                                        value={form.fieldType}
                                        onChange={e => {
                                            const type = e.target.value;
                                            let newRegex = form.validationRegex;
                                            let newMsg = form.validationMessage;
                                            if (type === "Email" && !form.validationRegex) {
                                                newRegex = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";
                                                newMsg = "Email không hợp lệ.";
                                            } else if (type === "Phone" && !form.validationRegex) {
                                                newRegex = "^\\+?[0-9]{10,15}$";
                                                newMsg = "Số điện thoại không hợp lệ (10-15 số).";
                                            }
                                            setForm({ ...form, fieldType: type, validationRegex: newRegex, validationMessage: newMsg });
                                        }}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-slate-800 dark:text-white"
                                    >
                                        {FIELD_TYPES.map(t => <option key={t} value={t}>{FIELD_TYPE_LABELS[t] || t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Thứ tự hiển thị</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={form.displayOrder}
                                        onChange={e => setForm({ ...form, displayOrder: Number(e.target.value) })}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-slate-800 dark:text-white"
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
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-slate-800 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Phân nhóm (Group)</label>
                                    <select
                                        value={form.groupId}
                                        onChange={e => setForm({ ...form, groupId: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-slate-800 dark:text-white"
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

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Chọn Icon (tùy chọn)</label>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setShowIconPicker(!showIconPicker)}
                                            className="w-full h-[46px] flex items-center justify-between px-4 py-2 text-left bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-slate-800 dark:text-white"
                                        >
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                {form.icon ? (
                                                    (() => {
                                                        const Icon = (LucideIcons as any)[form.icon];
                                                        return Icon ? <Icon size={18} className="text-slate-600 dark:text-slate-300 shrink-0" /> : <span className="text-sm shrink-0">{form.icon}</span>;
                                                    })()
                                                ) : (
                                                    <LucideIcons.CircleDashed size={18} className="text-slate-400 shrink-0" />
                                                )}
                                                <span className="text-sm truncate">{form.icon ? form.icon : "Không chọn icon"}</span>
                                            </div>
                                            <ChevronDown size={16} className="text-slate-400 shrink-0 ml-2" />
                                        </button>

                                        {showIconPicker && (
                                            <div className="absolute z-10 w-[260px] sm:w-[320px] mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3 h-64 overflow-y-auto">
                                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => { setForm({ ...form, icon: "" }); setShowIconPicker(false); }}
                                                        className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${!form.icon ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
                                                    >
                                                        <LucideIcons.Ban size={20} className="mb-1" />
                                                        <span className="text-[10px]">None</span>
                                                    </button>
                                                    {COMMON_ICONS.map(iName => {
                                                        const Icon = (LucideIcons as any)[iName];
                                                        if (!Icon) return null;
                                                        return (
                                                            <button
                                                                key={iName}
                                                                type="button"
                                                                onClick={() => { setForm({ ...form, icon: iName }); setShowIconPicker(false); }}
                                                                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${form.icon === iName ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
                                                                title={iName}
                                                            >
                                                                <Icon size={20} className="mb-1" />
                                                                <span className="text-[10px] truncate max-w-full w-full">{iName}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <p className="mt-1.5 text-[10px] text-slate-400 italic">Chọn icon giúp giao diện đẹp hơn.</p>
                                </div>
                            </div>

                            {(form.fieldType === "Text" || form.fieldType === "Email" || form.fieldType === "Phone") && (
                                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-white/5 pt-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Validation Pattern (Regex)</label>
                                        <input
                                            type="text"
                                            value={form.validationRegex ?? ""}
                                            onChange={e => setForm({ ...form, validationRegex: e.target.value })}
                                            placeholder="vd: ^\+?[0-9]{10,15}$"
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-sm font-mono text-slate-800 dark:text-white"
                                        />
                                        <p className="mt-1.5 text-[10px] text-slate-400 italic">Bỏ trống nếu không cần ràng buộc.</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Câu thông báo lỗi tùy chỉnh</label>
                                        <input
                                            type="text"
                                            value={form.validationMessage ?? ""}
                                            onChange={e => setForm({ ...form, validationMessage: e.target.value })}
                                            placeholder="vd: Yêu cầu nhập đúng 10 số."
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-slate-800 dark:text-white"
                                        />
                                        <p className="mt-1.5 text-[10px] text-slate-400 italic">Sẽ hiển thị nếu dữ liệu nhập sai regex.</p>
                                    </div>
                                </div>
                            )}

                            {form.fieldType === "Select" && (
                                <div className="space-y-4">
                                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/10">
                                        <input
                                            type="checkbox"
                                            checked={form.isCascading}
                                            onChange={e => setForm({ ...form, isCascading: e.target.checked })}
                                            className="w-4 h-4 rounded accent-indigo-600"
                                        />
                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Trường phụ thuộc (Cascading)</span>
                                    </label>

                                    {!form.isCascading ? (
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                                Các lựa chọn <span className="font-normal text-slate-400">(cách nhau bằng dấu phẩy)</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={form.selectOptionsRaw}
                                                onChange={e => setForm({ ...form, selectOptionsRaw: e.target.value })}
                                                placeholder="vd: Kỹ thuật, Kinh doanh, HR, Marketing"
                                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-slate-800 dark:text-white"
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/10">
                                            <div className="bg-indigo-50/50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/30 rounded-xl p-3.5 mb-2 text-xs text-indigo-800 dark:text-indigo-200">
                                                <p className="font-semibold mb-1.5 flex items-center gap-1.5">
                                                    <LucideIcons.Info className="w-4 h-4" /> Hướng dẫn thiết lập Ánh xạ:
                                                </p>
                                                <ul className="list-disc pl-4 space-y-1.5 opacity-90 leading-relaxed">
                                                    <li>Trường bạn đang sửa đóng vai trò là <strong>Trường Con</strong> (ví dụ: Thành Phố).</li>
                                                    <li>Hãy chọn <strong>Trường Cha</strong> (ví dụ: Quốc Gia) từ hộp thoại dưới. <i>(Lưu ý: Trường Cha phải được tạo từ trước bằng loại Select thông thường).</i></li>
                                                    <li>Ở ô nhập liệu, liệt kê dữ liệu theo cú pháp <code className="bg-white/50 dark:bg-black/30 px-1 py-0.5 rounded text-[10px] font-mono">GiáTrịCha: Con1, Con2</code>.</li>
                                                </ul>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                                    Phụ thuộc vào Trường (Cha)
                                                </label>
                                                <select
                                                    value={form.dependsOnField}
                                                    onChange={e => setForm({ ...form, dependsOnField: e.target.value })}
                                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-slate-800 dark:text-white"
                                                >
                                                    <option value="">-- Chọn trường Cha --</option>
                                                    {fields.filter(f => f.fieldType === "Select" && f.id !== form.id && !f.dependsOnField).map(f => (
                                                        <option key={f.id} value={f.fieldKey}>{f.label} ({f.fieldKey})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                                    Thiết lập các tuỳ chọn (Ánh xạ theo Trường Cha)
                                                </label>
                                                {(() => {
                                                    const parentField = fields.find(f => f.fieldKey === form.dependsOnField);
                                                    
                                                    let parentOptions: string[] = [];
                                                    if (parentField && parentField.selectOptions) {
                                                        parentOptions = parentField.selectOptions;
                                                    } else if (parentField && typeof parentField.selectOptions === "string") {
                                                        try { parentOptions = JSON.parse(parentField.selectOptions); } catch {}
                                                    }

                                                    if (!form.dependsOnField) {
                                                        return <p className="text-sm text-slate-500 italic">Vui lòng chọn trường Cha trước.</p>;
                                                    }
                                                    if (parentOptions.length === 0) {
                                                        return <p className="text-sm text-slate-500 italic bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 p-3 rounded-lg">Trường Cha bạn chọn chưa có tuỳ chọn nào. Hãy sửa Trường Cha trước.</p>;
                                                    }

                                                    return (
                                                        <div className="space-y-3">
                                                            {parentOptions.map(opt => (
                                                                <div key={opt} className="bg-white/50 dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-xl p-3 shadow-sm">
                                                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex justify-between items-center">
                                                                        <span>Khi Cha là <strong className="text-indigo-600 dark:text-indigo-400 px-1">"{opt}"</strong></span>
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        value={form.conditionalOptionsMap[opt] || ""}
                                                                        onChange={e => setForm({
                                                                            ...form,
                                                                            conditionalOptionsMap: { ...form.conditionalOptionsMap, [opt]: e.target.value }
                                                                        })}
                                                                        placeholder={`vd: Tùy chọn 1, Tùy chọn 2`}
                                                                        className="w-full px-3 py-2 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-slate-800 dark:text-white text-sm"
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {form.fieldType === "Reference" && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Nguồn dữ liệu (Tham chiếu)
                                    </label>
                                    <select
                                        value={form.referenceSource || "Users"}
                                        onChange={e => setForm({ ...form, referenceSource: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-slate-800 dark:text-white"
                                    >
                                        <option value="Users">Danh sách Người Dùng</option>
                                        <option value="Roles">Danh sách Vai Trò (Roles)</option>
                                    </select>
                                    <p className="mt-1.5 text-[10px] text-slate-400 italic">Dữ liệu sẽ được tự động đổ về từ hệ thống thay vì phải nhập thủ công.</p>
                                </div>
                            )}

                            {form.fieldType === "Image" && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                            Thư mục lưu trữ đích (Upload Folder)
                                        </label>
                                        <div className="flex gap-2 relative">
                                            <input
                                                type="text"
                                                value={form.referenceSource || ""}
                                                onChange={e => setForm({ ...form, referenceSource: e.target.value })}
                                                placeholder="vd: /ProfileUploads/Certificates"
                                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-slate-800 dark:text-white"
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => setShowFolderModal(true)}
                                                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-300 rounded-xl font-semibold transition-colors whitespace-nowrap"
                                            >
                                                Chọn...
                                            </button>
                                        </div>
                                        <p className="mt-1.5 text-[10px] text-slate-400 italic">Hình ảnh người dùng tải lên sẽ được đưa vào thư mục này của hệ thống Quản Lý File.</p>
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/10">
                                        <input
                                            type="checkbox"
                                            checked={form.conditionalOptions?.multiple?.includes("true") ?? false}
                                            onChange={e => {
                                                setForm({
                                                    ...form,
                                                    conditionalOptions: e.target.checked ? { multiple: ["true"] } : null
                                                });
                                            }}
                                            className="w-4 h-4 rounded accent-indigo-600"
                                        />
                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Cho phép tải lên nhiều ảnh (Gallery)</span>
                                    </label>
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
                                <button type="button" onClick={() => { setIsModalOpen(false); setShowIconPicker(false); }} className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-300 rounded-xl font-semibold transition-colors">
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

            {/* FOLDER PICKER MODAL */}
            <ImagePickerDialog
                open={showFolderModal}
                onClose={() => setShowFolderModal(false)}
                onSelect={(url: string, path: string) => {
                    let finalPath = path.startsWith('/') ? path : `/${path}`;
                    if (finalPath === '/') finalPath = '';
                    setForm({...form, referenceSource: finalPath});
                }}
                mode="folder"
                title="Chọn Thư Mục Lưu Trữ"
            />

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
