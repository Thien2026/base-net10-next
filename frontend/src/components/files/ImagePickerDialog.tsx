'use client';

/**
 * ImagePickerDialog — Reusable image picker from file storage.
 *
 * Usage:
 *   const [pickerOpen, setPickerOpen] = useState(false);
 *
 *   <ImagePickerDialog
 *     open={pickerOpen}
 *     onClose={() => setPickerOpen(false)}
 *     onSelect={(url) => setImageUrl(url)}
 *   />
 *
 * Props:
 *   open       — whether the dialog is shown
 *   onClose    — called when the dialog is dismissed
 *   onSelect   — called with the full view URL of the selected image
 *   title?     — optional custom dialog title (default: "Chọn Ảnh")
 *   accept?    — file extensions to show (default: image extensions)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { fileApi, FileItem, PagedResponse } from '@/lib/api/files';
import { Folder, ChevronRight, X, Search, Check, ImageIcon, Loader2, AlertCircle } from 'lucide-react';

const DEFAULT_IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'avif', 'bmp'];

interface ImagePickerDialogProps {
    open: boolean;
    onClose: () => void;
    onSelect: (url: string, path: string) => void;
    title?: string;
    accept?: string[];
}

export function ImagePickerDialog({
    open,
    onClose,
    onSelect,
    title = 'Chọn Ảnh',
    accept = DEFAULT_IMAGE_EXTS,
}: ImagePickerDialogProps) {
    const [currentPath, setCurrentPath] = useState('');
    const [items, setItems] = useState<FileItem[]>([]);
    const [pageNumber, setPageNumber] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<FileItem | null>(null);
    const [search, setSearch] = useState('');

    const breadcrumbParts = currentPath ? currentPath.split('/') : [];

    const fetchItems = useCallback(async (path: string, page: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const res: PagedResponse<FileItem[]> = await fileApi.getItems(path, page, 60);
            setItems(res.data);
            setTotalPages(res.totalPages);
        } catch (e: any) {
            setError(e.message || 'Không thể tải danh sách file');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Reset & fetch when dialog opens or path/page changes
    useEffect(() => {
        if (!open) return;
        fetchItems(currentPath, pageNumber);
    }, [open, currentPath, pageNumber, fetchItems]);

    // Reset state on open
    useEffect(() => {
        if (open) {
            setCurrentPath('');
            setPageNumber(1);
            setSelected(null);
            setSearch('');
        }
    }, [open]);

    if (!open) return null;

    const navigate = (path: string) => {
        setCurrentPath(path);
        setPageNumber(1);
        setSelected(null);
        setSearch('');
    };

    const breadcrumbClick = (idx: number) => {
        navigate(breadcrumbParts.slice(0, idx + 1).join('/'));
    };

    const isImage = (item: FileItem) => {
        const ext = item.name.split('.').pop()?.toLowerCase() || '';
        return accept.includes(ext);
    };

    // Visible items: folders first, then filtered images
    const visibleItems = items
        .filter(item => item.isDirectory || isImage(item))
        .filter(item => item.isDirectory || !search || item.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;
            return a.name.localeCompare(b.name);
        });

    const handleConfirm = () => {
        if (!selected) return;
        onSelect(fileApi.getViewUrl(selected.path), selected.path);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center" onClick={onClose}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            <div
                className="relative z-10 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col w-[90vw] max-w-4xl h-[80vh] overflow-hidden border dark:border-gray-800"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b dark:border-gray-800 shrink-0 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-2">
                        <ImageIcon size={20} className="text-blue-500" />
                        <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">{title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Toolbar: path bar + search */}
                <div className="flex items-center gap-2 px-4 py-2 border-b dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 shrink-0 flex-wrap">
                    {/* Mini breadcrumb path bar */}
                    <div className="flex items-center gap-0.5 flex-1 min-w-0 overflow-x-auto scrollbar-none whitespace-nowrap">
                        <button
                            onClick={() => navigate('')}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition shrink-0 ${currentPath === '' ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-500 hover:bg-gray-200/70 dark:text-gray-400 dark:hover:bg-gray-700/60'
                                }`}
                        >
                            <Folder size={12} className="text-yellow-500" />
                            Root
                        </button>
                        {breadcrumbParts.map((part, idx) => (
                            <React.Fragment key={idx}>
                                <ChevronRight size={10} className="text-gray-400 shrink-0" />
                                <button
                                    onClick={() => breadcrumbClick(idx)}
                                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition shrink-0 ${idx === breadcrumbParts.length - 1 ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-500 hover:bg-gray-200/70 dark:text-gray-400 dark:hover:bg-gray-700/60'
                                        }`}
                                >
                                    <Folder size={12} className="text-yellow-400" />
                                    {part}
                                </button>
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative shrink-0">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Tìm tên ảnh..."
                            className="pl-8 pr-3 py-1 text-sm border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-gray-200 placeholder:text-gray-400 w-40"
                        />
                    </div>
                </div>

                {/* Content: Grid */}
                <div className="flex-1 overflow-y-auto p-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                            <Loader2 size={32} className="animate-spin" />
                            <span className="text-sm">Đang tải...</span>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-red-400">
                            <AlertCircle size={32} />
                            <span className="text-sm">{error}</span>
                        </div>
                    ) : visibleItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                            <ImageIcon size={40} className="opacity-40" />
                            <span className="text-sm">Không có ảnh trong thư mục này</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-3">
                            {visibleItems.map(item => (
                                <div
                                    key={item.path}
                                    onClick={() => item.isDirectory ? navigate(item.path) : setSelected(item)}
                                    onDoubleClick={() => {
                                        if (!item.isDirectory) {
                                            onSelect(fileApi.getViewUrl(item.path), item.path);
                                            onClose();
                                        }
                                    }}
                                    className={`relative group flex flex-col items-center rounded-xl border cursor-pointer transition-all hover:shadow-md select-none overflow-hidden
                                        ${selected?.path === item.path
                                            ? 'border-blue-500 ring-2 ring-blue-400/40 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'}
                                    `}
                                >
                                    {/* Thumbnail */}
                                    <div className="w-full h-24 bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                                        {item.isDirectory ? (
                                            <Folder size={40} className="text-yellow-400" fill="currentColor" />
                                        ) : (
                                            <img
                                                src={fileApi.getViewUrl(item.path)}
                                                alt={item.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                loading="lazy"
                                            />
                                        )}
                                    </div>

                                    {/* Name */}
                                    <div className="px-2 py-1.5 w-full text-center">
                                        <p className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate" title={item.name}>
                                            {item.name}
                                        </p>
                                    </div>

                                    {/* Selected checkmark overlay */}
                                    {selected?.path === item.path && (
                                        <div className="absolute top-1.5 right-1.5 bg-blue-500 rounded-full p-0.5">
                                            <Check size={11} strokeWidth={3} className="text-white" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination (inside content area) */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 py-3 border-t dark:border-gray-800 shrink-0 bg-gray-50/50 dark:bg-gray-800/20">
                        <button
                            disabled={pageNumber === 1}
                            onClick={() => setPageNumber(p => p - 1)}
                            className="px-3 py-1 text-xs bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition text-gray-700 dark:text-gray-200"
                        >
                            Trang trước
                        </button>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{pageNumber} / {totalPages}</span>
                        <button
                            disabled={pageNumber === totalPages}
                            onClick={() => setPageNumber(p => p + 1)}
                            className="px-3 py-1 text-xs bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition text-gray-700 dark:text-gray-200"
                        >
                            Trang tiếp
                        </button>
                    </div>
                )}

                {/* Footer: selected preview + actions */}
                <div className="flex items-center justify-between gap-4 px-5 py-3 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        {selected ? (
                            <>
                                <img
                                    src={fileApi.getViewUrl(selected.path)}
                                    alt={selected.name}
                                    className="w-10 h-10 rounded-lg object-cover border dark:border-gray-700 shrink-0"
                                />
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{selected.name}</p>
                                    <p className="text-xs text-gray-400">{(selected.size / 1024).toFixed(1)} KB</p>
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-gray-400 italic">Chưa chọn ảnh nào — double-click để chọn nhanh</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                        >
                            Hủy
                        </button>
                        <button
                            disabled={!selected}
                            onClick={handleConfirm}
                            className="px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Chọn Ảnh
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
