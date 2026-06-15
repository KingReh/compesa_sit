
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Employees
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula TEXT NOT NULL UNIQUE,
  nome_completo TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  especialidade TEXT,
  lotacao TEXT,
  coordenacao TEXT,
  contrato TEXT,
  telefone TEXT,
  escala TEXT,
  status TEXT NOT NULL DEFAULT 'ativo',
  data_admissao DATE,
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read employees" ON public.employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert employees" ON public.employees FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update employees" ON public.employees FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete employees" ON public.employees FOR DELETE TO authenticated USING (true);

CREATE TRIGGER employees_updated_at BEFORE UPDATE ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_employees_lotacao ON public.employees(lotacao);
CREATE INDEX idx_employees_coordenacao ON public.employees(coordenacao);
CREATE INDEX idx_employees_contrato ON public.employees(contrato);
CREATE INDEX idx_employees_status ON public.employees(status);

-- Vacations
CREATE TABLE public.vacations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  dias INT GENERATED ALWAYS AS ((data_fim - data_inicio) + 1) STORED,
  tipo TEXT NOT NULL DEFAULT 'ferias',
  status TEXT NOT NULL DEFAULT 'agendada',
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vacations TO authenticated;
GRANT ALL ON public.vacations TO service_role;
ALTER TABLE public.vacations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read vacations" ON public.vacations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert vacations" ON public.vacations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update vacations" ON public.vacations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete vacations" ON public.vacations FOR DELETE TO authenticated USING (true);

CREATE TRIGGER vacations_updated_at BEFORE UPDATE ON public.vacations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_vacations_employee ON public.vacations(employee_id);
CREATE INDEX idx_vacations_periodo ON public.vacations(data_inicio, data_fim);
