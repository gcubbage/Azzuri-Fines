import type { Metadata, Viewport } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Azzuri Fines",
  description: "Soccer team fines tracker",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1d4ed8",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen text-slate-900 antialiased">
        <div className="mx-auto max-w-lg pb-20">
          <header className="sticky top-0 z-30 bg-brand px-4 py-3 text-white shadow">
            <h1 className="text-lg font-bold tracking-tight">⚽ Azzuri Fines</h1>
          </header>
          <main className="px-4 py-4">{children}</main>
        </div>
        <NavBar />
      </body>
    </html>
  );
}
