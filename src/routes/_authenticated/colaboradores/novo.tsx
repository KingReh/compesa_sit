import { createFileRoute } from "@tanstack/react-router";
import { EmployeeForm } from "@/components/employees/employee-form";

export const Route = createFileRoute("/_authenticated/colaboradores/novo")({
  head: () => ({ meta: [{ title: "Novo colaborador · SIT" }] }),
  component: () => <EmployeeForm />,
});
