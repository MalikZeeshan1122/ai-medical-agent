import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, TrendingUp, Clock, Zap, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UsageStats {
  totalCalls: number;
  cachedCalls: number;
  failedCalls: number;
  avgResponseTime: number;
  integrationStats: Array<{
    name: string;
    calls: number;
    cached: number;
    avgTime: number;
  }>;
}

export const APIAnalytics = () => {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Calculate date range
      const now = new Date();
      const rangeMap = { '24h': 1, '7d': 7, '30d': 30 };
      const startDate = new Date(now.getTime() - rangeMap[timeRange] * 24 * 60 * 60 * 1000);

      // Fetch usage logs
      const { data: logs, error } = await supabase
        .from('api_usage_logs')
        .select('*, ai_api_integrations(display_name)')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      // Calculate statistics
      const totalCalls = logs?.length || 0;
      const cachedCalls = logs?.filter(l => l.cached).length || 0;
      const failedCalls = logs?.filter(l => l.status_code !== 200).length || 0;
      const avgResponseTime = logs?.reduce((acc, l) => acc + (l.response_time_ms || 0), 0) / (totalCalls || 1);

      // Group by integration
      const integrationMap = new Map<string, { calls: number; cached: number; totalTime: number }>();
      logs?.forEach(log => {
        const name = (log.ai_api_integrations as any)?.display_name || 'Unknown';
        const current = integrationMap.get(name) || { calls: 0, cached: 0, totalTime: 0 };
        integrationMap.set(name, {
          calls: current.calls + 1,
          cached: current.cached + (log.cached ? 1 : 0),
          totalTime: current.totalTime + (log.response_time_ms || 0)
        });
      });

      const integrationStats = Array.from(integrationMap.entries()).map(([name, data]) => ({
        name,
        calls: data.calls,
        cached: data.cached,
        avgTime: Math.round(data.totalTime / data.calls)
      }));

      setStats({
        totalCalls,
        cachedCalls,
        failedCalls,
        avgResponseTime: Math.round(avgResponseTime),
        integrationStats
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error loading analytics",
        description: "Failed to fetch API usage statistics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>API Usage Analytics</CardTitle>
          <CardDescription>Loading statistics...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!stats) return null;

  const cacheHitRate = stats.totalCalls > 0 ? Math.round((stats.cachedCalls / stats.totalCalls) * 100) : 0;
  const successRate = stats.totalCalls > 0 ? Math.round(((stats.totalCalls - stats.failedCalls) / stats.totalCalls) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">API Usage Analytics</h3>
        <div className="flex gap-2">
          {(['24h', '7d', '30d'] as const).map(range => (
            <Badge
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setTimeRange(range)}
            >
              {range === '24h' ? '24 Hours' : range === '7d' ? '7 Days' : '30 Days'}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total API Calls</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCalls}</div>
            <p className="text-xs text-muted-foreground">
              {stats.cachedCalls} from cache
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cacheHitRate}%</div>
            <p className="text-xs text-muted-foreground">
              Saved {stats.cachedCalls} calls
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResponseTime}ms</div>
            <p className="text-xs text-muted-foreground">
              Per API call
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.failedCalls} failed
            </p>
          </CardContent>
        </Card>
      </div>

      {stats.integrationStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usage by Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.integrationStats.map(integration => (
                <div key={integration.name} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{integration.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {integration.calls} calls • {Math.round((integration.cached / integration.calls) * 100)}% cached • {integration.avgTime}ms avg
                    </div>
                  </div>
                  <Badge variant="secondary">{integration.calls}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {stats.failedCalls > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Failed Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {stats.failedCalls} API calls failed in the selected time range. Check your API keys and rate limits.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
