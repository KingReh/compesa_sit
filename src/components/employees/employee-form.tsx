import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ESCALAS, STATUS_COLABORADOR } from "@/lib/constants";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const schema = z.object({
  matricula: z.string().trim().min(1, "Matrícula obrigatória").max(30),
  nome_completo: z.string().trim().min(3, "Informe o nome completo").max(150),
  cpf: z.string().trim().min(11, "CPF inválido").max(14),
  especialidade: z.string().trim().max(100).optional().or(z.literal("")),
  lotacao: z.string().trim().max(100).optional().or(z.literal("")),
  coordenacao: z.string().trim().max(100).optional().or(z.literal("")),
  contrato: z.string().trim().max(100).optional().or(z.literal("")),
  telefone: z.string().trim().max(20).optional().or(z.literal("")),
  escala: z.string().optional().or(z.literal("")),
  status: z.string().min(1),
  data_admissao: z.string().optional().or(z.literal("")),
  observacoes: z.string().max(1000).optional().or(z.literal("")),
});

export type EmployeeFormValues = z.infer<typeof schema>;

export function EmployeeForm({
  defaultValues, id,
}: { defaultValues?: Partial<EmployeeFormValues>; id?: string }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: "ativo",
      ...defaultValues,
    },
  });

  async function onSubmit(values: EmployeeFormValues) {
    const payload = Object.fromEntries(
      Object.entries(values).map(([k, v]) => [k, v === "" ? null : v]),
    );
    const op = id
      ? supabase.from("employees").update(payload).eq("id", id)
      : supabase.from("employees").insert(payload);
    const { error } = await op;
    if (error) return toast.error(error.message);
    toast.success(id ? "Colaborador atualizado" : "Colaborador cadastrado");
    qc.invalidateQueries({ queryKey: ["employees"] });
    qc.invalidateQueries({ queryKey: ["employees-all"] });
    navigate({ to: "/colaboradores" });
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <button onClick={() => navigate({ to: "/colaboradores" })}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <h1 className="text-2xl font-bold tracking-tight">
          {id ? "Editar colaborador" : "Novo colaborador"}
        </h1>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="p-6 sit-card-shadow space-y-5">
          <SectionTitle>Identificação</SectionTitle>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Matrícula *" error={form.formState.errors.matricula?.message}>
              <Input {...form.register("matricula")} />
            </Field>
            <Field label="CPF *" error={form.formState.errors.cpf?.message}>
              <Input {...form.register("cpf")} placeholder="000.000.000-00" />
            </Field>
            <Field label="Nome completo *" error={form.formState.errors.nome_completo?.message} className="md:col-span-2">
              <Input {...form.register("nome_completo")} />
            </Field>
            <Field label="Telefone">
              <Input {...form.register("telefone")} placeholder="(81) 0 0000-0000" />
            </Field>
            <Field label="Data de admissão">
              <Input type="date" {...form.register("data_admissao")} />
            </Field>
          </div>

          <SectionTitle>Atribuição</SectionTitle>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Especialidade">
              <Input {...form.register("especialidade")} placeholder="Ex: Eletricista, Soldador..." />
            </Field>
            <Field label="Contrato">
              <Input {...form.register("contrato")} placeholder="Empresa contratada / nº contrato" />
            </Field>
            <Field label="Lotação">
              <Input {...form.register("lotacao")} placeholder="Unidade de lotação" />
            </Field>
            <Field label="Coordenação">
              <Input {...form.register("coordenacao")} />
            </Field>
            <Field label="Escala de trabalho">
              <Select
                value={form.watch("escala") || ""}
                onValueChange={(v) => form.setValue("escala", v, { shouldValidate: true })}
              >
                <SelectTrigger><SelectValue placeholder="Selecione a escala" /></SelectTrigger>
                <SelectContent>
                  {ESCALAS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status *">
              <Select
                value={form.watch("status")}
                onValueChange={(v) => form.setValue("status", v, { shouldValidate: true })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_COLABORADOR.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <SectionTitle>Observações</SectionTitle>
          <Field label="Notas adicionais">
            <Textarea rows={3} {...form.register("observacoes")} />
          </Field>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => navigate({ to: "/colaboradores" })}>
              Cancelar
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              <Save className="w-4 h-4 mr-2" />
              {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-2">
      {children}
    </h3>
  );
}

function Field({
  label, error, children, className,
}: { label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className || ""}`}>
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
