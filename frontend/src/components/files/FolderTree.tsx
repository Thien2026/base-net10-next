import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { FileItem } from '@/lib/api/files';

interface FolderTreeProps {
    tree: FileItem;
    currentPath: string;
    onSelect: (path: string) => void;
}

export const FolderTree: React.FC<FolderTreeProps> = ({ tree, currentPath, onSelect }) => {
    // Ensure the root is always expanded
    const [expanded, setExpanded] = useState<Set<string>>(new Set(['']));

    const toggleExpand = (path: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newExpanded = new Set(expanded);
        if (newExpanded.has(path)) {
            newExpanded.delete(path);
        } else {
            newExpanded.add(path);
        }
        setExpanded(newExpanded);
    };

    const renderNode = (node: FileItem) => {
        const isExpanded = expanded.has(node.path);
        const isSelected = currentPath === node.path;
        const hasChildren = node.children && node.children.length > 0;

        return (
            <div key={node.path} className="select-none">
                <div
                    className={`flex items-center py-1.5 px-2 cursor-pointer rounded-md transition-colors ${isSelected ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    onClick={() => onSelect(node.path)}
                >
                    <div
                        className="w-5 h-5 flex items-center justify-center mr-1"
                        onClick={(e) => hasChildren ? toggleExpand(node.path, e) : undefined}
                    >
                        {hasChildren ? (
                            isExpanded ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-500" />
                        ) : null}
                    </div>
                    {isExpanded || isSelected ?
                        <FolderOpen size={16} className="mr-2 shrink-0 text-blue-400" /> :
                        <Folder size={16} className="mr-2 shrink-0 text-blue-400" />
                    }
                    <span className="truncate flex-1 text-sm font-medium">{node.name || 'Thư Mục Gốc'}</span>
                </div>

                {isExpanded && hasChildren && (
                    <div className="ml-5 pl-2 relative border-l border-gray-200 dark:border-gray-700 mt-1">
                        {node.children!
                            .filter(c => c.isDirectory) // Ensure only directories are parsed in tree
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map(child => renderNode(child))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full text-gray-800 dark:text-gray-200">
            {renderNode(tree)}
        </div>
    );
};
