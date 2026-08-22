import type { ReactNode } from "react";
import "./globals.css";

export const metadata = { title: "Estate Intelligence", description: "AI-powered real-estate analytics and insights" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
