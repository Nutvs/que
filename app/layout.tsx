import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BOYdKO Christmas Concert • Queue Management",
  description: "Queue management system for BOYdKO Christmas Concert",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body>{children}</body></html>;
}
