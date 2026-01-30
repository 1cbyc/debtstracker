import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="font-bold text-xl tracking-tighter">debtstracker</div>
        <nav className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost">login</Button>
          </Link>
          <Link href="/signup">
            <Button>get started</Button>
          </Link>
        </nav>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8">
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter max-w-3xl">
          track your debt, <span className="text-muted-foreground">plan your freedom.</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto">
          a data-heavy, minimalist tool for managing your financial obligations and relocation goals.
        </p>
        <div className="flex gap-4 items-center justify-center">
          <Link href="/dashboard">
            <Button size="lg" className="h-12 px-8 text-lg">
              start tracking now
            </Button>
          </Link>
        </div>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border">
        &copy; {new Date().getFullYear()} debtstracker. all rights reserved.
      </footer>
    </div>
  );
}
