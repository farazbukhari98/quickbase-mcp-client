'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderKanban, DollarSign, FileText, TrendingUp, RefreshCw, AlertCircle } from 'lucide-react';
import { useDashboardStats, useActiveProjects } from '@/hooks/use-dashboard-data';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { AIInsightsWidget } from '@/components/dashboard/ai-insights-widget';

export default function DashboardPage() {
  const { data: stats, isLoading, error, refetch, dataUpdatedAt } = useDashboardStats();
  const { data: projects } = useActiveProjects();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleRefresh = async () => {
    toast.promise(refetch(), {
      loading: 'Refreshing dashboard...',
      success: 'Dashboard updated!',
      error: 'Failed to refresh',
    });
  };

  // Top 5 projects by budget
  const topProjects = projects
    ?.sort((a, b) => b.budgetRevenue - a.budgetRevenue)
    .slice(0, 5) || [];

  if (error) {
    return (
      <div className="p-4 sm:p-8 flex items-center justify-center min-h-screen">
        <Card className="p-6 max-w-md w-full">
          <div className="flex items-center gap-2 text-destructive mb-4">
            <AlertCircle className="h-5 w-5" />
            <h3 className="font-semibold">Error Loading Dashboard</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {error instanceof Error ? error.message : 'Failed to load dashboard data'}
          </p>
          <Button onClick={handleRefresh} variant="outline" className="w-full sm:w-auto">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Executive Overview</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Real-time insights into your project portfolio
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Last updated: {dataUpdatedAt ? formatDistanceToNow(new Date(dataUpdatedAt), { addSuffix: true }) : 'Never'}
          </span>
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isLoading} className="w-full sm:w-auto">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
        {/* Active Projects */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Active Projects
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold mt-2">
                {isLoading ? '...' : stats.activeProjects}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Currently in progress
              </p>
            </div>
            <div className="rounded-full bg-primary/10 p-2 sm:p-3">
              <FolderKanban className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
          </div>
        </Card>

        {/* Total Budget */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Budget Value
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold mt-2">
                {isLoading ? '...' : formatCurrency(stats.totalBudget)}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Revenue budget
              </p>
            </div>
            <div className="rounded-full bg-blue-500/10 p-2 sm:p-3">
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
            </div>
          </div>
        </Card>

        {/* Total Invoiced */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Invoiced YTD
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold mt-2">
                {isLoading ? '...' : formatCurrency(stats.totalInvoiced)}
              </h3>
              <p className="text-xs text-green-600 mt-1">
                {!isLoading && stats.totalBudget > 0 && `${((stats.totalInvoiced / stats.totalBudget) * 100).toFixed(0)}% of budget`}
              </p>
            </div>
            <div className="rounded-full bg-green-500/10 p-2 sm:p-3">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
            </div>
          </div>
        </Card>

        {/* Average GM */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Avg Gross Margin
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold mt-2">
                {isLoading ? '...' : `${(stats.avgGrossMargin * 100).toFixed(1)}%`}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Company-wide average
              </p>
            </div>
            <div className="rounded-full bg-purple-500/10 p-2 sm:p-3">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* AI Insights & Project Health Section */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 mb-6 sm:mb-8">
        {/* AI Insights Widget */}
        <AIInsightsWidget />

        {/* Project Health Status */}
        <div className="space-y-4 sm:space-y-6">
          <Card className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4">Project Health Status</h3>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm">Healthy (80-100)</span>
                  </div>
                  <span className="font-semibold">{stats.healthBreakdown.green}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-sm">Watch (60-79)</span>
                  </div>
                  <span className="font-semibold">{stats.healthBreakdown.yellow}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm">At Risk (&lt;60)</span>
                  </div>
                  <span className="font-semibold">{stats.healthBreakdown.red}</span>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-4">Quick Stats</h3>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Pending Invoices:</span>
                  <span className="font-medium">
                    {formatCurrency(projects?.reduce((sum, p) => sum + (p.invoicedPending || 0), 0) || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Committed Costs:</span>
                  <span className="font-medium">
                    {formatCurrency(projects?.reduce((sum, p) => sum + (p.committedCost || 0), 0) || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Health Score:</span>
                  <span className="font-medium">
                    {projects && projects.length > 0
                      ? (projects.reduce((sum, p) => sum + p.healthScore, 0) / projects.length).toFixed(0)
                      : 0}/100
                  </span>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Top Projects */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4">Top 5 Projects by Value</h3>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : topProjects.length === 0 ? (
          <div className="text-sm text-muted-foreground">No projects found</div>
        ) : (
          <div className="space-y-3">
            {topProjects.map((project, index) => (
              <div key={project.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 sm:py-2 border-b last:border-0 gap-2 sm:gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-base sm:text-lg font-semibold text-muted-foreground w-5 sm:w-6 flex-shrink-0">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm sm:text-base">{project.projectNumber}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{project.projectName}</p>
                  </div>
                </div>
                <div className="text-left sm:text-right pl-8 sm:pl-0 flex-shrink-0">
                  <p className="font-semibold text-sm sm:text-base">{formatCurrency(project.budgetRevenue)}</p>
                  <p className="text-xs text-muted-foreground">{project.manager}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
