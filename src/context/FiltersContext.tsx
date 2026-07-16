import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Employee } from '../types';

/**
 * Central de Filtragem Avançada — fonte única da verdade (SSoT)
 * para os filtros do Painel Executivo. Todos os módulos consumidores
 * (EmployeeTable, MapaLotacoesWidget, NotificationCenter, etc.)
 * devem ler estes valores em vez de manter estado local próprio.
 *
 * Os filtros são persistidos em localStorage e restaurados automaticamente
 * entre navegações e sessões.
 */

export interface FiltersState {
  searchQuery: string;
  selectedLotacao: string;
  selectedCoordenacao: string;
  selectedEmpresa: string;
  selectedContrato: string;
}

interface FiltersContextValue extends FiltersState {
  setSearchQuery: (v: string) => void;
  setSelectedLotacao: (v: string) => void;
  setSelectedCoordenacao: (v: string) => void;
  setSelectedEmpresa: (v: string) => void;
  setSelectedContrato: (v: string) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
  /** Aplica todos os filtros ativos sobre uma lista de funcionários. */
  applyFilters: (employees: Employee[]) => Employee[];
}

const STORAGE_KEYS = {
  searchQuery: '@sit:searchQuery',
  selectedLotacao: '@sit:selectedLotacao',
  selectedCoordenacao: '@sit:selectedCoordenacao',
  selectedEmpresa: '@sit:selectedEmpresa',
  selectedContrato: '@sit:selectedContrato',
} as const;

function readLS(key: string): string {
  try {
    return localStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

function writeLS(key: string, value: string) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    /* noop */
  }
}

const FiltersContext = createContext<FiltersContextValue | null>(null);

export function FiltersProvider({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState<string>(() => readLS(STORAGE_KEYS.searchQuery));
  const [selectedLotacao, setSelectedLotacao] = useState<string>(() => readLS(STORAGE_KEYS.selectedLotacao));
  const [selectedCoordenacao, setSelectedCoordenacao] = useState<string>(() => readLS(STORAGE_KEYS.selectedCoordenacao));
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>(() => readLS(STORAGE_KEYS.selectedEmpresa));
  const [selectedContrato, setSelectedContrato] = useState<string>(() => readLS(STORAGE_KEYS.selectedContrato));

  useEffect(() => { writeLS(STORAGE_KEYS.searchQuery, searchQuery); }, [searchQuery]);
  useEffect(() => { writeLS(STORAGE_KEYS.selectedLotacao, selectedLotacao); }, [selectedLotacao]);
  useEffect(() => { writeLS(STORAGE_KEYS.selectedCoordenacao, selectedCoordenacao); }, [selectedCoordenacao]);
  useEffect(() => { writeLS(STORAGE_KEYS.selectedEmpresa, selectedEmpresa); }, [selectedEmpresa]);
  useEffect(() => { writeLS(STORAGE_KEYS.selectedContrato, selectedContrato); }, [selectedContrato]);

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedLotacao('');
    setSelectedCoordenacao('');
    setSelectedEmpresa('');
    setSelectedContrato('');
  }, []);

  const hasActiveFilters = Boolean(
    searchQuery || selectedLotacao || selectedCoordenacao || selectedEmpresa || selectedContrato
  );

  const applyFilters = useCallback(
    (employees: Employee[]) => {
      let result = employees;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        result = result.filter(
          (e) =>
            e.nome.toLowerCase().includes(q) ||
            e.matricula.toLowerCase().includes(q) ||
            (e.cpf || '').toLowerCase().includes(q) ||
            (e.especialidade || '').toLowerCase().includes(q) ||
            (e.coordenacao || '').toLowerCase().includes(q)
        );
      }
      if (selectedLotacao) {
        result = result.filter((e) => (e.lotacao || '').trim() === selectedLotacao);
      }
      if (selectedCoordenacao) {
        result = result.filter((e) => (e.coordenacao || '').trim() === selectedCoordenacao);
      }
      if (selectedEmpresa) {
        result = result.filter((e) => (e.empresa || '').trim() === selectedEmpresa);
      }
      if (selectedContrato) {
        result = result.filter((e) => (e.contrato || '').trim() === selectedContrato);
      }
      return result;
    },
    [searchQuery, selectedLotacao, selectedCoordenacao, selectedEmpresa, selectedContrato]
  );

  const value = useMemo<FiltersContextValue>(
    () => ({
      searchQuery,
      selectedLotacao,
      selectedCoordenacao,
      selectedEmpresa,
      selectedContrato,
      setSearchQuery,
      setSelectedLotacao,
      setSelectedCoordenacao,
      setSelectedEmpresa,
      setSelectedContrato,
      resetFilters,
      hasActiveFilters,
      applyFilters,
    }),
    [
      searchQuery,
      selectedLotacao,
      selectedCoordenacao,
      selectedEmpresa,
      selectedContrato,
      resetFilters,
      hasActiveFilters,
      applyFilters,
    ]
  );

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
}

export function useFilters(): FiltersContextValue {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error('useFilters deve ser usado dentro de FiltersProvider');
  return ctx;
}
