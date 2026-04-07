"use client";

import React, { useState, useEffect } from 'react';
import { auditLogApi, AuditLog } from '@/lib/api/auditLogs';
import { Loader2, AlertCircle, FileText, Upload, FolderPlus, Edit2, Trash2, Folder, CornerUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const ACTION_ICONS: Record<string, React.ReactNode> = {
    upload: <Upload size={16} className="text-blue-500" />,
    create_folder: <FolderPlus size={16} className="text-green-500" />,
    rename: <Edit2 size={16} className="text-yellow-500" />,
    delete: <Trash2 size={16} className="text-red-500" />,
    move: <CornerUpRight size={16} className="text-purple-500" />
};

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [pageNumber, setPageNumber] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [userIdFilter, setUserIdFilter] = useState('');
    const [actionFilter, setActionFilter] = useState('');

    const fetchLogs = async (page: number, userId: string = '', action: string = '') => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await auditLogApi.getLogs(page, 20, userId || undefined, action || undefined);
            setLogs(res.data);
            setTotalPages(res.totalPages);
            setTotalRecords(res.totalRecords);
            setPageNumber(page);
        } catch (e: any) {
            setError(e.message || "Lỗi tải nhật ký hệ thống");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(pageNumber, userIdFilter, actionFilter);
    }, [pageNumber, userIdFilter, actionFilter]);

    const handleFilterChange = (type: 'user' | 'action', value: string) => {
        if (type === 'user') setUserIdFilter(value);
        if (type === 'action') setActionFilter(value);
        setPageNumber(1);
    };

    return (
        <div className="w-full h-full flex flex-col bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
            {/* Header & Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-blue-400 dark:to-indigo-300">
                        Nhật Ký Hệ Thống
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Tổng cộng: {totalRecords} lượt thao tác
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={actionFilter}
                        onChange={(e) => handleFilterChange('action', e.target.value)}
                        className="px-4 py-2 text-sm border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-black/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-200 font-medium transition-all"
                    >
                        <option value="">Tất cả thao tác</option>
                        <option value="upload">Mới Tải Lên</option>
                        <option value="create_folder">Tạo Thư Mục</option>
                        <option value="rename">Đổi Tên</option>
                        <option value="delete">Xóa</option>
                        <option value="move">Di Chuyển</option>
                    </select>

                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Lọc theo User ID..."
                            value={userIdFilter}
                            onChange={(e) => handleFilterChange('user', e.target.value)}
                            className="pl-4 pr-4 py-2 text-sm border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-black/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 w-48 font-medium transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-xl dark:shadow-2xl flex-1 flex flex-col">
                {isLoading && logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                        <Loader2 size={32} className="animate-spin" />
                        <span className="text-sm">Đang tải nhật ký...</span>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-red-400">
                        <AlertCircle size={32} />
                        <span className="text-sm">{error}</span>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                        <FileText size={40} className="opacity-40" />
                        <span className="text-sm">Chưa có nhật ký nào</span>
                    </div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400 sticky top-0">
                            <tr>
                                <th className="px-4 py-3 font-medium">Thời Gian</th>
                                <th className="px-4 py-3 font-medium">Người Dùng</th>
                                <th className="px-4 py-3 font-medium">Thao Tác</th>
                                <th className="px-4 py-3 font-medium">Đối Tượng</th>
                                <th className="px-4 py-3 font-medium">IP Address</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id} className="border-b dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition">
                                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-800 dark:text-gray-200">{log.userName || "N/A"}</div>
                                        <div className="text-xs text-gray-400">{log.userId}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            {ACTION_ICONS[log.action] || <FileText size={16} className="text-gray-500" />}
                                            <span className="capitalize font-medium text-gray-700 dark:text-gray-300">
                                                {log.action}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-gray-800 dark:text-gray-200 break-all max-w-sm truncate" title={log.target}>
                                            {log.target}
                                        </div>
                                        {log.detail && <div className="text-xs text-gray-500 truncate mt-0.5" title={log.detail}>{log.detail}</div>}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                                        {log.ipAddress}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination Controls */}
            {!isLoading && totalPages > 1 && (
                <div className="border-t border-slate-200 dark:border-white/10 px-6 py-4 flex items-center justify-between bg-slate-50/50 dark:bg-black/10">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        Trang <span className="font-bold text-indigo-600 dark:text-indigo-400">{pageNumber}</span> trên <span className="font-bold text-slate-700 dark:text-slate-300">{totalPages}</span>
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPageNumber(p => p - 1)}
                            disabled={pageNumber === 1 || isLoading}
                            className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-sm"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            onClick={() => setPageNumber(p => p + 1)}
                            disabled={pageNumber === totalPages || isLoading}
                            className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-sm"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
