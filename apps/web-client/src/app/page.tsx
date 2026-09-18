import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Server,
  Layers,
  Sparkles,
  ArrowRight,
  Database,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-2.5 py-0.5 text-xs font-mono">
            apps/web-client
          </Badge>
          <Badge variant="secondary" className="px-2.5 py-0.5 text-xs">
            Next.js 14 App Router
          </Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Hackathon Chassis Dashboard
        </h1>
        <p className="text-muted-foreground max-w-2xl text-base">
          Production-grade frontend boilerplate pre-wired with shadcn/ui neutral theme,
          TypeScript strict mode, and full microservice architecture integration.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:border-foreground/20 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">UI Toolkit</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">shadcn/ui</div>
            <p className="text-xs text-muted-foreground mt-1">
              Button, Card, Input, Dialog, Table, Badge configured.
            </p>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href="/users" className="flex items-center justify-center gap-1">
                Explore UI & Data <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="hover:border-foreground/20 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Backend Integration</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Live Microservices</div>
            <p className="text-xs text-muted-foreground mt-1">
              Connected with Identity, Data, and Docker Compose network.
            </p>
          </CardContent>
          <CardFooter className="pt-0">
            <Badge variant="secondary" className="w-full justify-center py-1 font-mono text-[11px]">
              Port :3000 &bull; Network: Shared
            </Badge>
          </CardFooter>
        </Card>

        <Card className="hover:border-foreground/20 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality & Tests</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Vitest + RTL</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pre-configured unit and component testing suites.
            </p>
          </CardContent>
          <CardFooter className="pt-0">
            <Badge variant="outline" className="w-full justify-center py-1 font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
              ✓ Ready for Hackathon Build
            </Badge>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Quick Start & Feature Plugging
          </CardTitle>
          <CardDescription>
            How to build out your hackathon solution in this chassis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="p-4 rounded-md border bg-muted/40 space-y-2">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">1</span>
                Add UI Views
              </span>
              <p className="text-xs text-muted-foreground">
                Create new routes in <code className="font-mono bg-background px-1 py-0.5 rounded border">src/app/&lt;feature&gt;/page.tsx</code> using the pre-installed shadcn components.
              </p>
            </div>
            <div className="p-4 rounded-md border bg-muted/40 space-y-2">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">2</span>
                Connect Backend Endpoints
              </span>
              <p className="text-xs text-muted-foreground">
                Use native <code className="font-mono bg-background px-1 py-0.5 rounded border">fetch()</code> in Server Components or Client Hooks to interact with services.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
