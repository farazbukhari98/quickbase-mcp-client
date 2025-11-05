'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FolderKanban, DollarSign, Users, MessageSquare, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Navigation component for reuse
function Navigation({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { href: '/dashboard/projects', icon: FolderKanban, label: 'Projects' },
    { href: '/dashboard/financials', icon: DollarSign, label: 'Financials' },
    { href: '/dashboard/managers', icon: Users, label: 'Managers' },
  ];

  return (
    <nav className="flex-1 space-y-1 p-4">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onLinkClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              "lg:py-2",
              isActive && "bg-accent text-accent-foreground"
            )}
          >
            <Icon className="h-5 w-5 lg:h-4 lg:w-4" />
            {item.label}
          </Link>
        );
      })}

      <div className="my-4 border-t" />

      <Link
        href="/"
        onClick={onLinkClick}
        className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors lg:py-2"
      >
        <MessageSquare className="h-5 w-5 lg:h-4 lg:w-4" />
        Chat Interface
      </Link>
    </nav>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 border-r bg-card">
        <div className="flex h-full flex-col">
          {/* Logo/Header */}
          <div className="border-b p-6">
            <h1 className="text-2xl font-bold">CMS Controls</h1>
            <p className="text-sm text-muted-foreground">Dashboard</p>
          </div>

          <Navigation />

          {/* Footer */}
          <div className="border-t p-4 text-xs text-muted-foreground">
            <p>Powered by QuickBase MCP</p>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex h-full items-center justify-between px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(true)}
            className="h-10 w-10"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open menu</span>
          </Button>

          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold">CMS Controls</h1>
          </div>

          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Mobile Menu Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetHeader className="border-b p-6 text-left">
            <SheetTitle className="text-2xl">CMS Controls</SheetTitle>
            <p className="text-sm text-muted-foreground">Dashboard</p>
          </SheetHeader>

          <Navigation onLinkClick={() => setMobileMenuOpen(false)} />

          <div className="border-t p-4 text-xs text-muted-foreground mt-auto">
            <p>Powered by QuickBase MCP</p>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-16 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
