import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/ThemeProvider";

const nunitoSans = Nunito_Sans({ 
  subsets: ["latin"],
  weight: ['400', '600', '800', '900'],
  variable: '--font-nunito-sans',
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "Wayspeak",
  description: "The free, fun, and effective way to learn a language!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={`${nunitoSans.variable} font-sans selection:bg-primary-container selection:text-on-primary-container`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

