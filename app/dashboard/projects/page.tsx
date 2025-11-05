'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { useActiveProjects } from '@/hooks/use-dashboard-data';
import { RefreshCw, AlertCircle, Search, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { AISummaryPanel } from '@/components/dashboard/ai-summary-panel';

export default function ProjectsPage() {
  const { data: projects, isLoading, error, refetch, dataUpdatedAt } = useActiveProjects();
  const [searchTerm, setSearchTerm] = useState('');
  const [managerFilter, setManagerFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'budget' | 'health' | 'progress'>('health');
  const [selectedProject, setSelectedProject] = useState<{ id: string; number: string; name: string } | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getHealthBadge = (score: number): 'default' | 'secondary' | 'destructive' => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const handleRefresh = async () => {
    toast.promise(refetch(), {
      loading: 'Refreshing projects...',
      success: 'Projects updated!',
      error: 'Failed to refresh',
    });
  };

  // Get unique managers for filter (exclude empty strings)
  const managers = Array.from(new Set(projects?.map(p => p.manager).filter(m => m && m.trim() !== '') || [])).sort();

  // Filter and sort projects
  const filteredProjects = projects
    ?.filter(p => {
      const matchesSearch = p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.projectNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesManager = managerFilter === 'all' || p.manager === managerFilter;
      return matchesSearch && matchesManager;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.projectName.localeCompare(b.projectName);
        case 'budget':
          return b.budgetRevenue - a.budgetRevenue;
        case 'health':
          return b.healthScore - a.healthScore;
        case 'progress':
          return (b.invoiced / b.budgetRevenue) - (a.invoiced / a.budgetRevenue);
        default:
          return 0;
      }
    }) || [];

  if (error) {
    return (
      <div className="p-4 sm:p-8 flex items-center justify-center min-h-screen">
        <Card className="p-6 max-w-md w-full">
          <div className="flex items-center gap-2 text-destructive mb-4">
            <AlertCircle className="h-5 w-5" />
            <h3 className="font-semibold">Error Loading Projects</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {error instanceof Error ? error.message : 'Failed to load projects'}
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
          <h1 className="text-2xl sm:text-3xl font-bold">Active Projects</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {isLoading ? 'Loading...' : `${filteredProjects.length} projects`}
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

      {/* Filters */}
      <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:gap-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-11"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={managerFilter} onValueChange={setManagerFilter}>
            <SelectTrigger className="w-full sm:w-48 h-11">
              <SelectValue placeholder="Filter by manager" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Managers</SelectItem>
              {managers.map(manager => (
                <SelectItem key={manager} value={manager}>{manager}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-full sm:w-40 h-11">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="health">Health Score</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="budget">Budget</SelectItem>
              <SelectItem value="progress">Progress</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-4 sm:p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card className="p-8 sm:p-12 text-center">
          <p className="text-muted-foreground">No projects found matching your filters</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
              {/* Project Header */}
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2 gap-2">
                  <h3 className="font-semibold text-base sm:text-lg truncate">
                    {project.projectNumber}
                  </h3>
                  <Badge variant={getHealthBadge(project.healthScore)} className="flex-shrink-0">
                    {project.healthScore}/100
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                  {project.projectName}
                </p>
              </div>

              {/* Manager & Status */}
              <div className="mb-4 space-y-1 text-sm">
                <p className="text-muted-foreground">
                  Manager: <span className="text-foreground">{project.manager}</span>
                </p>
                <Badge variant="outline" className="text-xs">
                  {project.status}
                </Badge>
              </div>

              {/* Financial Metrics */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Budget:</span>
                  <span className="font-semibold">{formatCurrency(project.budgetRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoiced:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(project.invoiced)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GM Budget:</span>
                  <span>{formatCurrency(project.gmBudget)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GM Actual:</span>
                  <span className={project.gmActual < project.gmBudget ? 'text-red-600' : 'text-green-600'}>
                    {formatCurrency(project.gmActual)}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">
                    {((project.invoiced / project.budgetRevenue) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${Math.min((project.invoiced / project.budgetRevenue) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <Link href={`/dashboard/projects/${project.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full h-10">
                    View Details
                  </Button>
                </Link>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setSelectedProject({
                    id: project.id,
                    number: project.projectNumber,
                    name: project.projectName
                  })}
                  className="w-full sm:w-auto h-10"
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  AI Summary
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* AI Summary Dialog */}
      {selectedProject && (
        <AISummaryPanel
          projectId={selectedProject.id}
          projectNumber={selectedProject.number}
          projectName={selectedProject.name}
          open={!!selectedProject}
          onOpenChange={(open) => !open && setSelectedProject(null)}
        />
      )}
    </div>
  );
}
