import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ToasterProvider from "@/components/shared/ToasterProvider";
import { ThemeProvider } from "@/components/shared/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5290/api';
  let title = "Source Base - Clean Architecture";
  let description = "Dự án mẫu Fullstack .NET 10 và Next.js";

  try {
    const res = await fetch(`${API_URL}/Setting`, { next: { revalidate: 60 } });
    if (res.ok) {
      const settings = await res.json();
      if (settings.SiteTitle) title = settings.SiteTitle;
      if (settings.SiteDescription) description = settings.SiteDescription;
    }
  } catch (error) {
    console.error("Failed to fetch settings for metadata", error);
  }

  return { title, description };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-full flex flex-col antialiased bg-background text-foreground transition-colors duration-300`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          <ToasterProvider />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
