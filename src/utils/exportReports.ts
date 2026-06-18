import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Employee, VacationPlan } from '../types';

export interface ReportExportData {
  selectedYear: number;
  selectedCompanyFilter: string;
  selectedCoordFilter: string;
  filteredEmployees: Employee[];
  vacationPlans: VacationPlan[];
  stats: {
    total: number;
    avgAge: number;
    avgSeniority: number;
    sptPercentage: number;
    uniformReplenishNeeded: number;
    vacationPlanningRate: number;
    malePercentage: number;
    femalePercentage: number;
    uniformShirtStats: Record<string, number>;
    uniformPantsStats: Record<string, number>;
    uniformSptStats: Record<string, number>;
    specialtyStats: Record<string, number>;
    companyStats: Record<string, number>;
    coordinationStats: Record<string, number>;
    planningByMonth: Record<string, number>;
    autorizadoDirigirCount: number;
  };
}

const meses = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function formatDate(d?: string) {
  if (!d) return '';
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString('pt-BR');
  } catch {
    return d;
  }
}

function getTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
}

function buildSheets(data: ReportExportData) {
  const { selectedYear, selectedCompanyFilter, selectedCoordFilter, filteredEmployees, vacationPlans, stats } = data;

  // Resumo
  const resumo: (string | number)[][] = [
    ['Console Geral de Relatórios'],
    ['Gerado em', new Date().toLocaleString('pt-BR')],
    ['Ano', selectedYear],
    ['Empresa (filtro)', selectedCompanyFilter || 'Todas'],
    ['Coordenação (filtro)', selectedCoordFilter || 'Todas'],
    [],
    ['Indicador', 'Valor'],
    ['Total de Funcionários', stats.total],
    ['Idade Média', stats.avgAge],
    ['Tempo Médio de Casa (anos)', stats.avgSeniority],
    ['% com SPT (Calçado Proteção)', `${stats.sptPercentage}%`],
    ['Uniformes Incompletos', stats.uniformReplenishNeeded],
    ['Taxa de Planejamento de Férias', `${stats.vacationPlanningRate}%`],
    ['% Masculino', `${stats.malePercentage}%`],
    ['% Feminino', `${stats.femalePercentage}%`],
    ['Motoristas Autorizados', stats.autorizadoDirigirCount],
    ['Especialidades Distintas', Object.keys(stats.specialtyStats).length],
  ];

  // Funcionários
  const employeesHeader = [
    'Matrícula', 'Nome', 'CPF', 'Sexo', 'Empresa', 'Coordenação', 'Lotação',
    'Especialidade', 'Contrato', 'Escala', 'Telefone', 'Endereço',
    'Data Nascimento', 'Data Admissão', 'Camisa', 'Calça', 'SPT', 'Autorizado a Dirigir'
  ];
  const employeesRows = filteredEmployees.map(e => [
    e.matricula, e.nome, e.cpf, e.sexo, e.empresa, e.coordenacao, e.lotacao,
    e.especialidade, e.contrato, e.escalaTrabalho, e.telefone, e.endereco,
    formatDate(e.dataNascimento), formatDate(e.dataAdmissao),
    e.camisa || '', e.calca || '', e.spt ?? '', e.autorizadoDirigir ? 'Sim' : 'Não'
  ]);

  const toRowsObj = (obj: Record<string, number>, label: string) => {
    const total = Object.values(obj).reduce((a, b) => a + b, 0) || 1;
    return [
      [label, 'Quantidade', '%'],
      ...Object.entries(obj)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => [k, v, `${Math.round((v / total) * 100)}%`])
    ];
  };

  const coordRows = toRowsObj(stats.coordinationStats, 'Coordenação');
  const empresaRows = toRowsObj(stats.companyStats, 'Empresa');
  const especRows = toRowsObj(stats.specialtyStats, 'Especialidade');
  const camisaRows = toRowsObj(stats.uniformShirtStats, 'Tamanho Camisa');
  const calcaRows = toRowsObj(stats.uniformPantsStats, 'Tamanho Calça');
  const sptRows = toRowsObj(stats.uniformSptStats, 'Numeração SPT');

  const feriasRows: (string | number)[][] = [
    ['Mês', 'Funcionários Programados'],
    ...meses.map(m => [m, stats.planningByMonth[m] || 0]),
    ['Total', vacationPlans.filter(p => p.year === selectedYear && p.month && filteredEmployees.some(e => e.id === p.employeeId)).length]
  ];

  return {
    resumo,
    employees: [employeesHeader, ...employeesRows],
    coordenacoes: coordRows,
    empresas: empresaRows,
    especialidades: especRows,
    camisas: camisaRows,
    calcas: calcaRows,
    spt: sptRows,
    ferias: feriasRows,
  };
}

