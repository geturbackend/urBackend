import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { LayoutDashboard, Users, Terminal, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hackathon Chassis | Web Client",
  description: "Production-grade Next.js 14 + shadcn/ui Hackathon Client",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col bg-background text-foreground">
          <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-8">
              <div className="flex items-center space-x-6">
                <Link href="/" className="flex items-center space-x-2 font-bold tracking-tight">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span>Hackathon Chassis</span>
                  <Badge variant="secondary" className="text-[10px] ml-1">v1.0</Badge>
                </Link>
                <nav className="flex items-center space-x-4 text-sm font-medium">
                  <Link
                    href="/"
                    className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Overview</span>
                  </Link>
                  <Link
                    href="/users"
                    className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Users className="h-4 w-4" />
                    <span>Users</span>
                  </Link>
                </nav>
              </div>
              <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="hidden sm:inline">Stack Live</span>
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 container max-w-screen-2xl py-6 px-4 sm:px-8">
            {children}
          </main>
          <footer className="border-t py-4 text-center text-xs text-muted-foreground">
            Hackathon Boilerplate &bull; Next.js 14 App Router &bull; shadcn/ui &bull; Tailwind CSS
          </footer>
        </div>
      </body>
    </html>
  );
}
