import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/components/providers";

export const metadata: Metadata = {
  title: "Anemone Magic Reading — Petualangan Seru Belajar Membaca!",
  description: "Game belajar membaca untuk anak 4 tahun, berdasarkan metode Cara Baca Ajaib Anemone.",
  applicationName: "Anemone Magic Reading",
  appleWebApp: { capable: true, title: "Anemone", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#bfeaff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
