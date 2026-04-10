import AdminLayoutWrapper from "@/components/admin/AdminLayoutWrapper";

import { NavigationProvider } from "@/contexts/NavigationContext";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <NavigationProvider>
            <AdminLayoutWrapper>{children}</AdminLayoutWrapper>
        </NavigationProvider>
    );
}
