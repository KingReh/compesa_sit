import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Users, UserCheck, CalendarDays, AlertTriangle } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · SIT" }] }),
  component: Dashboard,
});

const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function Dashboard() {
  const { data: employees = [] } = useQuery({
    queryKey: ["employees-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("employees").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: vacations = [] } = useQuery({
    queryKey: ["vacations-active"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vacations").select("*, employees(nome_completo)");
      if (error) throw error;
      return data;
    },
  });

  const total = employees.length;
  const ativos = employees.filter((e: any) => e.status === "ativo").length;
  const today = new Date().toISOString().slice(0, 10);
  const emFerias = vacations.filter((v: any) => v.data_inicio <= today && v.data_fim >= today).length;
  const proximas = vacations.filter((v: any) => v.data_inicio > today).length;

  const byLotacao = countBy(employees, "lotacao");
  const byContrato = countBy(employees, "contrato");
  const byEscala = countBy(employees, "escala");

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão consolidada dos colaboradores terceirizados.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total de colaboradores" value={total} icon={Users} accent="primary" />
        <StatCard title="Ativos" value={ativos} icon={UserCheck} accent="success" />
        <StatCard title="Em férias hoje" value={emFerias} icon={CalendarDays} accent="warning" />
        <StatCard title="Férias agendadas" value={proximas} icon={AlertTriangle} accent="secondary" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6 sit-card-shadow">
          <h3 className="font-semibold mb-1">Colaboradores por lotação</h3>
          <p className="text-xs text-muted-foreground mb-4">Distribuição nas unidades operacionais</p>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={byLotacao} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Bar dataKey="value" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 sit-card-shadow">
          <h3 className="font-semibold mb-1">Por contrato</h3>
          <p className="text-xs text-muted-foreground mb-4">Participação por empresa contratada</p>
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={byContrato} dataKey="value" nameKey="name" outerRadius={90} innerRadius={50}>
                  {byContrato.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 sit-card-shadow lg:col-span-2">
          <h3 className="font-semibold mb-1">Distribuição por escala de trabalho</h3>
          <p className="text-xs text-muted-foreground mb-4">Quantidade de colaboradores por regime de escala</p>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={byEscala} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Bar dataKey="value" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title, value, icon: Icon, accent,
}: { title: string; value: number; icon: React.ComponentType<{ className?: string }>; accent: string }) {
  const accentClass = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning-foreground",
  }[accent] ?? "bg-primary/10 text-primary";
  return (
    <Card className="p-5 sit-card-shadow">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{title}</div>
          <div className="text-3xl font-bold mt-2 tabular-nums">{value}</div>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accentClass}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}

function countBy(arr: any[], key: string) {
  const map = new Map<string, number>();
  for (const it of arr) {
    const k = (it[key] || "Não informado") as string;
    map.set(k, (map.get(k) || 0) + 1);
  }
  return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}
