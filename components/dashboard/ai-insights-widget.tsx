'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { DashboardInsights } from '@/lib/ai/summary-schema';

export function AIInsightsWidget() {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<DashboardInsights | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-fetch insights on component mount
  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/dashboard/insights');

      if (!response.ok) {
        throw new Error('Failed to generate insights');
      }

      const data = await response.json();
      setInsights(data.insights);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate insights';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchInsights();
    toast.success('AI insights refreshed');
  };

  const getSeverityColor = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'default';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">AI Portfolio Insights</h3>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Analyzing portfolio...</span>
        </div>
      )}

      {error && (
        <div className="p-4 border-destructive bg-destructive/10 rounded-lg">
          <div className="flex items-center gap-2 text-destructive mb-2">
            <AlertCircle className="h-4 w-4" />
            <span className="font-semibold text-sm">Error</span>
          </div>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      )}

      {insights && (
        <div className="space-y-4">
          {/* Executive Insights / Key Insights */}
          {insights.executiveInsights.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Key Insights</h4>
              <ul className="space-y-2">
                {insights.executiveInsights.map((insight, i) => (
                  <li key={i} className="text-sm p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Top Concerns */}
          {insights.topConcerns.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                Top Concerns
              </h4>
              <div className="space-y-2">
                {insights.topConcerns.slice(0, 3).map((concern, i) => (
                  <div key={i} className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getSeverityColor(concern.severity)} className="text-xs">
                        {concern.severity}
                      </Badge>
                      <span className="text-xs font-medium">{concern.projectNumber}</span>
                    </div>
                    <p className="text-sm">{concern.concern}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
