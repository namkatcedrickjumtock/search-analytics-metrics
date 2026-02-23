// This is a React Server Component — it just shells in the client dashboard.
// All real-time data fetching and computation happens in the client component.
import { MetricsDashboard } from "@/components/dashboard/MetricsDashboard";

export const metadata = {
  title: "Search API Observability — itamba.net",
};

export default function DashboardPage() {
  return <MetricsDashboard />;
}
