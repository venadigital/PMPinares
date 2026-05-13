import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pinares Project Control",
  description: "Gestion y control del proyecto de consultoria Pinares",
  icons: {
    icon: "/icon.svg"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
