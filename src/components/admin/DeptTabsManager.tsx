import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface Dept { id: string; nome: string; }

interface DeptTab {
  id: string;
  dept_id: string;
  nome: string;
  slug: string;
  icon: string;
  ordem: number;
}

const ICON_OPTIONS = [
  { value: 'fa-solid fa-file', label: 'Arquivo' },
  { value: 'fa-solid fa-table-list', label: 'Tabela' },
  { value: 'fa-solid fa-chart-pie', label: 'Gráfico Pizza' },
  { value: 'fa-solid fa-chart-line', label: 'Gráfico Linha' },
  { value: 'fa-solid fa-chart-bar', label: 'Gráfico Barra' },
  { value: 'fa-solid fa-folder', label: 'Pasta' },
  { value: 'fa-solid fa-calculator', label: 'Calculadora' },
  { value: 'fa-solid fa-money-bill', label: 'Dinheiro' },
  { value: 'fa-solid fa-users', label: 'Pessoas' },
  { value: 'fa-solid fa-gear', label: 'Configuração' },
  { value: 'fa-solid fa-clipboard', label: 'Clipboard' },
  { value: 'fa-solid fa-magnifying-glass', label: 'Pesquisa' },
  { value: 'fa-solid fa-receipt', label: 'Recibo' },
  { value: 'fa-solid fa-file-invoice', label: 'Fatura' },
  { value: 'fa-solid fa-landmark', label: 'Instituição' },
];

const slugify = (text: string) =>
  text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

interface Props {
  depts: Dept[];
}

const DeptTabsManager = ({ depts }: Props) => {
  const { toast } = useToast();
  const [tabs, setTabs] = useState<DeptTab[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState<string>('');

  // Add tab
  const [newTabName, setNewTabName] = useState('');
  const [newTabIcon, setNewTabIcon] = useState('fa-solid fa-file');
  const [adding, setAdding] = useState(false);

  // Edit tab
  const [editTab, setEditTab] = useState<DeptTab | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');

  useEffect(() => {
    fetchTabs();
  }, []);

  const fetchTabs = async () => {
    setLoading(true);
    const { data } = await supabase.from('dept_tabs').select('*').order('ordem');
    if (data) setTabs(data as DeptTab[]);
    setLoading(false);
  };

  const filteredTabs = selectedDept
    ? tabs.filter(t => t.dept_id === selectedDept)
    : tabs;

  const handleAdd = async () => {
    if (!newTabName.trim() || !selectedDept) return;
    setAdding(true);
    const maxOrdem = filteredTabs.reduce((max, t) => Math.max(max, t.ordem), -1);
    const { data, error } = await supabase.from('dept_tabs').insert({
      dept_id: selectedDept,
      nome: newTabName.trim(),
      slug: slugify(newTabName.trim()),
      icon: newTabIcon,
      ordem: maxOrdem + 1,
    }).select().single();

    if (error) {
      toast({ title: 'Erro ao criar aba', description: error.message, variant: 'destructive' });
    } else if (data) {
      setTabs(prev => [...prev, data as DeptTab]);
      setNewTabName('');
      setNewTabIcon('fa-solid fa-file');
      toast({ title: `Aba "${newTabName.trim()}" criada!` });
    }
    setAdding(false);
  };

  const handleDelete = async (tab: DeptTab) => {
    if (!confirm(`Excluir a aba "${tab.nome}"?`)) return;
    await supabase.from('dept_tabs').delete().eq('id', tab.id);
    setTabs(prev => prev.filter(t => t.id !== tab.id));
    toast({ title: `Aba "${tab.nome}" excluída.` });
  };

  const openEdit = (tab: DeptTab) => {
    setEditTab(tab);
    setEditName(tab.nome);
    setEditIcon(tab.icon);
  };

  const handleSaveEdit = async () => {
    if (!editTab || !editName.trim()) return;
    await supabase.from('dept_tabs').update({
      nome: editName.trim(),
      slug: slugify(editName.trim()),
      icon: editIcon,
    }).eq('id', editTab.id);
    setTabs(prev => prev.map(t => t.id === editTab.id ? { ...t, nome: editName.trim(), slug: slugify(editName.trim()), icon: editIcon } : t));
    setEditTab(null);
    toast({ title: 'Aba atualizada!' });
  };

  const deptName = (id: string) => depts.find(d => d.id === id)?.nome || id;

  return (
    <>
      <Card className="mb-6 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-[Montserrat]">
            <i className="fa-solid fa-layer-group mr-2 text-primary" />
            Abas Internas dos Departamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Department selector */}
          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Selecione o Departamento</label>
            <Select value={selectedDept} onValueChange={setSelectedDept}>
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue placeholder="Escolha um departamento..." />
              </SelectTrigger>
              <SelectContent>
                {depts.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedDept && (
            <>
              {/* Add tab form */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end mb-4">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Nome da Aba</label>
                  <Input
                    placeholder="Ex: Digitalização"
                    value={newTabName}
                    onChange={e => setNewTabName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  />
                </div>
                <div className="w-full sm:w-48">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Ícone</label>
                  <Select value={newTabIcon} onValueChange={setNewTabIcon}>
                    <SelectTrigger>
                      <SelectValue>
                        <span className="flex items-center gap-2">
                          <i className={newTabIcon} />
                          {ICON_OPTIONS.find(o => o.value === newTabIcon)?.label}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map(o => (
                        <SelectItem key={o.value} value={o.value}>
                          <span className="flex items-center gap-2">
                            <i className={o.value} />
                            {o.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAdd} disabled={adding || !newTabName.trim()}>
                  {adding ? <i className="fa-solid fa-spinner fa-spin" /> : <><i className="fa-solid fa-plus mr-1" />Adicionar</>}
                </Button>
              </div>

              {/* Tabs list */}
              <div className="divide-y divide-border">
                {loading ? (
                  <div className="flex justify-center py-4">
                    <i className="fa-solid fa-spinner fa-spin text-primary" />
                  </div>
                ) : filteredTabs.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    Nenhuma aba cadastrada para este departamento.
                  </p>
                ) : (
                  filteredTabs.map(tab => (
                    <div key={tab.id} className="flex items-center gap-3 py-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10">
                        <i className={`${tab.icon} text-primary text-sm`} />
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium">{tab.nome}</span>
                        <p className="text-xs text-muted-foreground">slug: {tab.slug} · ordem: {tab.ordem}</p>
                      </div>
                      <button onClick={() => openEdit(tab)} className="text-xs text-primary hover:underline" title="Editar">
                        <i className="fa-solid fa-pen-to-square" />
                      </button>
                      <button onClick={() => handleDelete(tab)} className="text-xs text-destructive hover:underline" title="Excluir">
                        <i className="fa-solid fa-trash" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {!selectedDept && (
            <p className="text-sm text-muted-foreground">Selecione um departamento acima para gerenciar suas abas.</p>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editTab} onOpenChange={open => !open && setEditTab(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-[Montserrat]">Editar Aba</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Nome</label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Ícone</label>
              <Select value={editIcon} onValueChange={setEditIcon}>
                <SelectTrigger>
                  <SelectValue>
                    <span className="flex items-center gap-2">
                      <i className={editIcon} />
                      {ICON_OPTIONS.find(o => o.value === editIcon)?.label || editIcon}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>
                      <span className="flex items-center gap-2">
                        <i className={o.value} />
                        {o.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTab(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={!editName.trim()}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DeptTabsManager;
