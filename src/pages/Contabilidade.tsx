import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabaseExt } from '@/lib/supabaseExternal';
import { supabase } from '@/integrations/supabase/client';
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
import WhatsAppButton from '@/components/WhatsAppButton';
import { Settings } from 'lucide-react';

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

interface DeptTab { id: string; nome: string; slug: string; icon: string | null; ordem: number | null; }

const COLORS = ['#1e40af','#3b82f6','#60a5fa','#93c5fd','#2563eb','#1d4ed8','#1e3a8a','#3730a3','#4f46e5','#6366f1'];

const Contabilidade = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<string>('digitalizacao');
  const [data, setData] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);
  const [dynamicTabs, setDynamicTabs] = useState<DeptTab[]>([]);

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
      // Fetch dynamic tabs for Contabilidade
      const { data: deptData } = await supabaseExt.from('pmt_departamentos').select('id').eq('nome', 'Contabilidade').single();
      if (deptData) {
        const { data: tabs } = await supabase.from('dept_tabs').select('*').eq('dept_id', deptData.id).order('ordem');
        if (tabs) setDynamicTabs(tabs as DeptTab[]);
      }
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

  const cascadeBase = useMemo(() => {
    let f = [...data];
    if (dateFrom) f = f.filter(r => r.data >= dateFrom);
    if (dateTo) f = f.filter(r => r.data <= dateTo);
    if (credor) f = f.filter(r => r.credor?.toLowerCase().includes(credor.toLowerCase()));
    if (docCaixa) f = f.filter(r => r.doc_caixa?.toLowerCase().includes(docCaixa.toLowerCase()));
    if (descricao) f = f.filter(r => r.descricao?.toLowerCase().includes(descricao.toLowerCase()));
    return f;
  }, [data, dateFrom, dateTo, credor, docCaixa, descricao]);

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

    doc.setFontSize(14);
    const title = 'Painel do Gestor - Prefeitura Municipal de Tarrafas-CE';
    doc.text(title, pageW / 2, 13, { align: 'center' });
    doc.setFontSize(9);
    doc.text('Relatório de Digitalização', pageW / 2, 18, { align: 'center' });
    doc.setDrawColor(180);
    doc.line(14, 21, pageW - 14, 21);

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
        if (hookData.section === 'body' && hookData.column.index === 13 && hookData.cell.raw === 'Link') {
          hookData.cell.styles.textColor = [0, 100, 200];
        }
      },
      didDrawCell: (hookData: any) => {
        if (hookData.section === 'body' && hookData.column.index === 13 && hookData.cell.raw === 'Link') {
          const rowIndex = hookData.row.index;
          const url = sorted[rowIndex]?.processo;
          if (url) {
            doc.link(hookData.cell.x, hookData.cell.y, hookData.cell.width, hookData.cell.height, { url });
          }
        }
      },
    });

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

  const isDynamicTab = tab !== 'digitalizacao' && tab !== 'analise';

  return (
    <AppLayout>
      <div className="flex flex-1 min-h-[calc(100vh-8rem)]">
        {/* Sidebar */}
        <aside className="hidden md:flex w-56 flex-shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
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
            {dynamicTabs.map((dt) => (
              <button
                key={dt.id}
                onClick={() => setTab(dt.slug)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${tab === dt.slug ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent/50'}`}
              >
                <i className={dt.icon || 'fa-solid fa-file'} />
                {dt.nome}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {/* Mobile tabs */}
          <div className="flex md:hidden border-b border-border overflow-x-auto">
            <button onClick={() => setTab('digitalizacao')} className={`flex-shrink-0 py-3 px-3 text-sm font-medium ${tab === 'digitalizacao' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
              Digitalização
            </button>
            <button onClick={() => setTab('analise')} className={`flex-shrink-0 py-3 px-3 text-sm font-medium ${tab === 'analise' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
              Análise Financeira
            </button>
            {dynamicTabs.map((dt) => (
              <button key={dt.id} onClick={() => setTab(dt.slug)} className={`flex-shrink-0 py-3 px-3 text-sm font-medium ${tab === dt.slug ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}>
                {dt.nome}
              </button>
            ))}
          </div>

          {isDynamicTab ? (
            /* Dynamic tab — Em Desenvolvimento */
            <div className="flex flex-1 flex-col items-center justify-center py-20 px-4">
              <Settings className="w-16 h-16 text-primary animate-spin mb-6" style={{ animationDuration: '4s' }} />
              <h2 className="text-2xl font-bold font-[Montserrat] text-foreground mb-2">
                {dynamicTabs.find(t => t.slug === tab)?.nome || 'Aba'}
              </h2>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                Esta seção está em desenvolvimento. Em breve estará disponível com todas as funcionalidades.
              </p>
              <WhatsAppButton />
            </div>
          ) : (
            <>
              {/* Filters */}
              <div className="border-b border-border bg-muted/30 px-4 py-3">
                <div className="flex items-center gap-3 mb-3">
                  <Button variant="destructive" size="sm" onClick={clearFilters} className="h-8">
                    <i className="fa-solid fa-eraser mr-1" />Limpar Filtros
                  </Button>
                  <button onClick={() => navigate('/boas-vindas')} className="ml-auto text-xs font-medium text-primary hover:underline">
                    <i className="fa-solid fa-arrow-left mr-1" />Voltar
                  </button>
                </div>
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
                    <Select value={ano} onValueChange={v => { setAno(v === '__all__' ? '' : v); setPage(0); }}>
                      <SelectTrigger className="h-8 w-28 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Todos</SelectItem>
                        {uniqueAnos.map(a => <SelectItem key={a} value={a!}>{a}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Mês</label>
                    <Select value={mes} onValueChange={v => { setMes(v === '__all__' ? '' : v); setPage(0); }}>
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
                      <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Todos">Todos</SelectItem>
                        {uniqueNaturezas.map(n => <SelectItem key={n} value={n!}>{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Tipo</label>
                    <Select value={categoria || '__all__'} onValueChange={v => { setCategoria(v === '__all__' ? '' : v); setPage(0); }}>
                      <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Todos</SelectItem>
                        {uniqueCategorias.map(c => <SelectItem key={c} value={c!}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Unid. Gestora</label>
                    <Select value={unidGestora || '__all__'} onValueChange={v => { setUnidGestora(v === '__all__' ? '' : v); setPage(0); }}>
                      <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Todos</SelectItem>
                        {uniqueUnidGestora.map(u => <SelectItem key={u} value={u!}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Unid. Orçamentária</label>
                    <Select value={unidOrcamentaria || '__all__'} onValueChange={v => { setUnidOrcamentaria(v === '__all__' ? '' : v); setPage(0); }}>
                      <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Todos</SelectItem>
                        {uniqueUnidOrcamentaria.map(u => <SelectItem key={u} value={u!}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Programa</label>
                    <Select value={programa || '__all__'} onValueChange={v => { setPrograma(v === '__all__' ? '' : v); setPage(0); }}>
                      <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Todos</SelectItem>
                        {uniqueProgramas.map(p => <SelectItem key={p} value={p!}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Elemento</label>
                    <Select value={elemento || '__all__'} onValueChange={v => { setElemento(v === '__all__' ? '' : v); setPage(0); }}>
                      <SelectTrigger className="h-8 w-28 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Todos</SelectItem>
                        {uniqueElementos.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Credor</label>
                    <Input placeholder="Buscar..." value={credor} onChange={e => { setCreador(e.target.value); setPage(0); }} className="h-8 w-36 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Doc. Caixa</label>
                    <Input placeholder="Buscar..." value={docCaixa} onChange={e => { setDocCaixa(e.target.value); setPage(0); }} className="h-8 w-28 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Descrição</label>
                    <Input placeholder="Buscar..." value={descricao} onChange={e => { setDescricao(e.target.value); setPage(0); }} className="h-8 w-36 text-xs" />
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-20"><i className="fa-solid fa-spinner fa-spin text-3xl text-primary" /></div>
              ) : tab === 'digitalizacao' ? (
                <div className="p-4">
                  {/* Summary cards */}
                  <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Card className="border-0 shadow"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Receitas</p><p className="text-sm font-bold text-primary">{fmt(totals.receitas)}</p></CardContent></Card>
                    <Card className="border-0 shadow"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Anul. Receitas</p><p className="text-sm font-bold text-orange-600">{fmt(totals.anulacReceitas)}</p></CardContent></Card>
                    <Card className="border-0 shadow"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Despesas</p><p className="text-sm font-bold text-destructive">{fmt(totals.despesas)}</p></CardContent></Card>
                    <Card className="border-0 shadow"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Anul. Despesas</p><p className="text-sm font-bold text-yellow-600">{fmt(totals.anulacDespesas)}</p></CardContent></Card>
                  </div>

                  {/* Export */}
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{sorted.length} registros</span>
                    <Button size="sm" variant="outline" onClick={exportPDF}>
                      <i className="fa-solid fa-file-pdf mr-1" />Exportar PDF
                    </Button>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {([
                            ['data', 'Data'], ['natureza', 'Natureza'], ['tipo', 'Tipo'],
                            ['unid_gestora', 'Unid. Gestora'], ['unid_ocamentaria', 'Unid. Orçam.'],
                            ['programa', 'Programa'], ['elemento', 'Elemento'], ['doc_caixa', 'Doc. Caixa'],
                            ['credor', 'Credor'], ['descricao', 'Descrição'],
                            ['receitas', 'Receitas'], ['anulac_receitas', 'Anul. Rec.'],
                            ['despesas', 'Despesas'], ['anulac_despesa', 'Anul. Desp.'],
                          ] as [keyof Registro, string][]).map(([key, label]) => (
                            <TableHead key={key} className="cursor-pointer whitespace-nowrap text-xs" onClick={() => handleSort(key)}>
                              {label}<SortIcon col={key} />
                            </TableHead>
                          ))}
                          <TableHead className="text-xs">Processo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginated.map((r, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-xs whitespace-nowrap">{r.data}</TableCell>
                            <TableCell className="text-xs">{r.natureza}</TableCell>
                            <TableCell className="text-xs">{r.tipo}</TableCell>
                            <TableCell className="text-xs">{r.unid_gestora}</TableCell>
                            <TableCell className="text-xs">{r.unid_ocamentaria}</TableCell>
                            <TableCell className="text-xs">{r.programa}</TableCell>
                            <TableCell className="text-xs">{r.elemento}</TableCell>
                            <TableCell className="text-xs">{r.doc_caixa}</TableCell>
                            <TableCell className="text-xs">{r.credor}</TableCell>
                            <TableCell className="text-xs max-w-[200px] truncate">{r.descricao}</TableCell>
                            <TableCell className="text-xs text-right">{fmt(r.receitas || 0)}</TableCell>
                            <TableCell className="text-xs text-right">{fmt(r.anulac_receitas || 0)}</TableCell>
                            <TableCell className="text-xs text-right">{fmt(r.despesas || 0)}</TableCell>
                            <TableCell className="text-xs text-right">{fmt(r.anulac_despesa || 0)}</TableCell>
                            <TableCell className="text-xs">
                              {r.processo ? (
                                <a href={r.processo} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                  <i className="fa-solid fa-arrow-up-right-from-square" />
                                </a>
                              ) : '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Anterior</Button>
                      <span className="text-xs text-muted-foreground">{page + 1} / {totalPages}</span>
                      <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Próxima</Button>
                    </div>
                  )}
                </div>
              ) : (
                /* Análise Financeira */
                <div className="p-4 space-y-6">
                  {/* Summary */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Card className="border-0 shadow"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Receitas</p><p className="text-sm font-bold text-primary">{fmt(totals.receitas)}</p></CardContent></Card>
                    <Card className="border-0 shadow"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Anul. Receitas</p><p className="text-sm font-bold text-orange-600">{fmt(totals.anulacReceitas)}</p></CardContent></Card>
                    <Card className="border-0 shadow"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Despesas</p><p className="text-sm font-bold text-destructive">{fmt(totals.despesas)}</p></CardContent></Card>
                    <Card className="border-0 shadow"><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Anul. Despesas</p><p className="text-sm font-bold text-yellow-600">{fmt(totals.anulacDespesas)}</p></CardContent></Card>
                  </div>

                  {/* Charts */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="border-0 shadow">
                      <CardContent className="p-4">
                        <h3 className="mb-3 text-sm font-semibold">Despesas por Unid. Gestora</h3>
                        <ResponsiveContainer width="100%" height={280}>
                          <PieChart>
                            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false} fontSize={9}>
                              {pieData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(v: number) => fmt(v)} />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow">
                      <CardContent className="p-4">
                        <h3 className="mb-3 text-sm font-semibold">Receitas vs Despesas (mensal)</h3>
                        <ResponsiveContainer width="100%" height={280}>
                          <LineChart data={lineData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip formatter={(v: number) => fmt(v)} />
                            <Legend />
                            <Line type="monotone" dataKey="receitas" name="Receitas" stroke="#1e40af" strokeWidth={2} />
                            <Line type="monotone" dataKey="despesas" name="Despesas" stroke="#dc2626" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow">
                      <CardContent className="p-4">
                        <h3 className="mb-3 text-sm font-semibold">Barras – Receitas vs Despesas</h3>
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart data={barData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip formatter={(v: number) => fmt(v)} />
                            <Legend />
                            <Bar dataKey="receitas" name="Receitas" fill="#1e40af" />
                            <Bar dataKey="despesas" name="Despesas" fill="#dc2626" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow">
                      <CardContent className="p-4">
                        <h3 className="mb-3 text-sm font-semibold">Top 10 Credores (Despesas)</h3>
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
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Contabilidade;
