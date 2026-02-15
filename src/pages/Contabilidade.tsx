import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabaseExt } from '@/lib/supabaseExternal';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Registro {
  data: string;
  natureza: string;
  tipo: string;
  unid_gestora: string;
  unid_ocamentaria: string;
  programa: string;
  elemento: number;
  doc_caixa: string;
  credor: string;
  descricao: string;
  receitas: number;
  anulac_receitas: number;
  despesas: number;
  anulac_despesa: number;
  processo: string;
}

const COLORS = ['#1e40af','#3b82f6','#60a5fa','#93c5fd','#2563eb','#1d4ed8','#1e3a8a','#3730a3','#4f46e5','#6366f1'];

const Contabilidade = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'digitalizacao' | 'analise'>('digitalizacao');
  const [data, setData] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [natureza, setNatureza] = useState('Todos');
  const [categoria, setCategoria] = useState('');
  const [credor, setCreador] = useState('');
  const [docCaixa, setDocCaixa] = useState('');
  const [descricao, setDescricao] = useState('');
  const [ano, setAno] = useState('');
  const [mes, setMes] = useState('');
  const [unidGestora, setUnidGestora] = useState('');
  const [unidOrcamentaria, setUnidOrcamentaria] = useState('');
  const [programa, setPrograma] = useState('');
  const [elemento, setElemento] = useState('');

  // Table
  const [sortCol, setSortCol] = useState<keyof Registro>('data');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: rows } = await supabaseExt.from('pmt_digitalizacao').select('*');
      setData(rows || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    let f = [...data];
    if (dateFrom) f = f.filter(r => r.data >= dateFrom);
    if (dateTo) f = f.filter(r => r.data <= dateTo);
    if (natureza !== 'Todos') f = f.filter(r => r.natureza?.toLowerCase() === natureza.toLowerCase());
    if (categoria) f = f.filter(r => r.tipo?.toLowerCase() === categoria.toLowerCase());
    if (credor) f = f.filter(r => r.credor?.toLowerCase().includes(credor.toLowerCase()));
    if (docCaixa) f = f.filter(r => r.doc_caixa?.toLowerCase().includes(docCaixa.toLowerCase()));
    if (descricao) f = f.filter(r => r.descricao?.toLowerCase().includes(descricao.toLowerCase()));
    if (ano) f = f.filter(r => r.data?.slice(0, 4) === ano);
    if (mes) f = f.filter(r => r.data?.slice(5, 7) === mes);
    if (unidGestora) f = f.filter(r => r.unid_gestora?.toLowerCase() === unidGestora.toLowerCase());
    if (unidOrcamentaria) f = f.filter(r => r.unid_ocamentaria?.toLowerCase() === unidOrcamentaria.toLowerCase());
    if (programa) f = f.filter(r => r.programa?.toLowerCase() === programa.toLowerCase());
    if (elemento) f = f.filter(r => String(r.elemento || '') === elemento);
    return f;
  }, [data, dateFrom, dateTo, natureza, categoria, credor, docCaixa, descricao, ano, mes, unidGestora, unidOrcamentaria, programa, elemento]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = a[sortCol] ?? '';
      const bVal = b[sortCol] ?? '';
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortCol, sortDir]);

  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);

  const totals = useMemo(() => ({
    receitas: filtered.reduce((s, r) => s + (r.receitas || 0), 0),
    anulacReceitas: filtered.reduce((s, r) => s + (r.anulac_receitas || 0), 0),
    despesas: filtered.reduce((s, r) => s + (r.despesas || 0), 0),
    anulacDespesas: filtered.reduce((s, r) => s + (r.anulac_despesa || 0), 0),
  }), [filtered]);

  const clearFilters = () => {
    setDateFrom(''); setDateTo(''); setNatureza('Todos');
    setCategoria(''); setCreador(''); setDocCaixa(''); setDescricao('');
    setAno(''); setMes(''); setUnidGestora(''); setUnidOrcamentaria('');
    setPrograma(''); setElemento('');
    setPage(0);
  };

  const handleSort = (col: keyof Registro) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const SortIcon = ({ col }: { col: keyof Registro }) => {
    if (sortCol !== col) return <i className="fa-solid fa-sort text-muted-foreground/40 ml-1" />;
    return <i className={`fa-solid fa-sort-${sortDir === 'asc' ? 'up' : 'down'} ml-1 text-primary`} />;
  };

  // Cascading filter: each filter's options are derived from data filtered by all OTHER active filters
  const cascadeBase = useMemo(() => {
    // Apply only date/text filters as the base for cascading selects
    let f = [...data];
    if (dateFrom) f = f.filter(r => r.data >= dateFrom);
    if (dateTo) f = f.filter(r => r.data <= dateTo);
    if (credor) f = f.filter(r => r.credor?.toLowerCase().includes(credor.toLowerCase()));
    if (docCaixa) f = f.filter(r => r.doc_caixa?.toLowerCase().includes(docCaixa.toLowerCase()));
    if (descricao) f = f.filter(r => r.descricao?.toLowerCase().includes(descricao.toLowerCase()));
    return f;
  }, [data, dateFrom, dateTo, credor, docCaixa, descricao]);

  // Each cascading unique list filters by all selected values EXCEPT its own
  const cascadeForField = useCallback((excludeField: string) => {
    let f = cascadeBase;
    if (excludeField !== 'ano' && ano) f = f.filter(r => r.data?.slice(0, 4) === ano);
    if (excludeField !== 'mes' && mes) f = f.filter(r => r.data?.slice(5, 7) === mes);
    if (excludeField !== 'natureza' && natureza !== 'Todos') f = f.filter(r => r.natureza?.toLowerCase() === natureza.toLowerCase());
    if (excludeField !== 'categoria' && categoria) f = f.filter(r => r.tipo?.toLowerCase() === categoria.toLowerCase());
    if (excludeField !== 'unidGestora' && unidGestora) f = f.filter(r => r.unid_gestora?.toLowerCase() === unidGestora.toLowerCase());
    if (excludeField !== 'unidOrcamentaria' && unidOrcamentaria) f = f.filter(r => r.unid_ocamentaria?.toLowerCase() === unidOrcamentaria.toLowerCase());
    if (excludeField !== 'programa' && programa) f = f.filter(r => r.programa?.toLowerCase() === programa.toLowerCase());
    if (excludeField !== 'elemento' && elemento) f = f.filter(r => String(r.elemento || '') === elemento);
    return f;
  }, [cascadeBase, ano, mes, natureza, categoria, unidGestora, unidOrcamentaria, programa, elemento]);

  const uniqueAnos = useMemo(() => [...new Set(cascadeForField('ano').map(r => r.data?.slice(0, 4)).filter(Boolean))].sort(), [cascadeForField]);
  const uniqueNaturezas = useMemo(() => [...new Set(cascadeForField('natureza').map(r => r.natureza).filter(Boolean))].sort(), [cascadeForField]);
  const uniqueCategorias = useMemo(() => [...new Set(cascadeForField('categoria').map(r => r.tipo).filter(Boolean))].sort(), [cascadeForField]);
  const uniqueUnidGestora = useMemo(() => [...new Set(cascadeForField('unidGestora').map(r => r.unid_gestora).filter(Boolean))].sort(), [cascadeForField]);
  const uniqueUnidOrcamentaria = useMemo(() => [...new Set(cascadeForField('unidOrcamentaria').map(r => r.unid_ocamentaria).filter(Boolean))].sort(), [cascadeForField]);
  const uniqueProgramas = useMemo(() => [...new Set(cascadeForField('programa').map(r => r.programa).filter(Boolean))].sort(), [cascadeForField]);
  const uniqueElementos = useMemo(() => [...new Set(cascadeForField('elemento').map(r => String(r.elemento)).filter(v => v && v !== 'undefined' && v !== 'null'))].sort(), [cascadeForField]);

  const MESES = [
    { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' }, { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' }, { value: '05', label: 'Maio' }, { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' }, { value: '08', label: 'Agosto' }, { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' }, { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
  ];

  // Charts data
  const pieData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(r => {
      if (r.unid_gestora) {
        map[r.unid_gestora] = (map[r.unid_gestora] || 0) + (r.despesas || 0);
      }
    });
    return Object.entries(map).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const lineData = useMemo(() => {
    const map: Record<string, { receitas: number; despesas: number }> = {};
    filtered.forEach(r => {
      const m = r.data?.slice(0, 7) || 'N/A';
      if (!map[m]) map[m] = { receitas: 0, despesas: 0 };
      map[m].receitas += r.receitas || 0;
      map[m].despesas += r.despesas || 0;
    });
    return Object.entries(map).sort().map(([mes, v]) => ({ mes, ...v }));
  }, [filtered]);

  const barData = useMemo(() => lineData, [lineData]);

  const topCredores = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(r => {
      if (r.credor) map[r.credor] = (map[r.credor] || 0) + (r.despesas || 0);
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const exportPDF = useCallback(() => {
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // Header - centered
    doc.setFontSize(14);
    const title = 'Painel do Gestor - Prefeitura Municipal de Tarrafas-CE';
    doc.text(title, pageW / 2, 13, { align: 'center' });
    doc.setFontSize(9);
    doc.text('Relatório de Digitalização', pageW / 2, 18, { align: 'center' });
    doc.setDrawColor(180);
    doc.line(14, 21, pageW - 14, 21);

    // Filters
    let y = 26;
    const filters = [];
    if (dateFrom) filters.push(`De: ${dateFrom}`);
    if (dateTo) filters.push(`Até: ${dateTo}`);
    if (natureza !== 'Todos') filters.push(`Natureza: ${natureza}`);
    if (categoria) filters.push(`Tipo: ${categoria}`);
    if (credor) filters.push(`Credor: ${credor}`);
    if (ano) filters.push(`Ano: ${ano}`);
    if (mes) filters.push(`Mês: ${mes}`);
    if (unidGestora) filters.push(`Unid. Gestora: ${unidGestora}`);
    if (unidOrcamentaria) filters.push(`Unid. Orçamentária: ${unidOrcamentaria}`);
    if (programa) filters.push(`Programa: ${programa}`);
    if (elemento) filters.push(`Elemento: ${elemento}`);
    if (filters.length) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Filtros aplicados:', 14, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      y += 4;
      doc.text(filters.join(' | '), 14, y);
      y += 3;
      doc.setDrawColor(180);
      doc.line(14, y, pageW - 14, y);
      y += 4;
    }

    // Totals
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Subtotais filtrados:', 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    y += 4;
    doc.text(`Receitas: R$ ${totals.receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 14, y);
    doc.text(`Anul. Receitas: R$ ${totals.anulacReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 85, y);
    doc.text(`Despesas: R$ ${totals.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 160, y);
    doc.text(`Anul. Despesas: R$ ${totals.anulacDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 230, y);
    y += 3;
    doc.setDrawColor(180);
    doc.line(14, y, pageW - 14, y);
    y += 5;

    // Table
    autoTable(doc, {
      startY: y,
      head: [['Data','Natureza','Tipo','Unid. Gestora','Unid. Orçament.','Programa','Elemento','Credor','Descrição','Receitas','Anul. Rec.','Despesas','Anul. Desp.','Processo']],
      body: sorted.map(r => [
        r.data, r.natureza, r.tipo, r.unid_gestora, r.unid_ocamentaria || '', r.programa || '', r.elemento || '',
        r.credor, r.descricao,
        (r.receitas || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        (r.anulac_receitas || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        (r.despesas || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        (r.anulac_despesa || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        r.processo ? 'Link' : '',
      ]),
      styles: { fontSize: 6 },
      headStyles: { fillColor: [30, 64, 175] },
      margin: { bottom: 18 },
      didParseCell: (hookData: any) => {
        // Make "Link" in Processo column blue
        if (hookData.section === 'body' && hookData.column.index === 13 && hookData.cell.raw === 'Link') {
          hookData.cell.styles.textColor = [0, 100, 200];
        }
      },
      didDrawCell: (hookData: any) => {
        // Add link annotation on Processo column
        if (hookData.section === 'body' && hookData.column.index === 13 && hookData.cell.raw === 'Link') {
          const rowIndex = hookData.row.index;
          const url = sorted[rowIndex]?.processo;
          if (url) {
            doc.link(hookData.cell.x, hookData.cell.y, hookData.cell.width, hookData.cell.height, { url });
          }
        }
      },
    });

    // Footer on every page - centered with separator line
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(180);
      doc.line(14, pageH - 12, pageW - 14, pageH - 12);
      doc.setFontSize(7);
      const footerText = 'Copyright © 2026 | Zaqueu Fernandes | Suporte Técnico | WhatsApp: 88 99401-4262';
      doc.text(footerText, pageW / 2, pageH - 7, { align: 'center' });
    }

    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    doc.save(`relatorio-digitalizacao-${dd}-${mm}-${yyyy}.pdf`);
  }, [sorted, totals, dateFrom, dateTo, natureza, categoria, credor, ano, mes]);

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <AppLayout>
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden md:flex w-56 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
          <nav className="flex flex-col gap-1 p-3">
            <button
              onClick={() => setTab('digitalizacao')}
              className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${tab === 'digitalizacao' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent/50'}`}
            >
              <i className="fa-solid fa-table-list" />
              Digitalização
            </button>
            <button
              onClick={() => setTab('analise')}
              className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${tab === 'analise' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent/50'}`}
            >
              <i className="fa-solid fa-chart-pie" />
              Análise Financeira
            </button>
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {/* Mobile tabs */}
          <div className="flex md:hidden border-b border-border">
            <button onClick={() => setTab('digitalizacao')} className={`flex-1 py-3 text-sm font-medium ${tab === 'digitalizacao' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
              Digitalização
            </button>
            <button onClick={() => setTab('analise')} className={`flex-1 py-3 text-sm font-medium ${tab === 'analise' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
              Análise Financeira
            </button>
          </div>

          {/* Filters */}
          <div className="border-b border-border bg-muted/30 px-4 py-3">
            {/* Buttons row above filters */}
            <div className="flex items-center gap-3 mb-3">
              <Button variant="destructive" size="sm" onClick={clearFilters} className="h-8">
                <i className="fa-solid fa-eraser mr-1" />Limpar Filtros
              </Button>
              <button onClick={() => { logout(); navigate('/login'); }} className="ml-auto text-xs font-medium text-destructive hover:underline">
                <i className="fa-solid fa-right-from-bracket mr-1" />Sair
              </button>
            </div>
            {/* Filter fields */}
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Data de</label>
                <Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(0); }} className="h-8 w-36 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Data até</label>
                <Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(0); }} className="h-8 w-36 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Ano</label>
                <Select value={ano || '__all__'} onValueChange={v => { setAno(v === '__all__' ? '' : v); setPage(0); }}>
                  <SelectTrigger className="h-8 w-24 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos</SelectItem>
                    {uniqueAnos.map(a => <SelectItem key={a} value={a!}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Mês</label>
                <Select value={mes || '__all__'} onValueChange={v => { setMes(v === '__all__' ? '' : v); setPage(0); }}>
                  <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos</SelectItem>
                    {MESES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Natureza</label>
                <Select value={natureza} onValueChange={v => { setNatureza(v); setPage(0); }}>
                  <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos">Todos</SelectItem>
                    {uniqueNaturezas.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Tipo</label>
                <Select value={categoria || '__all__'} onValueChange={v => { setCategoria(v === '__all__' ? '' : v); setPage(0); }}>
                  <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos</SelectItem>
                    {uniqueCategorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Unid. Gestora</label>
                <Select value={unidGestora || '__all__'} onValueChange={v => { setUnidGestora(v === '__all__' ? '' : v); setPage(0); }}>
                  <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todas</SelectItem>
                    {uniqueUnidGestora.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Unid. Orçamentária</label>
                <Select value={unidOrcamentaria || '__all__'} onValueChange={v => { setUnidOrcamentaria(v === '__all__' ? '' : v); setPage(0); }}>
                  <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todas</SelectItem>
                    {uniqueUnidOrcamentaria.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Programa</label>
                <Select value={programa || '__all__'} onValueChange={v => { setPrograma(v === '__all__' ? '' : v); setPage(0); }}>
                  <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos</SelectItem>
                    {uniqueProgramas.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Elemento</label>
                <Select value={elemento || '__all__'} onValueChange={v => { setElemento(v === '__all__' ? '' : v); setPage(0); }}>
                  <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos</SelectItem>
                    {uniqueElementos.map(el => <SelectItem key={el} value={el}>{el}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Credor</label>
                <Input placeholder="Credor" value={credor} onChange={e => { setCreador(e.target.value); setPage(0); }} className="h-8 w-36 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Doc. Caixa</label>
                <Input placeholder="Doc. Caixa" value={docCaixa} onChange={e => { setDocCaixa(e.target.value); setPage(0); }} className="h-8 w-28 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Descrição</label>
                <Input placeholder="Descrição" value={descricao} onChange={e => { setDescricao(e.target.value); setPage(0); }} className="h-8 w-36 text-xs" />
              </div>
            </div>
          </div>

          {/* Tab content */}
          <div className="p-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <i className="fa-solid fa-spinner fa-spin text-3xl text-primary" />
                <span className="text-sm text-muted-foreground">Buscando dados na base...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-2">
                <i className="fa-solid fa-database text-3xl text-muted-foreground/40" />
                <span className="text-muted-foreground">Nenhum dado encontrado na base</span>
              </div>
            ) : tab === 'digitalizacao' ? (
              <>
                {/* Totals cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: 'Receitas', value: totals.receitas, icon: 'fa-arrow-trend-up', color: 'text-[hsl(var(--success))]' },
                    { label: 'Anulação Receitas', value: totals.anulacReceitas, icon: 'fa-rotate-left', color: 'text-[hsl(var(--warning))]' },
                    { label: 'Despesas', value: totals.despesas, icon: 'fa-arrow-trend-down', color: 'text-destructive' },
                    { label: 'Anulação Despesas', value: totals.anulacDespesas, icon: 'fa-rotate-left', color: 'text-[hsl(var(--warning))]' },
                  ].map((t, i) => (
                    <Card key={i} className="border-0 shadow">
                      <CardContent className="flex items-center gap-3 p-4">
                        <i className={`fa-solid ${t.icon} text-lg ${t.color}`} />
                        <div>
                          <p className="text-xs text-muted-foreground">{t.label}</p>
                          <p className="text-sm font-bold font-[Montserrat]">{fmt(t.value)}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Export */}
                <div className="mb-3 flex justify-end">
                  <Button size="sm" variant="outline" onClick={exportPDF}>
                    <i className="fa-solid fa-file-pdf mr-2 text-destructive" />Exportar PDF
                  </Button>
                </div>

                {/* Table */}
                <Card className="border-0 shadow overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {([
                            ['data', 'Data'],
                            ['natureza', 'Natureza'],
                            ['tipo', 'Tipo'],
                            ['unid_gestora', 'Unid. Gestora'],
                            ['unid_ocamentaria', 'Unid. Orçament.'],
                            ['programa', 'Programa'],
                            ['elemento', 'Elemento'],
                            ['credor', 'Credor'],
                            ['descricao', 'Descrição'],
                            ['receitas', 'Receitas'],
                            ['anulac_receitas', 'Anul. Rec.'],
                            ['despesas', 'Despesas'],
                            ['anulac_despesa', 'Anul. Desp.'],
                          ] as [keyof Registro, string][]).map(([col, label]) => (
                            <TableHead key={col} className="cursor-pointer select-none whitespace-nowrap" onClick={() => handleSort(col)}>
                              {label}<SortIcon col={col} />
                            </TableHead>
                          ))}
                          <TableHead>Processo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginated.map((r, i) => (
                          <TableRow key={i}>
                            <TableCell className="whitespace-nowrap">{r.data}</TableCell>
                            <TableCell>{r.natureza}</TableCell>
                            <TableCell>{r.tipo}</TableCell>
                            <TableCell>{r.unid_gestora}</TableCell>
                            <TableCell>{r.unid_ocamentaria}</TableCell>
                            <TableCell>{r.programa}</TableCell>
                            <TableCell>{r.elemento}</TableCell>
                            <TableCell>{r.credor}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{r.descricao}</TableCell>
                            <TableCell className="text-right">{fmt(r.receitas || 0)}</TableCell>
                            <TableCell className="text-right">{fmt(r.anulac_receitas || 0)}</TableCell>
                            <TableCell className="text-right">{fmt(r.despesas || 0)}</TableCell>
                            <TableCell className="text-right">{fmt(r.anulac_despesa || 0)}</TableCell>
                            <TableCell>
                              {r.processo ? (
                                <a href={r.processo} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/70">
                                  <i className="fa-solid fa-eye" />
                                </a>
                              ) : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t px-4 py-2 text-sm text-muted-foreground">
                      <span>Página {page + 1} de {totalPages} ({sorted.length} registros)</span>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                          <i className="fa-solid fa-chevron-left" />
                        </Button>
                        <Button size="sm" variant="ghost" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                          <i className="fa-solid fa-chevron-right" />
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              </>
            ) : (
              /* Análise Financeira */
              <>
                <div className="mb-3 flex justify-end">
                  <Button size="sm" variant="outline" onClick={exportPDF}>
                    <i className="fa-solid fa-file-pdf mr-2 text-destructive" />Exportar PDF
                  </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Pie - Despesas por Unidade Gestora */}
                  <Card className="border-0 shadow">
                    <CardContent className="p-4">
                      <h3 className="mb-3 text-sm font-semibold font-[Montserrat]">Despesas por Unidade Gestora</h3>
                      {pieData.length === 0 ? (
                        <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                          Nenhum dado de despesa disponível
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={280}>
                          <PieChart>
                            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                              {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(v: number) => fmt(v)} />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>

                  {/* Line - Evolução Mensal */}
                  <Card className="border-0 shadow">
                    <CardContent className="p-4">
                      <h3 className="mb-3 text-sm font-semibold font-[Montserrat]">Evolução Mensal</h3>
                      <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={lineData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(v: number) => fmt(v)} />
                          <Legend />
                          <Line type="monotone" dataKey="receitas" name="Receitas" stroke="#16a34a" strokeWidth={2} />
                          <Line type="monotone" dataKey="despesas" name="Despesas" stroke="#dc2626" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Bar - Receitas vs Despesas */}
                  <Card className="border-0 shadow">
                    <CardContent className="p-4">
                      <h3 className="mb-3 text-sm font-semibold font-[Montserrat]">Receitas vs Despesas</h3>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={barData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(v: number) => fmt(v)} />
                          <Legend />
                          <Bar dataKey="receitas" name="Receitas" fill="#16a34a" />
                          <Bar dataKey="despesas" name="Despesas" fill="#dc2626" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Horizontal Bar - Top 10 Credores */}
                  <Card className="border-0 shadow">
                    <CardContent className="p-4">
                      <h3 className="mb-3 text-sm font-semibold font-[Montserrat]">Top 10 Credores</h3>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={topCredores} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tick={{ fontSize: 10 }} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={120} />
                          <Tooltip formatter={(v: number) => fmt(v)} />
                          <Bar dataKey="value" name="Despesas" fill="#1e40af" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Contabilidade;
