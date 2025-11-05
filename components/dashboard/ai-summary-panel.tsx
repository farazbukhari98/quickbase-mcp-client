'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import type { ProjectSummary } from '@/lib/ai/summary-schema';

interface AISummaryPanelProps {
  projectId: string;
  projectNumber: string;
  projectName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AISummaryPanel({
  projectId,
  projectNumber,
  projectName,
  open,
  onOpenChange,
}: AISummaryPanelProps) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<ProjectSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch summary when dialog opens
  useEffect(() => {
    if (open) {
      setSummary(null);
      setError(null);
      fetchSummary();
    }
  }, [open, projectId]);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/summary`);

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      setSummary(data.summary);
      toast.success('AI summary generated');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate summary';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
    }
  };

  const getSeverityIcon = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high': return <AlertCircle className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'low': return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  const getFinancialIcon = (status: string) => {
    if (status.includes('over') || status === 'poor' || status === 'behind') {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <TrendingUp className="h-4 w-4 text-green-500" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            AI Project Summary
            <Badge variant="outline" className="ml-2">{projectNumber}</Badge>
          </DialogTitle>
          <DialogDescription>{projectName}</DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Generating AI summary...</span>
          </div>
        )}

        {error && (
          <Card className="p-6 border-destructive">
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertCircle className="h-5 w-5" />
              <h3 className="font-semibold">Error</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchSummary} variant="outline">
              Try Again
            </Button>
          </Card>
        )}

        {summary && (
          <div className="space-y-6">
            {/* Executive Summary */}
            <Card className="p-6 bg-primary/5 border-primary/20">
              <h3 className="font-semibold text-lg mb-3">Executive Summary</h3>
              <p className="text-sm leading-relaxed">{summary.executiveSummary}</p>
            </Card>

            {/* Project Status */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                Project Status
                {summary.projectStatus.onTrack ? (
                  <Badge variant="default">On Track</Badge>
                ) : (
                  <Badge variant="destructive">At Risk</Badge>
                )}
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Phase:</span>
                  <span className="font-medium">{summary.projectStatus.currentPhase}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completion:</span>
                  <span className="font-medium">{summary.projectStatus.completionPercent}%</span>
                </div>
                {summary.projectStatus.keyActivities.length > 0 && (
                  <div>
                    <p className="text-muted-foreground mb-2">Key Activities:</p>
                    <ul className="space-y-1 ml-4">
                      {summary.projectStatus.keyActivities.map((activity, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                          <span>{activity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>

            {/* Financial Health */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Financial Health</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-secondary/50 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    {getFinancialIcon(summary.financialHealth.budgetStatus)}
                    <span className="text-xs text-muted-foreground">Budget</span>
                  </div>
                  <p className="text-sm font-medium capitalize">
                    {summary.financialHealth.budgetStatus.replace('_', ' ')}
                  </p>
                </div>
                <div className="text-center p-3 bg-secondary/50 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    {getFinancialIcon(summary.financialHealth.gmPerformance)}
                    <span className="text-xs text-muted-foreground">GM</span>
                  </div>
                  <p className="text-sm font-medium capitalize">
                    {summary.financialHealth.gmPerformance}
                  </p>
                </div>
                <div className="text-center p-3 bg-secondary/50 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    {getFinancialIcon(summary.financialHealth.invoiceProgress)}
                    <span className="text-xs text-muted-foreground">Invoicing</span>
                  </div>
                  <p className="text-sm font-medium capitalize">
                    {summary.financialHealth.invoiceProgress}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {summary.financialHealth.financialSummary}
              </p>
            </Card>

            {/* Strengths */}
            {summary.strengths.length > 0 && (
              <Card className="p-6 border-green-500/20 bg-green-500/5">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-5 w-5" />
                  Strengths
                </h3>
                <ul className="space-y-2">
                  {summary.strengths.map((strength, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Risks */}
            {summary.risks.length > 0 && (
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Identified Risks
                </h3>
                <div className="space-y-3">
                  {summary.risks.map((risk, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg">
                      <div className="mt-0.5">{getSeverityIcon(risk.severity)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getSeverityColor(risk.severity)} className="text-xs">
                            {risk.severity}
                          </Badge>
                          <Badge variant="outline" className="text-xs capitalize">
                            {risk.category}
                          </Badge>
                        </div>
                        <p className="text-sm">{risk.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Recommendations */}
            {summary.recommendations.length > 0 && (
              <Card className="p-6 border-blue-500/20 bg-blue-500/5">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <ArrowRight className="h-5 w-5" />
                  Recommendations
                </h3>
                <div className="space-y-3">
                  {summary.recommendations.map((rec, i) => (
                    <div key={i} className="p-3 bg-background rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getSeverityColor(rec.priority)} className="text-xs">
                          {rec.priority} priority
                        </Badge>
                      </div>
                      <p className="text-sm font-medium mb-1">{rec.action}</p>
                      <p className="text-xs text-muted-foreground">{rec.rationale}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Next Steps */}
            {summary.nextSteps.length > 0 && (
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-3">Next Steps</h3>
                <ul className="space-y-2">
                  {summary.nextSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Regenerate button */}
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={fetchSummary} variant="outline" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Regenerate Summary
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
