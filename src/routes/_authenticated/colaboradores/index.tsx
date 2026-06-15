import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/colaboradores/")({
  head: () => ({ meta: [{ title: "Colaboradores · SIT" }] }),
  component: ListPage,
});

function ListPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [del, setDel] = useState<{ id: string; nome: string } | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees").select("*").order("nome_completo");
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    if (!q.trim()) return data;
    const s = q.toLowerCase();
    return data.filter((e: any) =>
      [e.nome_completo, e.matricula, e.cpf, e.lotacao, e.coordenacao, e.contrato]
        .filter(Boolean).some((v: string) => v.toLowerCase().includes(s)),
    );
  }, [data, q]);

  async function confirmDelete() {
    if (!del) return;
    const { error } = await supabase.from("employees").delete().eq("id", del.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Colaborador removido");
      qc.invalidateQueries({ queryKey: ["employees"] });
    }
    setDel(null);
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Colaboradores</h1>
          <p className="text-sm text-muted-foreground">
            {data.length} cadastrado{data.length === 1 ? "" : "s"} · gestão completa de terceirizados
          </p>
        </div>
        <Button onClick={() => navigate({ to: "/colaboradores/novo" })}>
          <Plus className="w-4 h-4 mr-2" /> Novo colaborador
        </Button>
      </header>

      <Card className="sit-card-shadow">
        <div className="p-4 border-b">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nome, matrícula, CPF, lotação..."
              className="pl-9" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matrícula</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Especialidade</TableHead>
                <TableHead>Lotação</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead>Escala</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">Carregando...</TableCell></TableRow>
              )}
              {!isLoading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  {data.length === 0 ? "Nenhum colaborador cadastrado." : "Nenhum resultado para a busca."}
                </TableCell></TableRow>
              )}
              {filtered.map((e: any) => (
                <TableRow key={e.id} className="hover:bg-accent/40">
                  <TableCell className="font-mono text-xs">{e.matricula}</TableCell>
                  <TableCell className="font-medium">{e.nome_completo}</TableCell>
                  <TableCell>{e.especialidade || "—"}</TableCell>
                  <TableCell>{e.lotacao || "—"}</TableCell>
                  <TableCell>{e.contrato || "—"}</TableCell>
                  <TableCell>{e.escala || "—"}</TableCell>
                  <TableCell><StatusBadge status={e.status} /></TableCell>
                  <TableCell className="text-right">
                    <Link to="/colaboradores/$id" params={{ id: e.id }}>
                      <Button size="icon" variant="ghost"><Pencil className="w-4 h-4" /></Button>
                    </Link>
                    <Button size="icon" variant="ghost" onClick={() => setDel({ id: e.id, nome: e.nome_completo })}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover colaborador?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{del?.nome}</strong> e todos os registros de férias vinculados serão excluídos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    ativo: { label: "Ativo", cls: "bg-success/15 text-success border-success/30" },
    ferias: { label: "Em férias", cls: "bg-warning/20 text-warning-foreground border-warning/40" },
    afastado: { label: "Afastado", cls: "bg-muted text-muted-foreground" },
    desligado: { label: "Desligado", cls: "bg-destructive/10 text-destructive border-destructive/30" },
  };
  const s = map[status] || { label: status, cls: "bg-muted" };
  return <Badge variant="outline" className={s.cls}>{s.label}</Badge>;
}
