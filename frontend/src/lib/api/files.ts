import { fetchApi } from '../api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5290/api';

export interface FileItem {
    name: string;
    path: string;
    isDirectory: boolean;
    size: number;
    lastModified: string;
    extension: string;
    children?: FileItem[];
}

export interface PagedResponse<T> {
    pageNumber: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
    data: T;
}

export interface StorageStats {
    totalSizeBytes: number;
    totalFiles: number;
    totalFolders: number;
    totalSizeFormatted: string;
}

export const fileApi = {
    getStats: () => fetchApi<StorageStats>('/v1/files/stats'),

    getFolderTree: () => fetchApi<FileItem>('/v1/files/tree'),

    getItems: (path: string = "", pageNumber: number = 1, pageSize: number = 50) =>
        fetchApi<PagedResponse<FileItem[]>>(`/v1/files/list?path=${encodeURIComponent(path)}&pageNumber=${pageNumber}&pageSize=${pageSize}`),

    createFolder: (path: string, folderName: string) =>
        fetchApi<{ message: string }>('/v1/files/folder', {
            method: 'POST',
            body: JSON.stringify({ path, folderName })
        }),

    renameItem: (path: string, newName: string) =>
        fetchApi<{ message: string }>('/v1/files/rename', {
            method: 'PUT',
            body: JSON.stringify({ path, newName })
        }),

    moveItems: (paths: string[], destinationFolder: string) =>
        fetchApi<{ message: string }>('/v1/files/move', {
            method: 'PUT',
            body: JSON.stringify({ paths, destinationFolder })
        }),

    deleteItems: (paths: string[]) =>
        fetchApi<{ message: string }>('/v1/files/delete', {
            method: 'POST',
            body: JSON.stringify({ paths })
        }),

    uploadFiles: async (path: string, files: File[], onProgress?: (p: number) => void) => {
        const formData = new FormData();
        formData.append('path', path);

        files.forEach(file => {
            formData.append('files', file);
            // Append relative path if webkitRelativePath is available (for folder upload)
            formData.append('relativePaths', file.webkitRelativePath || file.name);
        });

        // Using standard XMLHttpRequest for upload progress
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', `${API_BASE_URL}/v1/files/upload`, true);
            xhr.withCredentials = true;

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable && onProgress) {
                    const percentComplete = Math.round((e.loaded / e.total) * 100);
                    onProgress(percentComplete);
                }
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    reject(new Error(`Upload failed: ${xhr.statusText}`));
                }
            };

            xhr.onerror = () => reject(new Error('Upload failed due to network error.'));
            xhr.send(formData);
        });
    },

    downloadZip: async (paths: string[]) => {
        const response = await fetch(`${API_BASE_URL}/v1/files/download-zip`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ paths })
        });

        if (!response.ok) throw new Error("Download failed");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // Extract filename from Content-Disposition if possible, else default
        const contentDisposition = response.headers.get('content-disposition');
        let filename = `Download_${new Date().getTime()}.zip`;
        if (contentDisposition && contentDisposition.includes('filename=')) {
            const matches = /filename="([^"]+)"/.exec(contentDisposition);
            if (matches && matches[1]) {
                filename = matches[1];
            }
        }

        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    },

    downloadFile: (path: string) => {
        const url = `${API_BASE_URL}/v1/files/download?path=${encodeURIComponent(path)}`;
        window.open(url, '_blank');
        // This relies on the browser to handle the file download based on Content-Disposition header
    },

    getViewUrl: (path: string) => {
        return `${API_BASE_URL}/v1/files/view?path=${encodeURIComponent(path)}`;
    }
};