function buildWorkbook(data: ReportExportData) {
  const sheets = buildSheets(data);
  const wb = XLSX.utils.book_new();
  const add = (rows: (string | number)[][], name: string) => {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, name);
  };
  add(sheets.resumo, 'Resumo');
  add(sheets.employees, 'Funcionários');
  add(sheets.coordenacoes, 'Coordenações');
  add(sheets.empresas, 'Empresas');
  add(sheets.especialidades, 'Especialidades');
  add(sheets.camisas, 'Camisas');
  add(sheets.calcas, 'Calças');
  add(sheets.spt, 'SPT');
  add(sheets.ferias, `Férias ${data.selectedYear}`);
  return wb;
}

export function exportReportToXLSX(data: ReportExportData) {
  const wb = buildWorkbook(data);
  XLSX.writeFile(wb, `relatorio_sit_${getTimestamp()}.xlsx`, { bookType: 'xlsx' });
}

export function exportReportToODS(data: ReportExportData) {
  const wb = buildWorkbook(data);
  XLSX.writeFile(wb, `relatorio_sit_${getTimestamp()}.ods`, { bookType: 'ods' });
}

export function exportReportToPDF(data: ReportExportData) {
  const sheets = buildSheets(data);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Console Geral de Relatórios', pageWidth / 2, 40, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const filterLine = `Ano: ${data.selectedYear}  •  Empresa: ${data.selectedCompanyFilter || 'Todas'}  •  Coordenação: ${data.selectedCoordFilter || 'Todas'}  •  Gerado em ${new Date().toLocaleString('pt-BR')}`;
  doc.text(filterLine, pageWidth / 2, 58, { align: 'center' });

  const themeOpts = {
    theme: 'grid' as const,
    headStyles: { fillColor: [8, 33, 66] as [number, number, number], textColor: 255, fontStyle: 'bold' as const },
    styles: { fontSize: 8, cellPadding: 4 },
    margin: { left: 30, right: 30 },
  };

  const addSection = (title: string, rows: (string | number)[][], opts: { startNewPage?: boolean } = {}) => {
    if (opts.startNewPage) doc.addPage();
    const lastY = (doc as any).lastAutoTable?.finalY ?? 70;
    const startY = opts.startNewPage ? 40 : lastY + 20;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 30, startY);
    autoTable(doc, {
      ...themeOpts,
      startY: startY + 6,
      head: [rows[0].map(String)],
      body: rows.slice(1).map(r => r.map(c => (c === null || c === undefined ? '' : String(c)))),
    });
  };

  // Resumo (KPIs as table)
  autoTable(doc, {
    ...themeOpts,
    startY: 75,
    head: [['Indicador', 'Valor']],
    body: data.stats ? [
      ['Total de Funcionários', String(data.stats.total)],
      ['Idade Média', String(data.stats.avgAge)],
      ['Tempo Médio de Casa (anos)', String(data.stats.avgSeniority)],
      ['% com SPT', `${data.stats.sptPercentage}%`],
      ['Uniformes Incompletos', String(data.stats.uniformReplenishNeeded)],
      ['Taxa de Planejamento de Férias', `${data.stats.vacationPlanningRate}%`],
      ['% Masculino', `${data.stats.malePercentage}%`],
      ['% Feminino', `${data.stats.femalePercentage}%`],
      ['Motoristas Autorizados', String(data.stats.autorizadoDirigirCount)],
      ['Especialidades Distintas', String(Object.keys(data.stats.specialtyStats).length)],
    ] : [],
  });

  addSection('Coordenações', sheets.coordenacoes);
  addSection('Empresas', sheets.empresas);
  addSection('Especialidades', sheets.especialidades);
  addSection(`Férias ${data.selectedYear}`, sheets.ferias, { startNewPage: true });
  addSection('Camisas', sheets.camisas);
  addSection('Calças', sheets.calcas);
  addSection('SPT', sheets.spt);

  // Employees on a new page (large table)
  doc.addPage();
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Funcionários', 30, 40);
  autoTable(doc, {
    ...themeOpts,
    startY: 50,
    styles: { fontSize: 7, cellPadding: 3 },
    head: [['Matrícula', 'Nome', 'Empresa', 'Coordenação', 'Lotação', 'Especialidade', 'Admissão', 'Camisa', 'Calça', 'SPT', 'Dirigir']],
    body: data.filteredEmployees.map(e => [
      e.matricula, e.nome, e.empresa, e.coordenacao, e.lotacao, e.especialidade,
      formatDate(e.dataAdmissao), e.camisa || '', e.calca || '', String(e.spt ?? ''), e.autorizadoDirigir ? 'Sim' : 'Não'
    ]),
  });

  // Footer with page numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 30, doc.internal.pageSize.getHeight() - 20, { align: 'right' });
  }

  doc.save(`relatorio_sit_${getTimestamp()}.pdf`);
}
