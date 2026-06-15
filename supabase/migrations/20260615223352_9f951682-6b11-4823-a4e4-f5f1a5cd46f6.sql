
DROP POLICY "Auth insert employees" ON public.employees;
DROP POLICY "Auth update employees" ON public.employees;
DROP POLICY "Auth delete employees" ON public.employees;
DROP POLICY "Auth insert vacations" ON public.vacations;
DROP POLICY "Auth update vacations" ON public.vacations;
DROP POLICY "Auth delete vacations" ON public.vacations;

CREATE POLICY "Auth insert employees" ON public.employees FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth update employees" ON public.employees FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth delete employees" ON public.employees FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth insert vacations" ON public.vacations FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth update vacations" ON public.vacations FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth delete vacations" ON public.vacations FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
