import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Diaspora Direct Pay",
  description: "Pay bills and value-in-kind expenses directly for family in Kenya.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
