import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, CalendarDays, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { STATUS_FERIAS, TIPO_AUSENCIA } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/ferias")({
  head: () => ({ meta: [{ title: "Férias · SIT" }] }),
  component: VacationsPage,
});

function VacationsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    employee_id: "", data_inicio: "", data_fim: "",
    tipo: "ferias", status: "agendada", observacoes: "",
  });

  const { data: vacations = [], isLoading } = useQuery({
    queryKey: ["vacations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vacations")
        .select("*, employees(nome_completo, matricula)")
        .order("data_inicio", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees").select("id, nome_completo, matricula").order("nome_completo");
      if (error) throw error;
      return data;
    },
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.employee_id) return toast.error("Selecione um colaborador");
    if (!form.data_inicio || !form.data_fim) return toast.error("Datas obrigatórias");
    if (form.data_fim < form.data_inicio) return toast.error("Data final anterior à inicial");
    const { error } = await supabase.from("vacations").insert({
      employee_id: form.employee_id,
      data_inicio: form.data_inicio,
      data_fim: form.data_fim,
      tipo: form.tipo,
      status: form.status,
      observacoes: form.observacoes || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Período registrado");
    qc.invalidateQueries({ queryKey: ["vacations"] });
    qc.invalidateQueries({ queryKey: ["vacations-active"] });
    setOpen(false);
    setForm({ employee_id: "", data_inicio: "", data_fim: "", tipo: "ferias", status: "agendada", observacoes: "" });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("vacations").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Removido"); qc.invalidateQueries({ queryKey: ["vacations"] }); }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Controle de Férias</h1>
          <p className="text-sm text-muted-foreground">Períodos de férias, licenças e abonos.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Registrar período</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar período</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Colaborador</Label>
                <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {employees.map((e: any) =>
                      <SelectItem key={e.id} value={e.id}>{e.nome_completo} ({e.matricula})</SelectItem>,
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Início</Label>
                  <Input type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Fim</Label>
                  <Input type="date" value={form.data_fim} onChange={(e) => setForm({ ...form, data_fim: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIPO_AUSENCIA.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_FERIAS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Observações</Label>
                <Textarea rows={2} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit">Registrar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <Card className="sit-card-shadow overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Colaborador</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Início</TableHead>
              <TableHead>Fim</TableHead>
              <TableHead className="text-right">Dias</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Carregando...</TableCell></TableRow>
            )}
            {!isLoading && vacations.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-50" />
                Nenhum período registrado.
              </TableCell></TableRow>
            )}
            {vacations.map((v: any) => {
              const ativa = v.data_inicio <= today && v.data_fim >= today;
              return (
                <TableRow key={v.id} className={ativa ? "bg-warning/5" : ""}>
                  <TableCell>
                    <div className="font-medium">{v.employees?.nome_completo}</div>
                    <div className="text-xs text-muted-foreground font-mono">{v.employees?.matricula}</div>
                  </TableCell>
                  <TableCell className="capitalize">{v.tipo}</TableCell>
                  <TableCell>{format(parseISO(v.data_inicio), "dd MMM yyyy", { locale: ptBR })}</TableCell>
                  <TableCell>{format(parseISO(v.data_fim), "dd MMM yyyy", { locale: ptBR })}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {differenceInDays(parseISO(v.data_fim), parseISO(v.data_inicio)) + 1}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={ativa ? "bg-warning/20 text-warning-foreground border-warning/40" : ""}>
                      {ativa ? "Em andamento" : STATUS_FERIAS.find((s) => s.value === v.status)?.label || v.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => remove(v.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
