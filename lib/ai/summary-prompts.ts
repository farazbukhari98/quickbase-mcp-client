/**
 * AI Summary Prompt Templates
 * System prompts and user message templates for generating structured project summaries
 */

export const PROJECT_SUMMARY_SYSTEM_PROMPT = `You are an expert project management analyst with deep expertise in construction, engineering, and financial analysis. Your role is to analyze project data and provide clear, actionable insights for project managers and executives.

When analyzing projects:
- Focus on concrete data and metrics provided
- Identify patterns in financial performance (budget vs actual, GM performance, invoice progress)
- Highlight risks based on quantitative indicators (cost overruns, low GM, invoice delays)
- Provide specific, actionable recommendations
- Use clear, professional language suitable for executive briefings

For financial health assessment:
- Budget Status: Under budget if actual < 95% of budget, over budget if > 105%, otherwise on budget
- GM Performance: Excellent if GM actual >= GM budget, Good if >= 90%, Concerning if >= 75%, Poor if < 75%
- Invoice Progress: Ahead if invoiced > 110% of cost to date, Behind if < 80%, otherwise on track

For risk identification:
- Financial risk: GM variance, cost overruns, budget exhaustion
- Schedule risk: Low completion % vs high cost burn, invoicing delays
- Scope risk: Significant budget changes, uncommitted vs remaining work

Your summaries should be data-driven, concise, and immediately actionable.`;

export const DASHBOARD_INSIGHTS_SYSTEM_PROMPT = `You are a portfolio management analyst specializing in multi-project oversight for construction and engineering firms. Your role is to provide executive-level insights across an entire portfolio of active projects.

When analyzing portfolios:
- Identify systemic patterns across multiple projects
- Prioritize the highest-impact concerns and opportunities
- Provide strategic recommendations that address root causes
- Highlight both risks and successes
- Focus on portfolio-level metrics and trends

For overall health assessment:
- Excellent: >80% of projects healthy (health score >= 80), no critical financial issues
- Good: >60% of projects healthy, minor concerns contained
- Needs Attention: 40-60% healthy, multiple projects with issues
- Critical: <40% healthy or multiple high-severity financial risks

Your insights should help executives make informed decisions about resource allocation, risk mitigation, and strategic priorities.`;

export interface ProjectData {
  // Project identification
  id: string;
  projectNumber: string;
  projectName: string;
  manager: string;
  status: string;

  // Financial data
  budgetRevenue: number;
  budgetCosts: number;
  gmBudget: number;
  committedCosts: number;
  costToDate: number;
  gmActual: number;
  invoiced: number;

  // Calculated metrics
  healthScore: number;
  completionPercent?: number;

  // Additional context
  site?: string;
  client?: string;
}

export function buildProjectSummaryPrompt(project: ProjectData): string {
  const gmVariance = project.gmActual - project.gmBudget;
  const gmVariancePct = project.gmBudget !== 0
    ? ((gmVariance / project.gmBudget) * 100).toFixed(1)
    : '0';

  const invoiceProgress = project.costToDate !== 0
    ? ((project.invoiced / project.costToDate) * 100).toFixed(1)
    : '0';

  const budgetUtilization = project.budgetCosts !== 0
    ? ((project.costToDate / project.budgetCosts) * 100).toFixed(1)
    : '0';

  const costVariance = project.costToDate - project.committedCosts;
  const costVariancePct = project.committedCosts !== 0
    ? ((costVariance / project.committedCosts) * 100).toFixed(1)
    : '0';

  return `Analyze the following project and provide a comprehensive summary:

PROJECT DETAILS:
- Project Number: ${project.projectNumber}
- Project Name: ${project.projectName}
- Manager: ${project.manager}
- Status: ${project.status}
${project.client ? `- Client: ${project.client}` : ''}
${project.site ? `- Site: ${project.site}` : ''}

FINANCIAL PERFORMANCE:
- Budget Revenue: $${project.budgetRevenue.toLocaleString()}
- Budget Costs: $${project.budgetCosts.toLocaleString()}
- Budgeted GM: $${project.gmBudget.toLocaleString()}
- Actual GM: $${project.gmActual.toLocaleString()} (Variance: $${gmVariance.toLocaleString()} / ${gmVariancePct}%)
- Committed Costs: $${project.committedCosts.toLocaleString()}
- Costs to Date: $${project.costToDate.toLocaleString()} (${budgetUtilization}% of budget)
- Cost Variance: $${costVariance.toLocaleString()} (${costVariancePct}%)
- Total Invoiced: $${project.invoiced.toLocaleString()} (${invoiceProgress}% of costs incurred)

CALCULATED METRICS:
- Overall Health Score: ${project.healthScore}/100
${project.completionPercent !== undefined ? `- Estimated Completion: ${project.completionPercent}%` : ''}

ANALYSIS REQUIRED:
Based on this data, provide:
1. Executive Summary: Brief overview of project health and status
2. Project Status: Current phase assessment, completion estimate, on-track determination, and key activities
3. Financial Health: Budget status, GM performance, invoice progress, and financial summary
4. Risks: Identify up to 5 risks with severity and category
5. Recommendations: Provide up to 5 actionable recommendations with priority and rationale
6. Strengths: List up to 3 positive aspects or strong performance areas
7. Next Steps: Identify up to 3 immediate next steps or upcoming milestones

Focus on concrete insights derived from the financial metrics provided. Be specific and actionable.`;
}

