"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useRouter } from "next/navigation";

interface NavigationContextType {
    isDirty: boolean;
    setDirty: (dirty: boolean) => void;
    checkNavigation: (onConfirmSafe: () => void) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
    const [isDirty, setDirty] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

    const checkNavigation = (onConfirmSafe: () => void) => {
        if (isDirty) {
            setPendingAction(() => onConfirmSafe);
            setIsConfirmOpen(true);
        } else {
            onConfirmSafe();
        }
    };

    const handleConfirmLeave = () => {
        setIsConfirmOpen(false);
        setDirty(false); // Reset dirty state since they chose to leave
        if (pendingAction) {
            pendingAction();
        }
        setPendingAction(null);
    };

    const handleCancelLeave = () => {
        setIsConfirmOpen(false);
        setPendingAction(null);
    };

    return (
        <NavigationContext.Provider value={{ isDirty, setDirty, checkNavigation }}>
            {children}
            <ConfirmModal
                open={isConfirmOpen}
                title="Thay Đổi Chưa Lưu"
                message="Bạn có dữ liệu chưa được lưu. Nếu tiếp tục, các thay đổi chưa lưu sẽ bị mất. Bạn có chắc chắn muốn rời khỏi trang không?"
                confirmText="Vẫn rời đi"
                cancelText="Ở lại"
                isDanger={true}
                onConfirm={handleConfirmLeave}
                onCancel={handleCancelLeave}
            />
        </NavigationContext.Provider>
    );
}

export function useNavigationContext() {
    const context = useContext(NavigationContext);
    if (!context) {
        throw new Error("useNavigationContext must be used within a NavigationProvider");
    }
    return context;
}
