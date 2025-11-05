import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { ProjectSummarySchema } from '@/lib/ai/summary-schema';
import { PROJECT_SUMMARY_SYSTEM_PROMPT, buildProjectSummaryPrompt, type ProjectData } from '@/lib/ai/summary-prompts';
import { getServerClient } from '@/lib/quickbase-server';

const PROJECTS_TABLE = 'bthajfmdr';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    // Fetch project data from QuickBase using server client
    const client = getServerClient();
    const result = await client.queryRecords(PROJECTS_TABLE, {
      select: ['3', '6', '12', '37', '54', '15', '8', '352', '353', '374', '376',
               '106', '107', '108', '109', '110', '111', '115', '156', '157', '158'],
      where: `{3.EX.'${projectId}'}`,
    });

    if (!result?.records || result.records.length === 0) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const record = result.records[0];

    // Transform QuickBase record to ProjectData
    const projectData: ProjectData = {
      id: record['3']?.value || projectId,
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
      healthScore: 0, // Will be calculated
      completionPercent: parseFloat(record['353']?.value || '0'),
    };

    // Calculate health score
    projectData.healthScore = calculateHealthScore(projectData);

    // Generate AI summary using Vercel AI SDK
    const { object: summary } = await generateObject({
      model: anthropic('claude-sonnet-4-20250514'),
      schema: ProjectSummarySchema,
      system: PROJECT_SUMMARY_SYSTEM_PROMPT,
      prompt: buildProjectSummaryPrompt(projectData),
      temperature: 0.3,
    });

    return NextResponse.json({
      project: {
        id: projectData.id,
        projectNumber: projectData.projectNumber,
        projectName: projectData.projectName,
      },
      summary,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('AI Summary generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate summary' },
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
