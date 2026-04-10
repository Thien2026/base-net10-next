"use client";

import React, { useEffect, useState } from "react";
import { settingsApi, SystemSettings } from "@/lib/settingsApi";
import toast from "react-hot-toast";
import { Loader2, Save, Image as ImageIcon, Plus, Trash2, MapPin, Phone, Mail, Link as LinkIcon } from "lucide-react";
import { ImagePickerDialog } from "@/components/files/ImagePickerDialog";
import { fileApi } from "@/lib/api/files";
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

export default function SettingsPage() {
    const [settings, setSettings] = useState<SystemSettings>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pickerOpen, setPickerOpen] = useState(false);

    // Dynamically retrieve all supported IANA timezones
    const timeZones = React.useMemo(() => {
        try {
            return typeof (Intl as any).supportedValuesOf === 'function'
                ? (Intl as any).supportedValuesOf('timeZone')
                : ["UTC", "Asia/Ho_Chi_Minh", "Asia/Bangkok", "America/New_York", "Europe/London"];
        } catch {
            return ["UTC", "Asia/Ho_Chi_Minh"];
        }
    }, []);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const data = await settingsApi.getSettings();
            setSettings(data);
        } catch (error) {
            toast.error("Lỗi: Không thể tải cài đặt.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleArrayAdd = (key: keyof SystemSettings, defaultItem: any) => {
        setSettings(prev => ({
            ...prev,
            [key]: [...((prev[key] as any[]) || []), defaultItem]
        }));
    };

    const handleArrayRemove = (key: keyof SystemSettings, index: number) => {
        setSettings(prev => {
            const arr = [...((prev[key] as any[]) || [])];
            arr.splice(index, 1);
            return { ...prev, [key]: arr };
        });
    };

    const handleArrayChange = (key: keyof SystemSettings, index: number, field: string, value: any) => {
        setSettings(prev => {
            const arr = [...((prev[key] as any[]) || [])];
            arr[index] = { ...arr[index], [field]: value };
            return { ...prev, [key]: arr };
        });
    };

    const handleImageSelect = (url: string, path: string) => {
        setSettings(prev => ({
            ...prev,
            SiteLogo: path
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Phones Validation
        if (settings.Phones && settings.Phones.length > 0) {
            for (let i = 0; i < settings.Phones.length; i++) {
                const num = settings.Phones[i].number;
                if (!num || !isValidPhoneNumber(num)) {
                    toast.error(`Số điện thoại thứ ${i + 1} không hợp lệ! Vui lòng kiểm tra lại.`);
                    return;
                }
            }
        }

        // Emails Validation
        if (settings.Emails && settings.Emails.length > 0) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            for (let i = 0; i < settings.Emails.length; i++) {
                const email = settings.Emails[i].email;
                if (!email || !emailRegex.test(email)) {
                    toast.error(`Email liên hệ thứ ${i + 1} không đúng định dạng!`);
                    return;
                }
            }
        }

        try {
            setSaving(true);
            await settingsApi.updateSettings(settings);
            toast.success("Đã cài đặt thành công!");
        } catch (error) {
            toast.error("Lỗi: Đã xảy ra lỗi khi lưu cài đặt.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-48">
                <Loader2 className="animate-spin h-8 w-8 text-gray-400" />
            </div>
        );
    }

    const baseInputClass = "px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all dark:text-white";
    const labelClass = "block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5";
    const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5290').replace('/api', '');

    return (
        <div className="max-w-4xl mx-auto space-y-6 p-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-blue-400 dark:to-indigo-300">
                        Cài Đặt Chung
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Quản lý các cấu hình chung của toàn hệ thống.</p>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="flex flex-shrink-0 items-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/25 font-semibold transition-all disabled:opacity-70"
                >
                    {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                    <span>Lưu Thay Đổi</span>
                </button>
            </div>

            <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-2 duration-500">
                <div className="p-6 sm:p-8 space-y-10">

                    {/* Nhận Diện Thương Hiệu */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-2">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Nhận Diện Thương Hiệu</h2>
                            <div className="h-1 w-1 rounded-full bg-indigo-500" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className={labelClass}>Tiêu Đề Trang Web</label>
                                <input
                                    type="text"
                                    name="SiteTitle"
                                    value={settings.SiteTitle || ''}
                                    onChange={handleChange}
                                    className={`${baseInputClass} w-full`}
                                    placeholder="Tên website..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className={labelClass}>Múi Giờ</label>
                                <select
                                    name="TimeZone"
                                    value={settings.TimeZone || ''}
                                    onChange={handleChange}
                                    className={`${baseInputClass} w-full`}
                                >
                                    <option value="">Mặc định (UTC)</option>
                                    {timeZones.map((tz: string) => (
                                        <option key={tz} value={tz}>
                                            {tz}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-span-full space-y-2">
                                <label className={labelClass}>Mô Tả Trang Web</label>
                                <textarea
                                    name="SiteDescription"
                                    value={settings.SiteDescription || ''}
                                    onChange={handleChange}
                                    rows={3}
                                    className={`${baseInputClass} w-full`}
                                    placeholder="Mô tả về website, dùng cho SEO..."
                                />
                            </div>

                            <div className="col-span-full space-y-2">
                                <label className={labelClass}>Ảnh Đại Diện / Logo</label>
                                <div className="flex gap-4 items-center">
                                    <input
                                        type="text"
                                        name="SiteLogo"
                                        value={settings.SiteLogo || ''}
                                        onChange={handleChange}
                                        className={`${baseInputClass} flex-1 min-w-0`}
                                        placeholder="/uploads/..."
                                        readOnly
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setPickerOpen(true)}
                                        className="flex items-center gap-2 px-4 py-2.5 whitespace-nowrap bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 dark:hover:bg-indigo-900/60 rounded-xl font-medium transition-colors"
                                    >
                                        <ImageIcon size={18} />
                                        Chọn ảnh
                                    </button>
                                    {settings.SiteLogo && (
                                        <div className="h-11 w-11 shrink-0 rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 bg-white">
                                            <img
                                                src={settings.SiteLogo.startsWith('http') ? settings.SiteLogo : fileApi.getViewUrl(settings.SiteLogo)}
                                                alt="Logo Preview"
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Điện Thoại */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2">
                            <div className="flex items-center gap-2">
                                <Phone size={18} className="text-indigo-500" />
                                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Số Điện Thoại</h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleArrayAdd('Phones', { countryCode: 'VN', number: '' })}
                                className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium"
                            >
                                <Plus size={16} /> Thêm số
                            </button>
                        </div>

                        <div className="space-y-3">
                            {(!settings.Phones || settings.Phones.length === 0) && (
                                <p className="text-sm text-gray-400 italic">Chưa có số điện thoại nào.</p>
                            )}
                            {settings.Phones?.map((phone, idx) => (
                                <div key={idx} className="flex gap-3 items-center">
                                    <PhoneInput
                                        international
                                        defaultCountry="VN"
                                        className={`${baseInputClass} flex-1 !flex items-center [&_.PhoneInputInput]:border-none [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:outline-none [&_.PhoneInputInput]:w-full`}
                                        placeholder="Nhập số điện thoại..."
                                        value={phone.number}
                                        onChange={(val) => handleArrayChange('Phones', idx, 'number', val || '')}
                                    />
                                    <button type="button" onClick={() => handleArrayRemove('Phones', idx)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition shrink-0">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2">
                            <div className="flex items-center gap-2">
                                <Mail size={18} className="text-indigo-500" />
                                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Email Liên Hệ</h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleArrayAdd('Emails', { condition: 'Hỗ trợ', email: '' })}
                                className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium"
                            >
                                <Plus size={16} /> Thêm Email
                            </button>
                        </div>

                        <div className="space-y-3">
                            {(!settings.Emails || settings.Emails.length === 0) && (
                                <p className="text-sm text-gray-400 italic">Chưa có địa chỉ email nào.</p>
                            )}
                            {settings.Emails?.map((item, idx) => (
                                <div key={idx} className="flex gap-3 items-center bg-slate-50 dark:bg-white/5 p-2 rounded-xl">
                                    <input
                                        className={`${baseInputClass} flex-1 min-w-0 bg-white dark:bg-black/40`}
                                        placeholder="Chức năng (VD: Hỗ trợ)"
                                        value={item.condition}
                                        onChange={(e) => handleArrayChange('Emails', idx, 'condition', e.target.value)}
                                    />
                                    <input
                                        className={`${baseInputClass} flex-[2] min-w-0 bg-white dark:bg-black/40`}
                                        placeholder="Email đầy đủ (abc@gmail.com)"
                                        type="email"
                                        value={item.email}
                                        onChange={(e) => handleArrayChange('Emails', idx, 'email', e.target.value)}
                                    />
                                    <button type="button" onClick={() => handleArrayRemove('Emails', idx)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition shrink-0 bg-white dark:bg-black/40 shadow-sm border border-slate-200 dark:border-white/10">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Địa chỉ */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2">
                            <div className="flex items-center gap-2">
                                <MapPin size={18} className="text-indigo-500" />
                                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Địa Chỉ</h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleArrayAdd('Addresses', { address: '', isPrimary: false })}
                                className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium"
                            >
                                <Plus size={16} /> Thêm địa chỉ
                            </button>
                        </div>

                        <div className="space-y-3">
                            {(!settings.Addresses || settings.Addresses.length === 0) && (
                                <p className="text-sm text-gray-400 italic">Chưa có địa chỉ nào.</p>
                            )}
                            {settings.Addresses?.map((item, idx) => (
                                <div key={idx} className="flex gap-3 items-start sm:items-center flex-col sm:flex-row">
                                    <input
                                        className={`${baseInputClass} flex-1 w-full min-w-0`}
                                        placeholder="Nhập địa chỉ đầy đủ..."
                                        value={item.address}
                                        onChange={(e) => handleArrayChange('Addresses', idx, 'address', e.target.value)}
                                    />
                                    <label className="flex items-center shrink-0 gap-2 text-sm text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap pl-1">
                                        <input
                                            type="checkbox"
                                            checked={item.isPrimary}
                                            onChange={(e) => handleArrayChange('Addresses', idx, 'isPrimary', e.target.checked)}
                                            className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                        />
                                        Trụ sở chính
                                    </label>
                                    <button type="button" onClick={() => handleArrayRemove('Addresses', idx)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition self-end sm:self-auto shrink-0">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Mạng Xã Hội */}
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2">
                            <div className="flex items-center gap-2">
                                <LinkIcon size={18} className="text-indigo-500" />
                                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Mạng Xã Hội</h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleArrayAdd('SocialLinks', { platform: 'Facebook', url: '' })}
                                className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium"
                            >
                                <Plus size={16} /> Thêm liên kết
                            </button>
                        </div>

                        <div className="space-y-3">
                            {(!settings.SocialLinks || settings.SocialLinks.length === 0) && (
                                <p className="text-sm text-gray-400 italic">Chưa có liên kết mạng xã hội.</p>
                            )}
                            {settings.SocialLinks?.map((item, idx) => (
                                <div key={idx} className="flex gap-3 items-center">
                                    <select
                                        className={`${baseInputClass} flex-1 min-w-0 max-w-[150px]`}
                                        value={item.platform}
                                        onChange={(e) => handleArrayChange('SocialLinks', idx, 'platform', e.target.value)}
                                    >
                                        <option value="Facebook">Facebook</option>
                                        <option value="Zalo">Zalo</option>
                                        <option value="TikTok">TikTok</option>
                                        <option value="YouTube">YouTube</option>
                                        <option value="Instagram">Instagram</option>
                                        <option value="LinkedIn">LinkedIn</option>
                                        <option value="Twitter">Twitter (X)</option>
                                    </select>
                                    <input
                                        className={`${baseInputClass} flex-[2] min-w-0`}
                                        placeholder="https://..."
                                        value={item.url}
                                        onChange={(e) => handleArrayChange('SocialLinks', idx, 'url', e.target.value)}
                                    />
                                    <button type="button" onClick={() => handleArrayRemove('SocialLinks', idx)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition shrink-0">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>

            <ImagePickerDialog
                open={pickerOpen}
                onClose={() => setPickerOpen(false)}
                onSelect={handleImageSelect}
            />
        </div>
    );
}
