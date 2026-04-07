"use client";

import React, { useState, useEffect, useRef } from 'react';
import { fileApi, FileItem, StorageStats } from '@/lib/api/files';
import { FolderTree } from '@/components/files/FolderTree';
import { FileBrowser } from '@/components/files/FileBrowser';
import {
    Upload, FolderPlus, DownloadCloud, Trash2,
    CornerUpRight, RefreshCcw, Home, ChevronRight, X, FileText,
    Eye, Download, Edit2, Folder
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function FileManagementPage() {
    const [currentPath, setCurrentPath] = useState<string>('');
    const [tree, setTree] = useState<FileItem | null>(null);
    const [items, setItems] = useState<FileItem[]>([]);

    // Pagination states
    const [pageNumber, setPageNumber] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [stats, setStats] = useState<StorageStats | null>(null);

    // Dialog states
    const [dialog, setDialog] = useState<{ type: 'rename' | 'createFolder' | 'move' | null, item?: FileItem }>({ type: null });
    const [dialogInput, setDialogInput] = useState('');
    const [moveDestination, setMoveDestination] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const singleFileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);
    const pathInputRef = useRef<HTMLInputElement>(null);

    // Path bar editing (Finder-style)
    const [isPathEditing, setIsPathEditing] = useState(false);
    const [pathInputValue, setPathInputValue] = useState('');

    const fetchTree = async () => {
        try {
            const data = await fileApi.getFolderTree();
            setTree(data);
        } catch (e) { }
    };

    const fetchStats = async () => {
        try {
            const data = await fileApi.getStats();
            setStats(data);
        } catch (e) { }
    };

    const fetchItems = async (path: string, page: number = 1) => {
        setIsLoading(true);
        try {
            const result = await fileApi.getItems(path, page, 50);
            setItems(result.data);
            setTotalPages(result.totalPages);
            setPageNumber(page);
            setSelectedPaths(new Set()); // Reset selection when fetching new items
        } catch (e) {
        } finally {
            setIsLoading(false);
        }
    };

    // Keep tree and stats loaded globally
    useEffect(() => {
        fetchTree();
        fetchStats();
    }, []);

    // Reload files whenever path or pageNumber changes
    useEffect(() => {
        fetchItems(currentPath, pageNumber);
    }, [currentPath, pageNumber]);

    const handleNavigate = (path: string) => {
        setCurrentPath(path);
        setPageNumber(1); // Reset page to 1 on folder navigation
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        try {
            setUploadProgress(0);
            await fileApi.uploadFiles(currentPath, Array.from(e.target.files), (p: number) => setUploadProgress(p));
            toast.success("Tải lên thành công");
            fetchItems(currentPath, pageNumber);
            fetchTree();
            fetchStats();
        } catch (err: any) {
            toast.error(err.message || "Tải lên thất bại");
        } finally {
            setUploadProgress(null);
            if (singleFileInputRef.current) singleFileInputRef.current.value = '';
            if (folderInputRef.current) folderInputRef.current.value = '';
        }
    };

    const handleMultiDelete = async (forcePaths?: string[]) => {
        const targets = forcePaths || Array.from(selectedPaths);
        if (targets.length === 0) return;
        if (!confirm(`Bạn có chắc muốn xóa ${targets.length} mục này?`)) return;

        try {
            await fileApi.deleteItems(targets);
            toast.success("Đã xóa thành công");
            setSelectedPaths(new Set());
            // Move back to page 1 to be safe, or stay on current page
            fetchItems(currentPath, 1);
            fetchTree();
            fetchStats();
        } catch (e: any) {
            toast.error(e.message || "Xóa thất bại");
        }
    };

    const handleMultiDownload = async () => {
        if (selectedPaths.size === 0) return;
        try {
            await fileApi.downloadZip(Array.from(selectedPaths));
        } catch (e) {
            toast.error("Tải xuống thất bại");
        }
    };

    const submitDialog = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            if (dialog.type === 'createFolder') {
                if (!dialogInput.trim()) return;
                await fileApi.createFolder(currentPath, dialogInput);
                toast.success("Đã tạo thư mục");
            }
            else if (dialog.type === 'rename') {
                if (!dialogInput.trim() || !dialog.item) return;

                let finalName = dialogInput.trim();
                if (!dialog.item.isDirectory && dialog.item.extension && finalName.lastIndexOf('.') === -1) {
                    finalName += dialog.item.extension;
                }

                await fileApi.renameItem(dialog.item.path, finalName);
                toast.success("Đã đổi tên");
            }
            else if (dialog.type === 'move') {
                const paths = dialog.item ? [dialog.item.path] : Array.from(selectedPaths);
                await fileApi.moveItems(paths, moveDestination);
                toast.success("Đã di chuyển");
            }

            setDialog({ type: null });
            fetchItems(currentPath, pageNumber);
            fetchTree();
            fetchStats();
        } catch (e: any) {
            toast.error(e.message || "Thao tác thất bại");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Render Breadcrumb
    const breadcrumbParts = currentPath ? currentPath.split('/') : [];
    const breadcrumbClick = (index: number) => {
        const path = index === -1 ? '' : breadcrumbParts.slice(0, index + 1).join('/');
        handleNavigate(path);
    };

    const selectedItem = selectedPaths.size === 1
        ? items.find(i => selectedPaths.has(i.path) && !i.isDirectory)
        : null;

    return (
        <div className="h-[calc(100vh-80px)] w-full flex flex-col bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
            <div className="h-14 border-b dark:border-gray-800 flex items-center justify-between px-4 bg-gray-50 dark:bg-gray-800/50 gap-2">
                {/* Stats on the left */}
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    {stats && (
                        <span>
                            Dung lượng: <strong className="text-gray-700 dark:text-gray-200">{stats.totalSizeFormatted}</strong>
                            <span className="mx-2 text-gray-300 dark:text-gray-600">|</span>
                            {stats.totalFiles} file, {stats.totalFolders} thư mục
                        </span>
                    )}
                </div>

                {/* Toolbar items on the right */}
                <div className="flex items-center gap-2">
                    {/* Hidden file inputs */}
                    <div className="hidden">
                        <input type="file" ref={singleFileInputRef} multiple onChange={handleUpload} />
                        <input type="file" ref={folderInputRef} {...{ webkitdirectory: "true", directory: "" }} onChange={handleUpload as any} />
                    </div>

                    <button onClick={() => singleFileInputRef.current?.click()} className="flex border border-gray-300 dark:border-gray-600 items-center px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-200">
                        <Upload size={16} className="mr-2" /> Tải File
                    </button>
                    <button onClick={() => folderInputRef.current?.click()} className="flex border border-gray-300 dark:border-gray-600 items-center px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-200">
                        <FolderPlus size={16} className="mr-2" /> Tải Thư Mục
                    </button>
                    <button onClick={() => { setDialog({ type: 'createFolder' }); setDialogInput(''); }} className="flex border border-transparent bg-blue-600 text-white items-center px-3 py-1.5 text-sm font-medium rounded-lg hover:bg-blue-700 transition shadow-sm">
                        <FolderPlus size={16} className="mr-2" /> Thư Mục Mới
                    </button>
                    <button onClick={() => fetchItems(currentPath, pageNumber)} className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition">
                        <RefreshCcw size={18} />
                    </button>
                </div>
            </div>

            {/* Multi-Select Toolbar */}
            {selectedPaths.size > 0 && (
                <div className="h-12 bg-blue-50 dark:bg-blue-900/30 px-4 flex items-center justify-between border-b border-blue-100 dark:border-blue-900/50">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        {selectedPaths.size} mục đã chọn
                    </span>
                    <div className="flex space-x-2">
                        <button onClick={handleMultiDownload} className="flex items-center px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">
                            <DownloadCloud size={14} className="mr-2" /> Tải Zip
                        </button>
                        <button onClick={() => setDialog({ type: 'move' })} className="flex items-center px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200">
                            <CornerUpRight size={14} className="mr-2" /> Di Chuyển
                        </button>
                        <button onClick={() => handleMultiDelete()} className="flex items-center px-3 py-1 text-sm bg-red-50 text-red-600 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50 rounded shadow-sm hover:bg-red-100 dark:hover:bg-red-900/50">
                            <Trash2 size={14} className="mr-2" /> Xóa
                        </button>
                    </div>
                </div>
            )}

            {uploadProgress !== null && (
                <div className="h-1 bg-gray-200">
                    <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                </div>
            )}

            {/* Path Bar - macOS Finder style: click to edit */}
            <div
                className="bg-gray-50/50 dark:bg-gray-800/20 border-b dark:border-gray-800 px-3 py-1 flex items-center gap-1 overflow-x-auto scrollbar-none whitespace-nowrap h-9 cursor-text"
                onClick={() => {
                    if (!isPathEditing) {
                        setPathInputValue(currentPath);
                        setIsPathEditing(true);
                        setTimeout(() => pathInputRef.current?.select(), 0);
                    }
                }}
            >
                {isPathEditing ? (
                    <input
                        ref={pathInputRef}
                        autoFocus
                        value={pathInputValue}
                        onChange={e => setPathInputValue(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                setIsPathEditing(false);
                                handleNavigate(pathInputValue.replace(/^\/+|\/+$/g, ''));
                            }
                            if (e.key === 'Escape') setIsPathEditing(false);
                        }}
                        onBlur={() => setIsPathEditing(false)}
                        placeholder="Nhập đường dẫn thư mục..."
                        className="flex-1 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 outline-none border border-blue-400 rounded px-2 py-0.5 w-full placeholder:text-gray-400"
                        onClick={e => e.stopPropagation()}
                    />
                ) : (
                    <>
                        <button
                            onClick={e => { e.stopPropagation(); handleNavigate(''); }}
                            className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-sm font-medium transition-colors shrink-0 ${currentPath === ''
                                ? 'bg-gray-200/80 dark:bg-gray-700 text-gray-900 dark:text-white'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-700/60'
                                }`}
                        >
                            <Folder size={13} className="text-yellow-500" />
                            Root
                        </button>
                        {breadcrumbParts.map((part, idx) => (
                            <React.Fragment key={idx}>
                                <ChevronRight size={12} className="text-gray-400 shrink-0" />
                                <button
                                    onClick={e => { e.stopPropagation(); breadcrumbClick(idx); }}
                                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-sm font-medium transition-colors shrink-0 ${idx === breadcrumbParts.length - 1
                                        ? 'bg-gray-200/80 dark:bg-gray-700 text-gray-900 dark:text-white'
                                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-700/60'
                                        }`}
                                >
                                    <Folder size={13} className="text-yellow-400" />
                                    {part}
                                </button>
                            </React.Fragment>
                        ))}
                        <span className="ml-auto text-gray-300 dark:text-gray-600 text-xs shrink-0 pr-1 select-none">click để nhập đường dẫn</span>
                    </>
                )}
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Main Content: Files */}
                <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-gray-900 min-w-0">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <FileBrowser
                            items={items}
                            selectedPaths={selectedPaths}
                            onSelectionChange={setSelectedPaths}
                            onNavigate={handleNavigate}
                            onRename={(item: FileItem) => {
                                setDialogInput(item.name);
                                setDialog({ type: 'rename', item });
                            }}
                            onMove={(item: FileItem) => setDialog({ type: 'move', item })}
                            onDelete={(paths: string[]) => handleMultiDelete(paths)}
                            pageNumber={pageNumber}
                            totalPages={totalPages}
                            onPageChange={(page) => setPageNumber(page)}
                            onGridContextMenuAction={(action) => {
                                if (action === 'newFolder') {
                                    setDialog({ type: 'createFolder' });
                                    setDialogInput('');
                                } else if (action === 'uploadFile') {
                                    singleFileInputRef.current?.click();
                                } else if (action === 'uploadFolder') {
                                    folderInputRef.current?.click();
                                }
                            }}
                            onDropUpload={async (files: FileList) => {
                                const fileArray = Array.from(files);
                                if (fileArray.length === 0) return;
                                try {
                                    setUploadProgress(0);
                                    await fileApi.uploadFiles(currentPath, fileArray, (p: number) => setUploadProgress(p));
                                    toast.success("Tải lên thành công");
                                    fetchItems(currentPath, pageNumber);
                                    fetchTree();
                                } catch (err: any) {
                                    toast.error(err.message || "Tải lên thất bại");
                                } finally {
                                    setUploadProgress(null);
                                }
                            }}
                            onDropMove={async (sourcePaths: string[], destFolder: string) => {
                                try {
                                    await fileApi.moveItems(sourcePaths, destFolder);
                                    toast.success("Đã di chuyển file");
                                    fetchItems(currentPath, pageNumber);
                                    fetchTree();
                                } catch (e: any) {
                                    toast.error(e.message || "Lỗi khi di chuyển");
                                }
                            }}
                        />
                    )}
                </div>

                {/* Right Sidebar: Details (Always Fixed 320px) */}
                <div className="w-80 border-l dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 p-4 shrink-0 hidden lg:flex flex-col overflow-y-auto">
                    {selectedItem ? (
                        <>
                            <div className="flex justify-between items-center mb-4 shrink-0">
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Chi Tiết File</h3>
                                <button onClick={() => setSelectedPaths(new Set())} className="text-gray-400 hover:text-gray-600 transition">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="flex flex-col items-center justify-center mb-4 p-4 bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-700 shrink-0">
                                {['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(selectedItem.name.split('.').pop()?.toLowerCase() || '') ? (
                                    <img src={fileApi.getViewUrl(selectedItem.path)} alt={selectedItem.name} className="max-w-full max-h-48 object-contain rounded" />
                                ) : (
                                    <FileText className="w-16 h-16 text-gray-400" />
                                )}
                            </div>

                            <div className="space-y-3 text-sm shrink-0">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Tên file</p>
                                    <p className="font-medium text-gray-800 dark:text-gray-200 break-all">{selectedItem.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Kích thước</p>
                                    <p className="font-medium text-gray-800 dark:text-gray-200">{(selectedItem.size / 1024).toFixed(2)} KB</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Sửa đổi lần cuối</p>
                                    <p className="font-medium text-gray-800 dark:text-gray-200">{new Date(selectedItem.lastModified).toLocaleString('vi-VN')}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Đường dẫn</p>
                                    <p className="font-medium text-gray-800 dark:text-gray-200 break-all">{selectedItem.path}</p>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-col gap-3 shrink-0">
                                <div className="flex gap-2">
                                    <a href={fileApi.getViewUrl(selectedItem.path)} target="_blank" className="flex-1 flex items-center justify-center py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 border dark:border-gray-700 rounded-lg text-sm font-medium transition text-gray-700 dark:text-gray-200">
                                        <Eye size={16} className="mr-2" /> Mở
                                    </a>
                                    <button onClick={() => fileApi.downloadFile(selectedItem.path)} className="flex-1 flex items-center justify-center py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition shadow-sm">
                                        <Download size={16} className="mr-2" /> Tải Xuống
                                    </button>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => { setDialogInput(selectedItem.name); setDialog({ type: 'rename', item: selectedItem }); }}
                                        className="flex flex-col items-center justify-center py-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 border dark:border-gray-700 rounded-lg text-sm font-medium transition text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                    >
                                        <Edit2 size={16} className="mb-1.5" /> Đổi Tên
                                    </button>
                                    <button
                                        onClick={() => setDialog({ type: 'move', item: selectedItem })}
                                        className="flex flex-col items-center justify-center py-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 border dark:border-gray-700 rounded-lg text-sm font-medium transition text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                                    >
                                        <CornerUpRight size={16} className="mb-1.5" /> Di chuyển
                                    </button>
                                    <button
                                        onClick={() => handleMultiDelete([selectedItem.path])}
                                        className="flex flex-col items-center justify-center py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/30 border border-red-100 dark:border-red-900/30 rounded-lg text-sm font-medium transition text-red-600 dark:text-red-400"
                                    >
                                        <Trash2 size={16} className="mb-1.5" /> Xóa File
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <FileText size={48} className="mb-4 opacity-50" strokeWidth={1} />
                            <p className="text-sm font-medium">Bấm vào file để xem chi tiết</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Dialog Overlay */}
            {dialog.type && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6">
                        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                            {dialog.type === 'createFolder' && 'Tạo Thư Mục Mới'}
                            {dialog.type === 'rename' && 'Đổi Tên'}
                            {dialog.type === 'move' && 'Di Chuyển Mục Chọn'}
                        </h2>

                        {(dialog.type === 'createFolder' || dialog.type === 'rename') && (
                            <input
                                type="text"
                                autoFocus
                                disabled={isSubmitting}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-900 dark:border-gray-700 dark:text-white disabled:opacity-50 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                value={dialogInput}
                                onChange={e => setDialogInput(e.target.value)}
                                placeholder={dialog.type === 'createFolder' ? 'Tên Thư Mục' : 'Tên Mới'}
                                onKeyDown={e => e.key === 'Enter' && submitDialog()}
                                onFocus={e => {
                                    if (dialog.type === 'rename' && dialog.item && !dialog.item.isDirectory) {
                                        const dotIndex = e.target.value.lastIndexOf('.');
                                        if (dotIndex > 0) {
                                            e.target.setSelectionRange(0, dotIndex);
                                            return;
                                        }
                                    }
                                    e.target.select();
                                }}
                            />
                        )}

                        {dialog.type === 'move' && (
                            <div className="h-64 border rounded-lg overflow-y-auto p-2 dark:border-gray-700 dark:bg-gray-900">
                                {tree ? (
                                    <FolderTree
                                        tree={tree}
                                        currentPath={moveDestination}
                                        onSelect={setMoveDestination}
                                    />
                                ) : 'Đang tải...'}
                            </div>
                        )}

                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={() => setDialog({ type: null })}
                                disabled={isSubmitting}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-gray-700 transition disabled:opacity-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={submitDialog}
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition disabled:opacity-50 flex items-center justify-center min-w-[100px]"
                            >
                                {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Xác Nhận'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
