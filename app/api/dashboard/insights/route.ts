import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { DashboardInsightsSchema } from '@/lib/ai/summary-schema';
import { DASHBOARD_INSIGHTS_SYSTEM_PROMPT, buildDashboardInsightsPrompt, type DashboardData, type ProjectData } from '@/lib/ai/summary-prompts';
import { getServerClient } from '@/lib/quickbase-server';

const PROJECTS_TABLE = 'bthajfmdr';

export async function GET(request: NextRequest) {
  try {
    // Fetch all active projects from QuickBase using server client
    const client = getServerClient();
    const result = await client.queryRecords(PROJECTS_TABLE, {
      select: ['3', '6', '12', '37', '54', '15', '8', '352', '353', '374', '376',
               '106', '107', '108', '109', '110', '111', '115', '156', '157', '158'],
      where: "{37.EX.'Active'}",
      max_records: 100,
    });

    if (!result?.records || result.records.length === 0) {
      return NextResponse.json(
        { error: 'No active projects found' },
        { status: 404 }
      );
    }

    // Transform QuickBase records to ProjectData array
    const projects: ProjectData[] = result.records.map(record => {
      const project: ProjectData = {
        id: record['3']?.value || '',
        projectNumber: record['6']?.value || '',
        projectName: record['12']?.value || '',
        manager: record['54']?.value || '',
        status: record['37']?.value || '',
        site: record['15']?.value || '',
        client: record['8']?.value || '',
        budgetRevenue: parseFloat(record['374']?.value || '0'),
        budgetCosts: parseFloat(record['376']?.value || '0'),
        gmBudget: parseFloat(record['106']?.value || '0'),
        committedCosts: parseFloat(record['108']?.value || '0'),
        costToDate: parseFloat(record['109']?.value || '0'),
        gmActual: parseFloat(record['107']?.value || '0'),
        invoiced: parseFloat(record['156']?.value || '0'),
        healthScore: 0,
        completionPercent: parseFloat(record['353']?.value || '0'),
      };

      project.healthScore = calculateHealthScore(project);
      return project;
    });

    // Calculate dashboard statistics
    const totalBudget = projects.reduce((sum, p) => sum + p.budgetRevenue, 0);
    const totalInvoiced = projects.reduce((sum, p) => sum + p.invoiced, 0);
    const averageGM = projects.reduce((sum, p) => {
      const gmPct = p.budgetRevenue > 0 ? (p.gmActual / p.budgetRevenue) * 100 : 0;
      return sum + gmPct;
    }, 0) / projects.length;

    const healthBreakdown = projects.reduce(
      (acc, p) => {
        if (p.healthScore >= 80) acc.green++;
        else if (p.healthScore >= 60) acc.yellow++;
        else acc.red++;
        return acc;
      },
      { green: 0, yellow: 0, red: 0 }
    );

    const dashboardData: DashboardData = {
      totalProjects: projects.length,
      totalBudget,
      totalInvoiced,
      averageGM,
      projects,
      healthBreakdown,
    };

    // Generate AI insights using Vercel AI SDK
    const { object: insights } = await generateObject({
      model: anthropic('claude-sonnet-4-20250514'),
      schema: DashboardInsightsSchema,
      system: DASHBOARD_INSIGHTS_SYSTEM_PROMPT,
      prompt: buildDashboardInsightsPrompt(dashboardData),
      temperature: 0.3,
    });

    return NextResponse.json({
      insights,
      metadata: {
        totalProjects: projects.length,
        healthBreakdown,
        generatedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Dashboard insights generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate insights' },
      { status: 500 }
    );
  }
}

function calculateHealthScore(project: ProjectData): number {
  let score = 0;

  // GM Performance (40 points)
  if (project.gmActual && project.gmBudget) {
    const gmRatio = project.gmActual / project.gmBudget;
    if (gmRatio >= 1) score += 40;
    else if (gmRatio >= 0.9) score += 35;
    else if (gmRatio >= 0.8) score += 30;
    else if (gmRatio >= 0.7) score += 20;
    else if (gmRatio >= 0.5) score += 10;
  }

  // Cost Utilization (30 points)
  if (project.committedCosts && project.budgetCosts) {
    const costRatio = project.committedCosts / project.budgetCosts;
    if (costRatio <= 0.9) score += 30;
    else if (costRatio <= 1.0) score += 25;
    else if (costRatio <= 1.1) score += 15;
    else if (costRatio <= 1.2) score += 5;
  }

  // Invoice Status (20 points)
  if (project.invoiced && project.budgetRevenue) {
    const invoiceRatio = project.invoiced / project.budgetRevenue;
    if (invoiceRatio >= 0.8) score += 20;
    else if (invoiceRatio >= 0.6) score += 15;
    else if (invoiceRatio >= 0.4) score += 10;
    else if (invoiceRatio >= 0.2) score += 5;
  }

  // Basic activity/completeness (10 points)
  if (project.invoiced > 0) score += 10;

  return Math.min(score, 100);
}
