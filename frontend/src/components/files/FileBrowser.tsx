import React, { useState, useRef, useEffect } from 'react';
import { FileItem, fileApi } from '@/lib/api/files';
import {
    FileText, File, Folder, Edit2, Trash2, Download, Eye, CornerUpRight, FolderPlus, Upload, UploadCloud
} from 'lucide-react';

interface FileBrowserProps {
    items: FileItem[];
    selectedPaths: Set<string>;
    onSelectionChange: (paths: Set<string>) => void;
    onNavigate: (path: string) => void;
    onRename: (item: FileItem) => void;
    onMove: (item: FileItem) => void;
    onDelete: (paths: string[]) => void;
    pageNumber: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onGridContextMenuAction: (action: 'uploadFile' | 'uploadFolder' | 'newFolder') => void;
    onDropUpload: (files: FileList) => void;
    onDropMove: (sourcePaths: string[], destFolder: string) => void;
}

export const FileBrowser: React.FC<FileBrowserProps> = ({
    items, selectedPaths, onSelectionChange, onNavigate, onRename, onMove, onDelete,
    pageNumber, totalPages, onPageChange, onGridContextMenuAction, onDropUpload, onDropMove
}) => {
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, type: 'file' | 'grid', item?: FileItem } | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [folderDropTarget, setFolderDropTarget] = useState<string | null>(null); // path of folder being hovered over during drag
    const draggedPathsRef = useRef<string[]>([]);

    // Lasso Selection State
    const [selectionBox, setSelectionBox] = useState<{ startX: number, startY: number, currentX: number, currentY: number } | null>(null);
    const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const gridContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = () => setContextMenu(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    // Global Lasso mouse tracking effect
    useEffect(() => {
        if (!selectionBox) return;

        const handleMouseMove = (e: MouseEvent) => {
            setSelectionBox(prev => prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null);
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (!selectionBox) return;
            const rect = {
                left: Math.min(selectionBox.startX, selectionBox.currentX),
                top: Math.min(selectionBox.startY, selectionBox.currentY),
                right: Math.max(selectionBox.startX, selectionBox.currentX),
                bottom: Math.max(selectionBox.startY, selectionBox.currentY)
            };

            // Minimum distance to count as a lasso drag vs a click
            if (Math.abs(selectionBox.currentX - selectionBox.startX) > 5 || Math.abs(selectionBox.currentY - selectionBox.startY) > 5) {
                const newSelection = new Set<string>();
                itemRefs.current.forEach((el, path) => {
                    if (!el) return;
                    const itemRect = el.getBoundingClientRect();
                    // Check intersection
                    if (!(itemRect.right < rect.left || itemRect.left > rect.right || itemRect.bottom < rect.top || itemRect.top > rect.bottom)) {
                        newSelection.add(path);
                    }
                });
                onSelectionChange(newSelection);
            } else {
                // If it was just a tiny click on empty background, clear selection
                onSelectionChange(new Set());
            }
            setSelectionBox(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [selectionBox, onSelectionChange]);

    const handleGridContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if ((e.target as HTMLElement).closest('.file-item')) return;
        setContextMenu({ x: e.clientX, y: e.clientY, type: 'grid' });
    };

    const handleItemContextMenu = (item: FileItem, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!selectedPaths.has(item.path)) {
            onSelectionChange(new Set([item.path]));
        }
        setContextMenu({ x: e.clientX, y: e.clientY, type: 'file', item });
    };

    const handleGridMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return; // Only left click starts drag
        if ((e.target as HTMLElement).closest('.file-item')) return; // handled by item
        if ((e.target as HTMLElement).closest('.context-menu')) return;
        setSelectionBox({ startX: e.clientX, startY: e.clientY, currentX: e.clientX, currentY: e.clientY });
    };

    const toggleSelection = (path: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (contextMenu) setContextMenu(null);

        const newSelected = new Set(selectedPaths);
        // If ctrl or cmd is pressed, or clicking checkbox, toggle it
        if (e.ctrlKey || e.metaKey || (e.target as HTMLElement).tagName.toLowerCase() === 'input') {
            if (newSelected.has(path)) newSelected.delete(path);
            else newSelected.add(path);
        } else {
            // Otherwise native behavior: replace selection with this item
            newSelected.clear();
            newSelected.add(path);
        }
        onSelectionChange(newSelected);
    };

    const selectAll = () => {
        if (selectedPaths.size === items.length) {
            onSelectionChange(new Set());
        } else {
            onSelectionChange(new Set(items.map(i => i.path)));
        }
    };

    // Drag and Drop into container
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation(); setIsDragOver(true);
    };
    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation(); setIsDragOver(false);
    };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation(); setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onDropUpload(e.dataTransfer.files);
        }
    };

    const getFileIcon = (item: FileItem) => {
        const ext = item.name.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')) {
            return (
                <div className="w-full h-28 mb-3 bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden flex items-center justify-center shrink-0 border dark:border-gray-700 pointer-events-none">
                    <img src={fileApi.getViewUrl(item.path)} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
            );
        }
        if (['pdf', 'doc', 'docx', 'txt', 'csv'].includes(ext || '')) {
            return (
                <div className="w-full h-28 mb-3 bg-gray-50 dark:bg-gray-800 rounded-md flex items-center justify-center shrink-0 border dark:border-gray-700 pointer-events-none">
                    <FileText className="text-gray-400 w-12 h-12" />
                </div>
            );
        }
        return (
            <div className="w-full h-28 mb-3 bg-gray-50 dark:bg-gray-800 rounded-md flex items-center justify-center shrink-0 border dark:border-gray-700 pointer-events-none">
                <File className="text-gray-400 w-12 h-12" />
            </div>
        );
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const handleAction = (action: string, item: FileItem, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setContextMenu(null);

        if (action === 'rename') onRename(item);
        if (action === 'move') onMove(item);
        if (action === 'delete') onDelete([item.path]);
        if (action === 'download') {
            if (item.isDirectory) fileApi.downloadZip([item.path]);
            else fileApi.downloadFile(item.path);
        }
        if (action === 'view' && !item.isDirectory) {
            window.open(fileApi.getViewUrl(item.path), '_blank');
        }
    };

    // Render Context Menu via Portal or Absolute (Using fixed window pos for true context menu)
    const renderContextMenu = () => {
        if (!contextMenu) return null;
        return (
            <div
                className="context-menu fixed bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-xl rounded-lg overflow-hidden z-[9999] text-sm py-1 min-w-[160px]"
                style={{ top: contextMenu.y, left: contextMenu.x }}
                onContextMenu={e => e.preventDefault()}
            >
                {contextMenu.type === 'file' && contextMenu.item ? (
                    <>
                        {!contextMenu.item.isDirectory && (
                            <button onClick={(e) => handleAction('view', contextMenu.item!, e)} className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-gray-700 dark:text-gray-200">
                                <Eye size={15} className="mr-3 text-gray-500" /> Xem
                            </button>
                        )}
                        <button onClick={(e) => handleAction('download', contextMenu.item!, e)} className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-gray-700 dark:text-gray-200">
                            <Download size={15} className="mr-3 text-gray-500" /> Tải Xuống
                        </button>
                        <button onClick={(e) => handleAction('rename', contextMenu.item!, e)} className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-gray-700 dark:text-gray-200">
                            <Edit2 size={15} className="mr-3 text-gray-500" /> Đổi Tên
                        </button>
                        <button onClick={(e) => handleAction('move', contextMenu.item!, e)} className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-gray-700 dark:text-gray-200">
                            <CornerUpRight size={15} className="mr-3 text-gray-500" /> Di Chuyển
                        </button>
                        <hr className="my-1 border-gray-200 dark:border-gray-700" />
                        <button onClick={(e) => handleAction('delete', contextMenu.item!, e)} className="w-full text-left px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center text-red-600 dark:text-red-400">
                            <Trash2 size={15} className="mr-3" /> Xóa
                        </button>
                    </>
                ) : (
                    <>
                        <button onClick={(e) => { e.stopPropagation(); setContextMenu(null); onGridContextMenuAction('newFolder'); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-gray-700 dark:text-gray-200">
                            <FolderPlus size={15} className="mr-3 text-gray-500" /> Thư Mục Mới
                        </button>
                        <hr className="my-1 border-gray-200 dark:border-gray-700" />
                        <button onClick={(e) => { e.stopPropagation(); setContextMenu(null); onGridContextMenuAction('uploadFile'); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-gray-700 dark:text-gray-200">
                            <Upload size={15} className="mr-3 text-gray-500" /> Tải Lên Tệp
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setContextMenu(null); onGridContextMenuAction('uploadFolder'); }} className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-gray-700 dark:text-gray-200">
                            <UploadCloud size={15} className="mr-3 text-gray-500" /> Tải Lên Thư Mục
                        </button>
                    </>
                )}
            </div>
        );
    };

    if (items.length === 0 && !isDragOver) {
        return (
            <div
                className="flex-1 flex flex-col items-center justify-center text-gray-500 min-h-[400px] w-full"
                onContextMenu={handleGridContextMenu}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <Folder className="w-16 h-16 text-gray-300 mb-4" />
                <p>Thư mục trống. Kéo thả file vào đây hoặc chuột phải để tải lên.</p>
                {renderContextMenu()}
            </div>
        );
    }

    return (
        <div
            className={`flex-1 w-full relative pb-10 min-h-[400px] transition-colors rounded-xl ${isDragOver ? 'bg-blue-50/50 dark:bg-blue-900/10 border-2 border-dashed border-blue-400' : ''}`}
            onContextMenu={handleGridContextMenu}
            onMouseDown={handleGridMouseDown}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            ref={gridContainerRef}
        >
            <div className="mb-4 flex items-center justify-between px-2 pt-2">
                <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer select-none" onClick={e => e.stopPropagation()}>
                    <input
                        type="checkbox"
                        checked={selectedPaths.size > 0 && selectedPaths.size === items.length}
                        ref={input => { if (input) input.indeterminate = selectedPaths.size > 0 && selectedPaths.size < items.length; }}
                        onChange={selectAll}
                        className="rounded border-gray-300"
                    />
                    <span>Chọn Tất Cả ({selectedPaths.size}/{items.length})</span>
                </label>
            </div>

            <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-5 px-2">
                {items.sort((a, b) => {
                    if (a.isDirectory && !b.isDirectory) return -1;
                    if (!a.isDirectory && b.isDirectory) return 1;
                    return a.name.localeCompare(b.name);
                }).map(item => (
                    <div
                        key={item.path}
                        data-path={item.path}
                        ref={el => {
                            if (el) itemRefs.current.set(item.path, el);
                            else itemRefs.current.delete(item.path);
                        }}
                        onClick={(e) => toggleSelection(item.path, e)}
                        onDoubleClick={(e) => {
                            e.stopPropagation();
                            if (item.isDirectory) onNavigate(item.path);
                            else handleAction('view', item);
                        }}
                        onContextMenu={(e) => handleItemContextMenu(item, e)}
                        draggable
                        onDragStart={(e) => {
                            e.stopPropagation();
                            // Drag currently selected items, or just this one
                            const pathsToDrag = selectedPaths.has(item.path)
                                ? Array.from(selectedPaths)
                                : [item.path];
                            draggedPathsRef.current = pathsToDrag;
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('text/plain', pathsToDrag.join('\n'));
                        }}
                        onDragOver={(e) => {
                            if (!item.isDirectory) return;
                            // Don't allow dropping onto self
                            if (draggedPathsRef.current.includes(item.path)) return;
                            e.preventDefault();
                            e.stopPropagation();
                            setFolderDropTarget(item.path);
                        }}
                        onDragLeave={(e) => {
                            e.stopPropagation();
                            setFolderDropTarget(null);
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setFolderDropTarget(null);
                            if (!item.isDirectory) return;
                            if (draggedPathsRef.current.length === 0) return;
                            if (draggedPathsRef.current.includes(item.path)) return;
                            onDropMove(draggedPathsRef.current, item.path);
                            draggedPathsRef.current = [];
                        }}
                        className={`
                            file-item group relative flex flex-col items-center p-3 border rounded-xl cursor-pointer transition-all hover:shadow-md select-none
                            ${folderDropTarget === item.path
                                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30 scale-105 shadow-lg'
                                : selectedPaths.has(item.path)
                                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-sm'
                                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600'
                            }
                        `}
                    >
                        <div className="absolute top-2 left-2 z-10 hidden group-hover:block" onClick={e => e.stopPropagation()}>
                            <input
                                type="checkbox"
                                checked={selectedPaths.has(item.path)}
                                onChange={(e) => toggleSelection(item.path, e as any)}
                                className={`rounded border-gray-300 h-4 w-4 ${selectedPaths.has(item.path) ? '!block' : ''}`}
                                style={{ display: selectedPaths.has(item.path) ? 'block' : undefined }}
                            />
                        </div>

                        {item.isDirectory ? (
                            <div className="w-full h-28 mb-3 bg-gray-50 dark:bg-gray-800 rounded-md flex items-center justify-center shrink-0 border dark:border-gray-700 pointer-events-none">
                                <Folder className="text-yellow-400 w-16 h-16 drop-shadow-sm" fill="currentColor" />
                            </div>
                        ) : getFileIcon(item)}

                        <span
                            className={`text-sm font-semibold text-center w-full line-clamp-2 px-1 break-words mb-1 
                                ${selectedPaths.has(item.path) ? 'text-blue-800 dark:text-blue-200' : 'text-gray-800 dark:text-gray-200'}
                            `}
                            title={item.name}
                            onClick={(e) => {
                                // "Click vào chỗ tên là đổi tên" effect
                                e.stopPropagation();
                                onRename(item);
                            }}
                        >
                            {item.name}
                        </span>
                        <span className="text-xs text-gray-400 text-center w-full truncate pointer-events-none">
                            {item.isDirectory ? formatDate(item.lastModified) : formatSize(item.size)}
                        </span>
                    </div>
                ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-4 mt-8 pb-4" onMouseDown={(e) => e.stopPropagation()}>
                    <button
                        disabled={pageNumber === 1}
                        onClick={() => onPageChange(pageNumber - 1)}
                        className="px-3 py-1.5 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center disabled:opacity-50 transition"
                    >
                        Trang trước
                    </button>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {pageNumber} / {totalPages}
                    </span>
                    <button
                        disabled={pageNumber === totalPages}
                        onClick={() => onPageChange(pageNumber + 1)}
                        className="px-3 py-1.5 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center disabled:opacity-50 transition"
                    >
                        Trang tiếp
                    </button>
                </div>
            )}

            {/* Drag Selection Box Overlay */}
            {selectionBox && (
                <div
                    style={{
                        position: 'fixed',
                        left: Math.min(selectionBox.startX, selectionBox.currentX),
                        top: Math.min(selectionBox.startY, selectionBox.currentY),
                        width: Math.abs(selectionBox.currentX - selectionBox.startX),
                        height: Math.abs(selectionBox.currentY - selectionBox.startY),
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                        zIndex: 9999,
                        pointerEvents: 'none',
                        borderRadius: '2px'
                    }}
                />
            )}

            {/* Drag Over Overlay Overlay (For external files) */}
            {isDragOver && (
                <div className="absolute inset-0 z-[100] bg-blue-500/10 dark:bg-blue-500/5 backdrop-blur-[1px] flex items-center justify-center pointer-events-none rounded-xl">
                    <div className="bg-white/90 dark:bg-gray-800/90 py-4 px-8 rounded-2xl shadow-xl flex items-center">
                        <UploadCloud className="w-8 h-8 text-blue-500 mr-3 animate-bounce" />
                        <span className="text-lg font-bold text-gray-700 dark:text-gray-200">Thả file vào đây để Upload</span>
                    </div>
                </div>
            )}

            {renderContextMenu()}
        </div>
    );
};
