import toast from "react-hot-toast";

// Base API Client — uses httpOnly cookies for auth (set by backend on login)
// credentials: 'include' is required for cross-origin cookie support
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5290/api';

export async function fetchApi<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const defaultHeaders: HeadersInit = {
        'Content-Type': 'application/json',
    };

    const config: RequestInit = {
        ...options,
        credentials: 'include', // Send httpOnly cookies on every request
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        if (!response.ok) {
            // Cố gắng parse JSON lỗi từ backend
            const errorData = await response.json().catch(() => null);
            let toastMessage = `API request failed with status ${response.status}`;

            if (errorData) {
                // 1. Dạng mảng trực tiếp từ IdentityResult.Errors: [{ "code": "...", "description": "Mật khẩu yếu" }]
                if (Array.isArray(errorData) && errorData.length > 0 && errorData[0].description) {
                    toastMessage = errorData[0].description;
                }
                // 2. Dạng ProblemDetails của .NET API: { "title": "Báo lỗi", "errors": { "Password": ["Mật khẩu yếu"] } }
                else if (errorData.errors && typeof errorData.errors === 'object') {
                    if (Array.isArray(errorData.errors) && errorData.errors.length > 0) {
                        toastMessage = errorData.errors[0].description || errorData.errors[0].message || toastMessage;
                    } else {
                        const firstKey = Object.keys(errorData.errors)[0];
                        if (firstKey && Array.isArray(errorData.errors[firstKey])) {
                            toastMessage = errorData.errors[firstKey][0];
                        }
                    }
                }
                // 3. Dạng Custom Response: { "message": "Email đã tồn tại" }
                else if (errorData.message) {
                    toastMessage = errorData.message;
                }
                // 4. Fallback title
                else if (errorData.title) {
                    toastMessage = errorData.title;
                }
            }

            toast.error(toastMessage);
            throw new Error(toastMessage);
        }

        if (response.status === 204) {
            return {} as T;
        }
        return await response.json();
    } catch (error: any) {
        // Trong trường hợp rớt mạng / server chết (Network error) không có res JSON
        if (!error.message || error.message === 'Failed to fetch') {
            toast.error("Không thể kết nối đến máy chủ.");
        }
        throw error;
    }
}
