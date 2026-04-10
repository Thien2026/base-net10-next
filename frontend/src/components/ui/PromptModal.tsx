import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface PromptModalProps {
    open: boolean;
    title: string;
    message: React.ReactNode;
    defaultValue?: string;
    placeholder?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: (val: string) => void;
    onCancel: () => void;
}

export function PromptModal({
    open,
    title,
    message,
    defaultValue = "",
    placeholder = "Nhập giá trị...",
    confirmText = "Xác nhận",
    cancelText = "Huỷ",
    onConfirm,
    onCancel
}: PromptModalProps) {
    const [value, setValue] = useState(defaultValue);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            setValue(defaultValue);
            setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            }, 50);
        }
    }, [open, defaultValue]);

    if (!open) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(value);
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onCancel} />
            <div 
                className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200/50 dark:border-white/10 p-6 animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onCancel} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                    <X size={20} />
                </button>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
                        <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">
                        {message}
                    </p>
                    
                    <input
                        ref={inputRef}
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={placeholder}
                        className="w-full px-4 py-2.5 mb-6 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-slate-800 dark:text-white"
                    />

                    <div className="flex gap-3">
                        <button 
                            type="button"
                            onClick={onCancel} 
                            className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-300 rounded-xl font-semibold transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button 
                            type="submit" 
                            disabled={!value.trim()}
                            className="flex-1 px-4 py-2.5 text-white bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {confirmText}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
