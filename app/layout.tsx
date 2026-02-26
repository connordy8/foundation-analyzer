import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Foundation Analyzer | Merit America Fit Score",
  description:
    "Analyze any foundation's 990 data to reveal giving composition, major grant recipients, and Merit America funding fit score.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
