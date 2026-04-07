"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { Save, User, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

interface ProfileField {
    fieldDefinitionId: string;
    label: string;
    fieldKey: string;
    fieldType: string;
    isRequired: boolean;
    displayOrder: number;
    selectOptions: string[] | null;
    placeholder: string | null;
    groupName: string | null;
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

export default function UserProfilePage() {
    const [profile, setProfile] = useState<UserProfileGroupedData | null>(null);
    const [values, setValues] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

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
            } catch {
                toast.error("Không thể tải hồ sơ người dùng.");
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const handleChange = (fieldId: string, val: string) => {
        setValues(prev => ({ ...prev, [fieldId]: val }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setSaved(false);
        try {
            const fields = Object.entries(values).map(([fieldDefinitionId, value]) => ({
                fieldDefinitionId,
                value: value || null
            }));
            await fetchApi("/UserProfile/me", {
                method: "PUT",
                body: JSON.stringify({ fields }),
            });
            toast.success("Đã lưu thông tin hồ sơ!");
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch {
            // toast shown globally
        } finally {
            setIsSaving(false);
        }
    };

    const renderField = (field: ProfileField) => {
        const baseClass = "w-full px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all dark:text-white";

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
            case "Select":
                return (
                    <select
                        value={values[field.fieldDefinitionId] ?? ""}
                        onChange={e => handleChange(field.fieldDefinitionId, e.target.value)}
                        required={field.isRequired}
                        className={baseClass}
                    >
                        <option value="">-- Chọn một giá trị --</option>
                        {field.selectOptions?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                );
            default: // Text
                return (
                    <input
                        type="text"
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
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                            {field.label}
                                            {field.isRequired && <span className="text-rose-500 ml-1">*</span>}
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
