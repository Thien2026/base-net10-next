"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { Save, User, CheckCircle } from "lucide-react";
import * as LucideIcons from "lucide-react";
import toast from "react-hot-toast";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import viLabels from "react-phone-number-input/locale/vi.json";
import { fileApi } from "@/lib/api/files";
import { UploadCloud, X as XIcon, Loader2 } from "lucide-react";
import { useRef } from "react";
import { useNavigationContext } from "@/contexts/NavigationContext";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

interface ProfileField {
    fieldDefinitionId: string;
    label: string;
    fieldKey: string;
    fieldType: string;
    isRequired: boolean;
    displayOrder: number;
    selectOptions: string[] | null;
    placeholder: string | null;
    icon: string | null;
    groupName: string | null;
    validationRegex: string | null;
    validationMessage: string | null;
    referenceSource: string | null;
    dependsOnField: string | null;
    conditionalOptions: Record<string, string[]> | null;
    value: string | null;
}

interface ProfileGroup {
    groupId: string | null;
    groupName: string;
    displayOrder: number;
    fields: ProfileField[];
}

interface UserProfileGroupedData {
    userId: string;
    userName: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
    groups: ProfileGroup[];
}

function ReferenceFieldInput({ field, value, onChange, className }: any) {
    const [options, setOptions] = useState<{id: string, label: string}[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Initial fetch and on search
    useEffect(() => {
        if (!field.referenceSource || (!isOpen && options.length > 0)) return;
        const timer = setTimeout(async () => {
            try {
                let endpoint = "";
                if (field.referenceSource === "Users") endpoint = `/User/lookup?q=${encodeURIComponent(searchTerm)}`;
                else if (field.referenceSource === "Roles") endpoint = `/User/roles/lookup?q=${encodeURIComponent(searchTerm)}`;
                else return;

                setLoading(true);
                const data: any = await fetchApi(endpoint);
                setOptions(data);
            } catch { }
            finally { setLoading(false); }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, field.referenceSource, isOpen]);

    // Find label for current value
    const selectedLabel = (options.find(o => o.id === value) || { label: value }).label;

    return (
        <div className="relative">
            <div 
                className={className + " flex items-center justify-between cursor-pointer"}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="truncate">
                    {value ? selectedLabel : (field.placeholder || "Mở danh sách để chọn...")}
                </div>
                <LucideIcons.ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute z-20 top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                        <div className="p-2 border-b border-slate-100 dark:border-white/10">
                            <input
                                autoFocus
                                type="text"
                                placeholder="Gõ để tìm kiếm..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-black/20 text-sm px-3 py-2 rounded-lg border-none focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                            />
                        </div>
                        <div className="max-h-48 overflow-y-auto p-1">
                            {loading ? (
                                <div className="text-center py-3 text-sm text-slate-400">Đang tìm...</div>
                            ) : options.length === 0 ? (
                                <div className="text-center py-3 text-sm text-slate-400">Không tìm thấy dữ liệu</div>
                            ) : (
                                options.map(o => (
                                    <div
                                        key={o.id}
                                        onClick={() => {
                                            onChange(o.id);
                                            setIsOpen(false);
                                            setSearchTerm("");
                                        }}
                                        className={`px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${value === o.id ? 'bg-indigo-50 text-indigo-700 font-semibold dark:bg-indigo-500/20 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                                    >
                                        {o.label}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function ImageProfileFieldInput({ field, value, onChange, className }: any) {
    const isMultiple = field.conditionalOptions?.multiple?.includes("true");
    const uploadPath = field.referenceSource || `/ProfileUploads/${field.fieldKey}`;
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const images = value ? value.split(',').filter(Boolean) : [];

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        try {
            setIsUploading(true);
            setProgress(0);

            const fileArray = Array.from(e.target.files);
            await fileApi.uploadFiles(uploadPath, fileArray, (p) => setProgress(p));

            const newPaths = fileArray.map(f => `${uploadPath}/${f.name}`);

            if (isMultiple) {
                const combined = [...images, ...newPaths];
                onChange(Array.from(new Set(combined)).join(','));
            } else {
                onChange(newPaths[0]);
            }
        } catch (err: any) {
            toast.error(err.message || "Tải ảnh thất bại");
        } finally {
            setIsUploading(false);
            setProgress(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeImage = (pathToRemove: string) => {
        const newImages = images.filter((p: string) => p !== pathToRemove);
        onChange(newImages.join(','));
    };

    return (
        <div className="space-y-3">
            {images.length > 0 && (
                <div className={`grid gap-3 ${isMultiple ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                    {images.map((img: string, idx: number) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 aspect-video flex items-center justify-center">
                            <img src={fileApi.getViewUrl(img)} alt="Uploaded" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={() => removeImage(img)}
                                    className="p-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-all"
                                >
                                    <XIcon size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {(!images.length || isMultiple) && (
                <div
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    className={`
                        w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors
                        ${isUploading ? 'border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-white/5 cursor-not-allowed' : 'border-indigo-300 dark:border-indigo-500/30 hover:border-indigo-500 dark:hover:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 cursor-pointer'}
                    `}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        multiple={isMultiple}
                        onChange={handleFileChange}
                    />

                    {isUploading ? (
                        <div className="flex flex-col items-center text-indigo-600 dark:text-indigo-400">
                            <Loader2 className="animate-spin mb-2" size={24} />
                            <span className="text-sm font-medium">Đang tải lên... {progress}%</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-slate-500 dark:text-slate-400">
                            <UploadCloud size={28} className="mb-2 text-indigo-500 dark:text-indigo-400" />
                            <span className="text-sm font-medium">Nhấn để tải {isMultiple ? 'ảnh' : '1 ảnh'} lên</span>
                            {field.referenceSource && (
                                <span className="text-[10px] mt-1 opacity-70">Lưu tại: {uploadPath}</span>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function UserProfilePage() {
    const [profile, setProfile] = useState<UserProfileGroupedData | null>(null);
    const [values, setValues] = useState<Record<string, string>>({});
    const [initialValues, setInitialValues] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const { setDirty } = useNavigationContext();
    useUnsavedChanges();

    useEffect(() => {
        setDirty(JSON.stringify(values) !== JSON.stringify(initialValues));
    }, [values, initialValues, setDirty]);

    useEffect(() => {
        const load = async () => {
            try {
                setIsLoading(true);
                const data = await fetchApi<UserProfileGroupedData>("/UserProfile/me/grouped");
                setProfile(data);

                // Pre-fill form with existing values from all fields in all groups
                const initial: Record<string, string> = {};
                data.groups.forEach(group => {
                    group.fields.forEach(f => {
                        initial[f.fieldDefinitionId] = f.value ?? "";
                    });
                });
                setValues(initial);
                setInitialValues(initial);
            } catch {
                toast.error("Không thể tải hồ sơ người dùng.");
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const handleChange = (fieldId: string, val: string) => {
        setValues(prev => {
            const nextVals = { ...prev, [fieldId]: val };
            
            // Tìm field hiện tại đang bị thay đổi
            const changedField = profile?.groups.flatMap(g => g.fields).find(f => f.fieldDefinitionId === fieldId);
            if (changedField) {
                // Đệ quy xóa trắng các field con phụ thuộc
                const clearChildren = (parentKey: string) => {
                    const children = profile?.groups.flatMap(g => g.fields).filter(f => f.dependsOnField === parentKey) || [];
                    for (const child of children) {
                        nextVals[child.fieldDefinitionId] = "";
                        clearChildren(child.fieldKey);
                    }
                };
                clearChildren(changedField.fieldKey);
            }
            
            return nextVals;
        });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setSaved(false);
        try {
            // Client-side regex validation
            for (const group of profile?.groups || []) {
                for (const field of group.fields) {
                    const val = values[field.fieldDefinitionId];
                    if (val && field.validationRegex) {
                        try {
                            const regex = new RegExp(field.validationRegex);
                            if (!regex.test(val)) {
                                toast.error(field.validationMessage || `Trường ${field.label} không hợp lệ.`);
                                setIsSaving(false);
                                return;
                            }
                        } catch (e) {
                            console.error("Invalid regex", field.validationRegex);
                        }
                    }
                }
            }

            const fields = Object.entries(values).map(([fieldDefinitionId, value]) => ({
                fieldDefinitionId,
                value: value || null
            }));
            await fetchApi("/UserProfile/me", {
                method: "PUT",
                body: JSON.stringify({ fields }),
            });
            toast.success("Đã lưu thông tin hồ sơ!");
            setInitialValues(values);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch {
            // toast shown globally
        } finally {
            setIsSaving(false);
        }
    };

    const renderField = (field: ProfileField) => {
        const baseClass = "w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-slate-800 dark:text-white";

        switch (field.fieldType) {
            case "Textarea":
                return (
                    <textarea
                        rows={3}
                        value={values[field.fieldDefinitionId] ?? ""}
                        onChange={e => handleChange(field.fieldDefinitionId, e.target.value)}
                        placeholder={field.placeholder ?? ""}
                        required={field.isRequired}
                        className={baseClass}
                    />
                );
            case "Number":
                return (
                    <input
                        type="number"
                        value={values[field.fieldDefinitionId] ?? ""}
                        onChange={e => handleChange(field.fieldDefinitionId, e.target.value)}
                        placeholder={field.placeholder ?? ""}
                        required={field.isRequired}
                        className={baseClass}
                    />
                );
            case "Date":
                return (
                    <input
                        type="date"
                        value={values[field.fieldDefinitionId] ?? ""}
                        onChange={e => handleChange(field.fieldDefinitionId, e.target.value)}
                        required={field.isRequired}
                        className={baseClass}
                    />
                );
            case "Boolean":
                return (
                    <div className="flex items-center gap-3 pt-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={values[field.fieldDefinitionId] === "true"}
                                onChange={e => handleChange(field.fieldDefinitionId, e.target.checked ? "true" : "false")}
                                className="w-5 h-5 rounded accent-indigo-600"
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-300">
                                {values[field.fieldDefinitionId] === "true" ? "Có" : "Không"}
                            </span>
                        </label>
                    </div>
                );
            case "Select": {
                let optionsToRender = field.selectOptions || [];
                let isDisabled = false;
                let parentValue = "";

                if (field.dependsOnField) {
                    // Trích xuất Field cha trong danh sách các Group
                    for (const group of (profile?.groups || [])) {
                        const parentField = group.fields.find(f => f.fieldKey === field.dependsOnField);
                        if (parentField) {
                            parentValue = values[parentField.fieldDefinitionId] || "";
                            break;
                        }
                    }

                    if (!parentValue) {
                        isDisabled = true;
                        optionsToRender = [];
                    } else if (field.conditionalOptions) {
                        const targetKey = Object.keys(field.conditionalOptions).find(
                            k => k.trim().toLowerCase() === parentValue.trim().toLowerCase()
                        );
                        optionsToRender = targetKey ? field.conditionalOptions[targetKey] : [];
                    }
                }

                return (
                    <div className="relative">
                        <select
                            value={values[field.fieldDefinitionId] ?? ""}
                            onChange={e => {
                                handleChange(field.fieldDefinitionId, e.target.value);
                            }}
                            required={field.isRequired}
                            disabled={isDisabled}
                            className={`${baseClass} ${isDisabled ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-white/5' : ''}`}
                        >
                        <option value="">-- Chọn một giá trị --</option>
                        {optionsToRender.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                        </select>
                    </div>
                );
            }
            case "Phone":
                return (
                    <PhoneInput
                        labels={viLabels}
                        defaultCountry="VN"
                        international
                        countryCallingCodeEditable={false}
                        value={values[field.fieldDefinitionId] ?? ""}
                        onChange={val => handleChange(field.fieldDefinitionId, val || "")}
                        placeholder={field.placeholder ?? "Cờ quốc gia và số điện thoại..."}
                        className={baseClass + " [&>input]:bg-transparent [&>input]:outline-none [&>input]:w-full [&>input]:text-slate-800 dark:[&>input]:text-white"}
                        required={field.isRequired}
                    />
                );
            case "Image":
                return (
                    <ImageProfileFieldInput
                        field={field}
                        value={values[field.fieldDefinitionId] ?? ""}
                        onChange={(val: string) => handleChange(field.fieldDefinitionId, val)}
                        className={baseClass}
                    />
                );
            case "Reference":
                return (
                    <ReferenceFieldInput
                        field={field}
                        value={values[field.fieldDefinitionId] ?? ""}
                        onChange={(val: string) => handleChange(field.fieldDefinitionId, val)}
                        className={baseClass}
                    />
                );
            default: // Text, Email
                return (
                    <input
                        type={field.fieldType === "Email" ? "email" : "text"}
                        value={values[field.fieldDefinitionId] ?? ""}
                        onChange={e => handleChange(field.fieldDefinitionId, e.target.value)}
                        placeholder={field.placeholder ?? ""}
                        required={field.isRequired}
                        className={baseClass}
                    />
                );
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-blue-400 dark:to-indigo-300">
                    Hồ Sơ Cá Nhân
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Quản lý thông tin cá nhân của bạn</p>
            </div>

            {/* Basic Info Card */}
            <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shrink-0">
                        {profile.avatarUrl ? (
                            <img
                                src={(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5290').replace('/api', '') + profile.avatarUrl}
                                alt="Avatar"
                                className="w-full h-full rounded-full object-cover"
                            />
                        ) : (
                            <span className="text-white text-xl font-bold">
                                {profile.fullName?.substring(0, 2).toUpperCase() || profile.userName?.substring(0, 2).toUpperCase() || "??"}
                            </span>
                        )}
                    </div>
                    <div>
                        <p className="text-xl font-bold text-slate-800 dark:text-white">{profile.fullName || profile.userName}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">@{profile.userName}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">{profile.email}</p>
                    </div>
                </div>
            </div>

            {/* Dynamic Groups & Fields */}
            {profile.groups.length === 0 ? (
                <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-12 text-center shadow-xl">
                    <User className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="font-medium text-slate-500 dark:text-slate-400">Chưa có trường thông tin nào được cấu hình.</p>
                </div>
            ) : (
                <form onSubmit={handleSave} className="space-y-6">
                    {profile.groups.map((group) => (
                        <div key={group.groupId || 'default'} className="bg-white/60 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-xl space-y-5 animate-in slide-in-from-bottom-2 duration-500">
                            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-2 mb-4">
                                <h2 className="text-lg font-bold text-slate-800 dark:text-white capitalize">
                                    {group.groupName}
                                </h2>
                                <div className="h-1 w-1 rounded-full bg-indigo-500" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {group.fields.map(field => (
                                    <div key={field.fieldDefinitionId} className={field.fieldType === "Textarea" || field.fieldType === "Boolean" ? "sm:col-span-2" : ""}>
                                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                            {(() => {
                                                const IconComponent = field.icon ? (LucideIcons as any)[field.icon] : null;
                                                return IconComponent ? <IconComponent className="w-4 h-4 text-slate-400" /> : null;
                                            })()}
                                            <span>
                                                {field.label}
                                                {field.isRequired && <span className="text-rose-500 ml-1">*</span>}
                                            </span>
                                        </label>
                                        {renderField(field)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl shadow-lg shadow-indigo-500/25 font-semibold transition-all disabled:opacity-70"
                        >
                            {isSaving
                                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                : <Save size={18} />}
                            Lưu thông tin
                        </button>
                        {saved && (
                            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-sm font-medium animate-pulse">
                                <CheckCircle size={16} />
                                Đã lưu thành công!
                            </span>
                        )}
                    </div>
                </form>
            )}
        </div>
    );
}
