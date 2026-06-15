import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/importar")({
  head: () => ({ meta: [{ title: "Importar / Exportar · SIT" }] }),
  component: ImportExportPage,
});

const COLS = [
  "matricula", "nome_completo", "cpf", "especialidade",
  "lotacao", "coordenacao", "contrato", "telefone",
  "escala", "status", "data_admissao", "observacoes",
];

function ImportExportPage() {
  const qc = useQueryClient();
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ ok: number; failed: number; errors: string[] } | null>(null);

  async function exportData() {
    const { data, error } = await supabase.from("employees").select("*").order("nome_completo");
    if (error) return toast.error(error.message);
    const rows = (data || []).map((r: any) => {
      const o: Record<string, any> = {};
      COLS.forEach((c) => (o[c] = r[c] ?? ""));
      return o;
    });
    const ws = XLSX.utils.json_to_sheet(rows, { header: COLS });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Colaboradores");
    XLSX.writeFile(wb, `SIT_colaboradores_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success(`${rows.length} registros exportados`);
  }

  function downloadTemplate() {
    const example = [{
      matricula: "12345", nome_completo: "Maria Silva Santos", cpf: "000.000.000-00",
      especialidade: "Eletricista", lotacao: "ETA Botafogo", coordenacao: "Coord. Norte",
      contrato: "CTR-2025-01", telefone: "(81) 9 0000-0000", escala: "5x2",
      status: "ativo", data_admissao: "2025-01-15", observacoes: "",
    }];
    const ws = XLSX.utils.json_to_sheet(example, { header: COLS });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelo");
    XLSX.writeFile(wb, "SIT_modelo_importacao.xlsx");
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setResult(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
      const errors: string[] = [];
      let ok = 0, failed = 0;
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const payload: any = {};
        for (const c of COLS) {
          const v = r[c];
          payload[c] = v === "" || v == null ? null : String(v).trim();
        }
        payload.status = payload.status || "ativo";
        if (!payload.matricula || !payload.nome_completo || !payload.cpf) {
          failed++; errors.push(`Linha ${i + 2}: matrícula, nome e CPF são obrigatórios`); continue;
        }
        const { error } = await supabase.from("employees")
          .upsert(payload, { onConflict: "matricula" });
        if (error) { failed++; errors.push(`Linha ${i + 2} (${payload.matricula}): ${error.message}`); }
        else ok++;
      }
      setResult({ ok, failed, errors: errors.slice(0, 8) });
      qc.invalidateQueries({ queryKey: ["employees"] });
      qc.invalidateQueries({ queryKey: ["employees-all"] });
      if (ok > 0) toast.success(`${ok} registro(s) importado(s)`);
      if (failed > 0) toast.error(`${failed} falha(s) na importação`);
    } catch (err: any) {
      toast.error("Falha ao processar arquivo: " + err.message);
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Importar / Exportar</h1>
        <p className="text-sm text-muted-foreground">Carga em massa de colaboradores via planilha Excel.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6 sit-card-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-secondary/15 text-secondary flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold">Exportar dados</h2>
              <p className="text-xs text-muted-foreground">Gera planilha .xlsx com todos os colaboradores.</p>
            </div>
          </div>
          <Button onClick={exportData} className="w-full">
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Baixar planilha completa
          </Button>
        </Card>

        <Card className="p-6 sit-card-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold">Importar planilha</h2>
              <p className="text-xs text-muted-foreground">Insere ou atualiza por matrícula.</p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block">
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile}
                disabled={importing} className="hidden" id="file-upload" />
              <Button asChild disabled={importing} className="w-full" variant="default">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  {importing ? "Importando..." : "Selecionar arquivo"}
                </label>
              </Button>
            </label>
            <Button variant="outline" onClick={downloadTemplate} className="w-full">
              Baixar modelo de importação
            </Button>
          </div>
        </Card>
      </div>

      {result && (
        <Card className="p-6 sit-card-shadow">
          <h3 className="font-semibold mb-4">Resultado da importação</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/30">
              <CheckCircle2 className="w-6 h-6 text-success" />
              <div>
                <div className="text-2xl font-bold tabular-nums">{result.ok}</div>
                <div className="text-xs text-muted-foreground">Importados</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <AlertCircle className="w-6 h-6 text-destructive" />
              <div>
                <div className="text-2xl font-bold tabular-nums">{result.failed}</div>
                <div className="text-xs text-muted-foreground">Falharam</div>
              </div>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="text-sm">
              <div className="font-medium mb-2">Erros:</div>
              <ul className="space-y-1 text-xs text-muted-foreground list-disc pl-5">
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
        </Card>
      )}

      <Card className="p-6 bg-accent/40 border-accent">
        <h3 className="font-semibold text-sm mb-2">Colunas esperadas</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Os cabeçalhos devem corresponder exatamente. Apenas <strong>matrícula</strong>,
          <strong> nome_completo</strong> e <strong>cpf</strong> são obrigatórios.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {COLS.map((c) => (
            <code key={c} className="text-[11px] px-2 py-1 rounded bg-background border font-mono">{c}</code>
          ))}
        </div>
      </Card>
    </div>
  );
}
