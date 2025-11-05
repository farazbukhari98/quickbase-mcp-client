import { useQuery, useQueryClient } from '@tanstack/react-query';
import { QuickBaseClient } from '@/lib/quickbase-client';

const client = new QuickBaseClient();

// Projects table ID
const PROJECTS_TABLE = 'bthajfmdr';
const PROJECT_FINANCIALS_TABLE = 'bthxdetqc';
const INVOICING_TABLE = 'bt4429qk7';
const WORK_REQUESTS_TABLE = 'bubhyb7kn';

export interface Project {
  id: string;
  projectNumber: string;
  projectName: string;
  manager: string;
  site: string;
  status: string;
  budgetRevenue: number;
  budgetCost: number;
  budgetMaterials: number;
  budgetLabor: number;
  invoiced: number;
  invoicedPending: number;
  invoiceCount: number;
  gmBudget: number;
  gmActual: number;
  gmBudgetPercent: number;
  gmActualPercent: number;
  committedCost: number;
  healthScore: number;
}

export interface DashboardStats {
  activeProjects: number;
  totalBudget: number;
  totalInvoiced: number;
  avgGrossMargin: number;
  healthBreakdown: {
    green: number;
    yellow: number;
    red: number;
  };
  lastUpdated: string;
}

// Calculate project health score
function calculateHealthScore(project: any): number {
  let score = 0;

  // GM Performance (40 points)
  if (project.gmActual && project.gmBudget) {
    const gmRatio = project.gmActual / project.gmBudget;
    if (gmRatio >= 1) score += 40;
    else if (gmRatio >= 0.9) score += 35;
    else if (gmRatio >= 0.8) score += 25;
    else score += 15;
  }

  // Cost Utilization (30 points)
  if (project.committedCost && project.budgetCost) {
    const costRatio = project.committedCost / project.budgetCost;
    if (costRatio <= 0.9) score += 30;
    else if (costRatio <= 1.0) score += 25;
    else if (costRatio <= 1.1) score += 15;
    else score += 5;
  }

  // Invoice Status (20 points)
  if (project.invoiced && project.budgetRevenue) {
    const invoiceRatio = project.invoiced / project.budgetRevenue;
    if (invoiceRatio >= 0.8) score += 20;
    else if (invoiceRatio >= 0.5) score += 15;
    else score += 10;
  }

  // Basic completeness (10 points)
  if (project.invoiceCount > 0) score += 10;

  return Math.min(score, 100);
}

// Transform QuickBase record to Project
function transformProject(record: any): Project {
  const budgetRevenue = record['374']?.value || 0;
  const budgetCost = record['376']?.value || 0;
  const invoiced = record['156']?.value || 0;
  const gmBudget = record['110']?.value || 0;
  const gmActual = record['111']?.value || 0;
  const committedCost = record['115']?.value || 0;

  const project = {
    id: record['3']?.value?.toString() || record['6']?.value,
    projectNumber: record['6']?.value || '',
    projectName: record['12']?.value || record['8']?.value || '',
    manager: record['54']?.value || '',
    site: record['15']?.value || '',
    status: record['37']?.value || '',
    budgetRevenue,
    budgetCost,
    budgetMaterials: record['352']?.value || 0,
    budgetLabor: record['353']?.value || 0,
    invoiced,
    invoicedPending: record['157']?.value || 0,
    invoiceCount: record['158']?.value || 0,
    gmBudget,
    gmActual,
    gmBudgetPercent: record['107']?.value || 0,
    gmActualPercent: record['109']?.value || 0,
    committedCost,
    healthScore: 0,
  };

  project.healthScore = calculateHealthScore(project);

  return project;
}

// Fetch active projects
export function useActiveProjects() {
  return useQuery({
    queryKey: ['active-projects'],
    queryFn: async () => {
      const result = await client.queryRecords(PROJECTS_TABLE, {
        select: ['3', '6', '12', '37', '54', '15', '8', '352', '353', '374', '376', '106', '107', '108', '109', '110', '111', '115', '156', '157', '158'],
        where: "{37.EX.'Active'}",
        max_records: 100,
      });

      const projects: Project[] = (result?.records || []).map(transformProject);
      return projects;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Fetch dashboard statistics
export function useDashboardStats() {
  const { data: projects, isLoading, error, refetch, dataUpdatedAt } = useActiveProjects();

  const stats: DashboardStats = {
    activeProjects: projects?.length || 0,
    totalBudget: projects?.reduce((sum, p) => sum + p.budgetRevenue, 0) || 0,
    totalInvoiced: projects?.reduce((sum, p) => sum + p.invoiced, 0) || 0,
    avgGrossMargin: projects?.length
      ? projects.reduce((sum, p) => sum + p.gmBudgetPercent, 0) / projects.length
      : 0,
    healthBreakdown: {
      green: projects?.filter(p => p.healthScore >= 80).length || 0,
      yellow: projects?.filter(p => p.healthScore >= 60 && p.healthScore < 80).length || 0,
      red: projects?.filter(p => p.healthScore < 60).length || 0,
    },
    lastUpdated: new Date(dataUpdatedAt).toISOString(),
  };

  return {
    data: stats,
    isLoading,
    error,
    refetch,
    dataUpdatedAt,
  };
}

// Fetch single project details
export function useProjectDetail(projectNumber: string) {
  return useQuery({
    queryKey: ['project-detail', projectNumber],
    queryFn: async () => {
      const result = await client.queryRecords(PROJECTS_TABLE, {
        select: ['3', '6', '12', '37', '54', '15', '8', '352', '353', '354', '355', '356', '357', '374', '376', '358', '106', '107', '108', '109', '110', '111', '115', '116', '117', '156', '157', '158', '159', '287', '288'],
        where: `{6.EX.'${projectNumber}'}`,
        max_records: 1,
      });

      if (!result?.records || result.records.length === 0) {
        throw new Error('Project not found');
      }

      return transformProject(result.records[0]);
    },
    enabled: !!projectNumber,
    staleTime: 5 * 60 * 1000,
  });
}

// Fetch project financials
export function useProjectFinancials(projectNumber: string) {
  return useQuery({
    queryKey: ['project-financials', projectNumber],
    queryFn: async () => {
      const result = await client.queryRecords(PROJECT_FINANCIALS_TABLE, {
        select: ['3', '6', '38', '41', '107', '111', '131', '129', '132', '34', '1'],
        where: `{6.EX.'${projectNumber}'}`,
        max_records: 20,
        orderBy: [{ field_id: '129', order: 'DESC' }],
      });

      return result?.records || [];
    },
    enabled: !!projectNumber,
    staleTime: 5 * 60 * 1000,
  });
}

// Fetch project invoices
export function useProjectInvoices(projectNumber: string) {
  return useQuery({
    queryKey: ['project-invoices', projectNumber],
    queryFn: async () => {
      const result = await client.queryRecords(INVOICING_TABLE, {
        select: ['3', '11', '15', '16', '6', '12', '13', '7', '9'],
        where: `{15.EX.'${projectNumber}'}`,
        max_records: 20,
        orderBy: [{ field_id: '13', order: 'DESC' }],
      });

      return result?.records || [];
    },
    enabled: !!projectNumber,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook to manually refresh all dashboard data
export function useRefreshDashboard() {
  const queryClient = useQueryClient();

  const refreshAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ['active-projects'] });
    await queryClient.invalidateQueries({ queryKey: ['project-detail'] });
    await queryClient.invalidateQueries({ queryKey: ['project-financials'] });
    await queryClient.invalidateQueries({ queryKey: ['project-invoices'] });
  };

  return { refreshAll };
}