export interface DashboardData {
  totalProjects: number;
  totalBudget: number;
  totalInvoiced: number;
  averageGM: number;
  projects: ProjectData[];
  healthBreakdown: {
    green: number;  // >= 80
    yellow: number; // 60-79
    red: number;    // < 60
  };
}

export function buildDashboardInsightsPrompt(data: DashboardData): string {
  const topProjects = [...data.projects]
    .sort((a, b) => b.budgetRevenue - a.budgetRevenue)
    .slice(0, 5);

  const worstHealth = [...data.projects]
    .sort((a, b) => a.healthScore - b.healthScore)
    .slice(0, 5);

  const bestHealth = [...data.projects]
    .sort((a, b) => b.healthScore - a.healthScore)
    .slice(0, 5);

  const projectsList = topProjects.map(p =>
    `- ${p.projectNumber}: ${p.projectName} (Health: ${p.healthScore}/100, Budget: $${p.budgetRevenue.toLocaleString()}, GM: $${p.gmActual.toLocaleString()})`
  ).join('\n');

  const worstList = worstHealth.map(p =>
    `- ${p.projectNumber}: ${p.projectName} (Health: ${p.healthScore}/100, GM Actual: $${p.gmActual.toLocaleString()} vs Budget: $${p.gmBudget.toLocaleString()})`
  ).join('\n');

  const bestList = bestHealth.map(p =>
    `- ${p.projectNumber}: ${p.projectName} (Health: ${p.healthScore}/100, GM: ${((p.gmActual/p.budgetRevenue)*100).toFixed(1)}%)`
  ).join('\n');

  return `Analyze the following portfolio of active projects and provide executive-level insights:

PORTFOLIO OVERVIEW:
- Total Active Projects: ${data.totalProjects}
- Total Portfolio Budget: $${data.totalBudget.toLocaleString()}
- Total Invoiced: $${data.totalInvoiced.toLocaleString()} (${((data.totalInvoiced/data.totalBudget)*100).toFixed(1)}%)
- Average GM %: ${data.averageGM.toFixed(1)}%

HEALTH DISTRIBUTION:
- Healthy Projects (80-100): ${data.healthBreakdown.green} (${((data.healthBreakdown.green/data.totalProjects)*100).toFixed(1)}%)
- At Risk Projects (60-79): ${data.healthBreakdown.yellow} (${((data.healthBreakdown.yellow/data.totalProjects)*100).toFixed(1)}%)
- Critical Projects (<60): ${data.healthBreakdown.red} (${((data.healthBreakdown.red/data.totalProjects)*100).toFixed(1)}%)

TOP 5 PROJECTS BY BUDGET:
${projectsList}

5 LOWEST HEALTH SCORE PROJECTS:
${worstList}

5 HIGHEST HEALTH SCORE PROJECTS:
${bestList}

ANALYSIS REQUIRED:
Based on this portfolio data, provide:
1. Overall Health: Assess the portfolio as excellent, good, needs_attention, or critical
2. Key Metrics: Total projects analyzed, projects at risk, average health score, total budget variance
3. Top Concerns: Up to 5 projects requiring immediate attention with specific concerns
4. Top Performers: Up to 3 best performing projects with reasons
5. Executive Insights: Up to 3 high-level insights for leadership decision-making
6. Recommended Actions: Up to 5 portfolio-level actions with priority and impacted projects

Focus on patterns, systemic issues, and strategic opportunities. Provide actionable guidance for executive decision-making.`;
}
