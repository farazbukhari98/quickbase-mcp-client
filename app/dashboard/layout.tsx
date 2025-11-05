import Link from 'next/link';
import { LayoutDashboard, FolderKanban, DollarSign, Users, MessageSquare } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.Node;
}) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card">
        <div className="flex h-full flex-col">
          {/* Logo/Header */}
          <div className="border-b p-6">
            <h1 className="text-2xl font-bold">CMS Controls</h1>
            <p className="text-sm text-muted-foreground">Dashboard</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </Link>
            <Link
              href="/dashboard/projects"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <FolderKanban className="h-4 w-4" />
              Projects
            </Link>
            <Link
              href="/dashboard/financials"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <DollarSign className="h-4 w-4" />
              Financials
            </Link>
            <Link
              href="/dashboard/managers"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Users className="h-4 w-4" />
              Managers
            </Link>

            <div className="my-4 border-t" />

            <Link
              href="/"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              Chat Interface
            </Link>
          </nav>

          {/* Footer */}
          <div className="border-t p-4 text-xs text-muted-foreground">
            <p>Powered by QuickBase MCP</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
