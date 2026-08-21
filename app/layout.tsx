import "../globals.css";

export const metadata = {
  title: "PropertyIQ — Market Intelligence",
  description: "Turn property data into better decisions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
