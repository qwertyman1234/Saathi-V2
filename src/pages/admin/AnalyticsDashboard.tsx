import { useAdminAnalytics } from "@/hooks/useAdminAnalytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, FileText, TrendingUp, PieChart as PieChartIcon } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";

const COLORS = ["#10b981", "#ef4444", "#f59e0b"];

export default function AnalyticsDashboard() {
  const { data, loading, error } = useAdminAnalytics();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
        <p className="font-semibold">Error loading analytics</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Monitor key metrics and trends</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Users"
          value={data.totalUsers}
          icon={Users}
          description="Registered users"
        />
        <KPICard
          title="Active This Month"
          value={data.activeUsersMonth}
          icon={TrendingUp}
          description="Users logged in last 30 days"
        />
        <KPICard
          title="Total Claims"
          value={data.totalClaims}
          icon={FileText}
          description="All submitted claims"
        />
        <KPICard
          title="Total Revenue"
          value={`₹${(data.totalRevenue / 100000).toFixed(1)}L`}
          icon={TrendingUp}
          description="Premium collected"
        />
      </div>

      {/* Claims Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Claims Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Approved</span>
                <span className="font-semibold text-green-600">{data.claimsApproved}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${(data.claimsApproved / data.totalClaims) * 100}%` }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Pending</span>
                <span className="font-semibold text-amber-600">{data.claimsPending}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-amber-600 h-2 rounded-full"
                  style={{ width: `${(data.claimsPending / data.totalClaims) * 100}%` }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Rejected</span>
                <span className="font-semibold text-red-600">{data.claimsRejected}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full"
                  style={{ width: `${(data.claimsRejected / data.totalClaims) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Claims Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Claims by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Approved", value: data.claimsApproved, fill: "#10b981" },
                    { name: "Rejected", value: data.claimsRejected, fill: "#ef4444" },
                    { name: "Pending", value: data.claimsPending, fill: "#f59e0b" },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                  <Cell fill="#f59e0b" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Plan Popularity */}
        {Object.keys(data.planPopularity).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Plan Popularity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(data.planPopularity)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([planId, count]) => (
                    <div key={planId} className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground truncate">{planId}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* User Signups Trend */}
      {data.monthlySignups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>User Signups (Last 30 Days)</CardTitle>
            <CardDescription>Daily new user registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.monthlySignups}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  style={{ fontSize: "0.875rem" }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis style={{ fontSize: "0.875rem" }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", r: 4 }}
                  name="New Users"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Claims Trend */}
      {data.claimsTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Claims Trend (Last 10 Days)</CardTitle>
            <CardDescription>Claims by status over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.claimsTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  style={{ fontSize: "0.875rem" }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis style={{ fontSize: "0.875rem" }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="approved" stackId="a" fill="#10b981" name="Approved" />
                <Bar dataKey="rejected" stackId="a" fill="#ef4444" name="Rejected" />
                <Bar dataKey="pending" stackId="a" fill="#f59e0b" name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

function KPICard({ title, value, icon: Icon, description }: KPICardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
