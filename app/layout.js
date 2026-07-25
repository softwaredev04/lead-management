import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeInit } from "@/components/theme-init";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata = {
  title: "ClickMasters — Lead Management System",
  description: "Centralized dashboard for managing leads across all ClickMasters websites.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ThemeInit />
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={4000}
        />
      </body>
    </html>
  );
}
