"use client";

import { useEffect } from "react";
import { useNavigationContext } from "@/contexts/NavigationContext";

/**
 * useUnsavedChanges Hook
 * Gắn hook này vào bất kì trang nào cần cảnh báo khi Reload F5 hoặc Đóng Tab.
 * Nó sẽ tự động kết nối với NavigationContext để đọc cờ isDirty.
 */
export function useUnsavedChanges() {
    const { isDirty } = useNavigationContext();

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                // Tiêu chuẩn bắt buộc của trình duyệt hiện đại để hiện Popup Native
                e.preventDefault();
                e.returnValue = "";
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [isDirty]);
}
