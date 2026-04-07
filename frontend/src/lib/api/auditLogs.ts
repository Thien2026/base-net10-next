import { fetchApi } from '../api';
import { PagedResponse } from './files'; // Reusing PagedResponse

export interface AuditLog {
    id: number;
    userId: string;
    userName: string;
    action: string;
    target: string;
    detail?: string;
    ipAddress: string;
    createdAt: string;
}

export const auditLogApi = {
    getLogs: (pageNumber: number = 1, pageSize: number = 50, userId?: string, action?: string) => {
        let query = `?pageNumber=${pageNumber}&pageSize=${pageSize}`;
        if (userId) query += `&userId=${encodeURIComponent(userId)}`;
        if (action) query += `&action=${encodeURIComponent(action)}`;
        return fetchApi<PagedResponse<AuditLog[]>>(`/v1/audit-logs${query}`);
    }
};
