import { z } from 'zod';

/**
 * Schema for AI-generated project summaries
 * Uses Zod for runtime validation and TypeScript type inference
 */

export const ProjectSummarySchema = z.object({
  executiveSummary: z.string().describe('A concise 2-3 sentence overview of the project status'),

  projectStatus: z.object({
    currentPhase: z.string().describe('Current project phase or milestone'),
    completionPercent: z.number().min(0).max(100).describe('Overall project completion percentage'),
    onTrack: z.boolean().describe('Whether the project is on track for completion'),
    keyActivities: z.array(z.string()).max(3).describe('Top 3 recent or ongoing activities'),
  }),

  financialHealth: z.object({
    budgetStatus: z.enum(['under_budget', 'on_budget', 'over_budget']).describe('Current budget performance'),
    gmPerformance: z.enum(['excellent', 'good', 'concerning', 'poor']).describe('Gross margin performance assessment'),
    invoiceProgress: z.enum(['ahead', 'on_track', 'behind']).describe('Invoicing progress relative to work completed'),
    financialSummary: z.string().describe('Brief explanation of financial performance'),
  }),

  risks: z.array(z.object({
    severity: z.enum(['high', 'medium', 'low']),
    category: z.enum(['financial', 'schedule', 'scope', 'resource', 'quality']),
    description: z.string(),
  })).max(5).describe('Identified project risks, ordered by severity'),

  recommendations: z.array(z.object({
    priority: z.enum(['high', 'medium', 'low']),
    action: z.string(),
    rationale: z.string(),
  })).max(5).describe('Actionable recommendations for project improvement'),

  strengths: z.array(z.string()).max(3).describe('Project strengths and positive aspects'),

  nextSteps: z.array(z.string()).max(3).describe('Immediate next steps or upcoming milestones'),
});

export type ProjectSummary = z.infer<typeof ProjectSummarySchema>;

/**
 * Schema for batch project insights (dashboard-level summary)
 */
export const DashboardInsightsSchema = z.object({
  overallHealth: z.enum(['excellent', 'good', 'needs_attention', 'critical']).describe('Portfolio health assessment'),

  keyMetrics: z.object({
    totalProjectsAnalyzed: z.number(),
    projectsAtRisk: z.number(),
    averageHealthScore: z.number().min(0).max(100),
    totalBudgetVariance: z.number().describe('Total budget variance across all projects'),
  }),

  topConcerns: z.array(z.object({
    projectNumber: z.string(),
    projectName: z.string(),
    concern: z.string(),
    severity: z.enum(['high', 'medium', 'low']),
  })).max(5).describe('Projects requiring immediate attention'),

  topPerformers: z.array(z.object({
    projectNumber: z.string(),
    projectName: z.string(),
    reason: z.string(),
  })).max(3).describe('Best performing projects'),

  executiveInsights: z.array(z.string()).max(3).describe('High-level insights for leadership'),

  recommendedActions: z.array(z.object({
    priority: z.enum(['high', 'medium', 'low']),
    action: z.string(),
    impactedProjects: z.array(z.string()).describe('Project numbers affected'),
  })).max(5).describe('Portfolio-level recommended actions'),
});

export type DashboardInsights = z.infer<typeof DashboardInsightsSchema>;
