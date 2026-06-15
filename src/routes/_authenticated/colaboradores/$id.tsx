import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EmployeeForm } from "@/components/employees/employee-form";

export const Route = createFileRoute("/_authenticated/colaboradores/$id")({
  head: () => ({ meta: [{ title: "Editar colaborador · SIT" }] }),
  component: EditPage,
});

function EditPage() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["employee", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("employees").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });
  if (isLoading) return <div className="p-8 text-muted-foreground">Carregando...</div>;
  if (!data) return <div className="p-8">Colaborador não encontrado.</div>;
  return (
    <EmployeeForm
      id={id}
      defaultValues={{
        matricula: data.matricula ?? "",
        nome_completo: data.nome_completo ?? "",
        cpf: data.cpf ?? "",
        especialidade: data.especialidade ?? "",
        lotacao: data.lotacao ?? "",
        coordenacao: data.coordenacao ?? "",
        contrato: data.contrato ?? "",
        telefone: data.telefone ?? "",
        escala: data.escala ?? "",
        status: data.status ?? "ativo",
        data_admissao: data.data_admissao ?? "",
        observacoes: data.observacoes ?? "",
      }}
    />
  );
}
