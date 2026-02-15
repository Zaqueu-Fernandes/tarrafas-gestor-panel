import { useEffect, useState, useRef } from 'react';
import { useAuth, User } from '@/contexts/AuthContext';
import { supabaseExt } from '@/lib/supabaseExternal';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface Dept { id: string; nome: string; }
interface UserPerms { [userId: string]: string[] }

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

const Admin = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [depts, setDepts] = useState<Dept[]>([]);
  const [perms, setPerms] = useState<UserPerms>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // New dept state
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptIcon, setNewDeptIcon] = useState<File | null>(null);
  const [addingDept, setAddingDept] = useState(false);
  const newIconInputRef = useRef<HTMLInputElement>(null);

  // Edit dept state
  const [editDept, setEditDept] = useState<Dept | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState<File | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const editIconInputRef = useRef<HTMLInputElement>(null);

  // Dept icons mapping (from Lovable Cloud)
  const [deptIcons, setDeptIcons] = useState<Record<string, string>>({});

  const fetchAll = async () => {
    setLoading(true);
    const [uRes, dRes, pRes] = await Promise.all([
      supabaseExt.from('pmt_usuarios').select('*').order('created_at', { ascending: false }),
      supabaseExt.from('pmt_departamentos').select('*').order('nome'),
      supabaseExt.from('pmt_usuario_departamentos').select('*'),
    ]);
    if (uRes.data) setUsers(uRes.data as any);
    if (dRes.data) setDepts(dRes.data as any);
    if (pRes.data) {
      const map: UserPerms = {};
      pRes.data.forEach((p: any) => {
        if (!map[p.usuario_id]) map[p.usuario_id] = [];
        map[p.usuario_id].push(p.departamento_id);
      });
      setPerms(map);
    }
    // Fetch icon mappings from Lovable Cloud
    const { data: icons } = await supabase.from('dept_icons').select('*');
    if (icons) {
      const map: Record<string, string> = {};
      icons.forEach((i: any) => { map[i.dept_id] = i.icon_url; });
      setDeptIcons(map);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleApprove = async (uid: string) => {
    await supabaseExt.from('pmt_usuarios').update({ status: true }).eq('id', uid);
    setUsers(users.map(u => u.id === uid ? { ...u, status: true } : u));
    toast({ title: 'Usuário aprovado!' });
  };

  const togglePerm = (uid: string, deptId: string) => {
    const current = perms[uid] || [];
    const next = current.includes(deptId)
      ? current.filter(d => d !== deptId)
      : [...current, deptId];
    setPerms({ ...perms, [uid]: next });
  };

  const savePerm = async (uid: string) => {
    setSaving(uid);
    await supabaseExt.from('pmt_usuario_departamentos').delete().eq('usuario_id', uid);
    const rows = (perms[uid] || []).map(dId => ({ usuario_id: uid, departamento_id: dId }));
    if (rows.length > 0) {
      await supabaseExt.from('pmt_usuario_departamentos').insert(rows);
    }
    setSaving(null);
    toast({ title: 'Permissões salvas!' });
  };

  /* ── Upload icon helper ── */
  const uploadIcon = async (deptId: string, file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop() || 'png';
    const path = `${deptId}.${ext}`;
    // Remove old icon if exists
    await supabase.storage.from('dept-icons').remove([path]);
    const { error } = await supabase.storage.from('dept-icons').upload(path, file, { upsert: true });
    if (error) {
      toast({ title: 'Erro ao enviar ícone', description: error.message, variant: 'destructive' });
      return null;
    }
    const url = `${SUPABASE_URL}/storage/v1/object/public/dept-icons/${path}`;
    // Save mapping
    await supabase.from('dept_icons').upsert({ dept_id: deptId, icon_url: url });
    return url;
  };

  /* ── Add department ── */
  const handleAddDept = async () => {
    const nome = newDeptName.trim();
    if (!nome) return;
    setAddingDept(true);
    const { data, error } = await supabaseExt.from('pmt_departamentos').insert({ nome }).select().single();
    if (error) {
      toast({ title: 'Erro ao criar departamento', description: error.message, variant: 'destructive' });
    } else if (data) {
      const dept = data as Dept;
      if (newDeptIcon) {
        const url = await uploadIcon(dept.id, newDeptIcon);
        if (url) setDeptIcons(prev => ({ ...prev, [dept.id]: url }));
      }
      setDepts(prev => [...prev, dept].sort((a, b) => a.nome.localeCompare(b.nome)));
      setNewDeptName('');
      setNewDeptIcon(null);
      if (newIconInputRef.current) newIconInputRef.current.value = '';
      toast({ title: `Departamento "${nome}" criado!` });
    }
    setAddingDept(false);
  };

  /* ── Delete department ── */
  const handleDeleteDept = async (dept: Dept) => {
    if (!confirm(`Deseja excluir o departamento "${dept.nome}"? Isso removerá todas as permissões vinculadas.`)) return;
    // Remove permissions first
    await supabaseExt.from('pmt_usuario_departamentos').delete().eq('departamento_id', dept.id);
    await supabaseExt.from('pmt_departamentos').delete().eq('id', dept.id);
    // Remove icon
    await supabase.from('dept_icons').delete().eq('dept_id', dept.id);
    setDepts(prev => prev.filter(d => d.id !== dept.id));
    setDeptIcons(prev => { const n = { ...prev }; delete n[dept.id]; return n; });
    // Clean perms state
    setPerms(prev => {
      const n = { ...prev };
      Object.keys(n).forEach(uid => { n[uid] = n[uid].filter(id => id !== dept.id); });
      return n;
    });
    toast({ title: `Departamento "${dept.nome}" excluído.` });
  };

  /* ── Edit department ── */
  const openEdit = (dept: Dept) => {
    setEditDept(dept);
    setEditName(dept.nome);
    setEditIcon(null);
  };

  const handleSaveEdit = async () => {
    if (!editDept || !editName.trim()) return;
    setSavingEdit(true);
    await supabaseExt.from('pmt_departamentos').update({ nome: editName.trim() }).eq('id', editDept.id);
    if (editIcon) {
      const url = await uploadIcon(editDept.id, editIcon);
      if (url) setDeptIcons(prev => ({ ...prev, [editDept.id]: url }));
    }
    setDepts(prev => prev.map(d => d.id === editDept.id ? { ...d, nome: editName.trim() } : d));
    setSavingEdit(false);
    setEditDept(null);
    toast({ title: 'Departamento atualizado!' });
  };

  if (!user || user.role !== 'admin') {
    return (
      <AppLayout>
        <div className="flex flex-1 items-center justify-center py-20">
          <p className="text-destructive font-medium">Acesso negado.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold font-[Montserrat]">
            <i className="fa-solid fa-shield-halved mr-2 text-primary" />
            Painel Administrativo
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/boas-vindas')}>
              <i className="fa-solid fa-arrow-left mr-1" />Voltar
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} className="text-destructive">
              <i className="fa-solid fa-right-from-bracket mr-1" />Sair
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <i className="fa-solid fa-spinner fa-spin text-3xl text-primary" />
          </div>
        ) : (
          <>
            {/* ── Create Department ── */}
            <Card className="mb-6 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-[Montserrat]">
                  <i className="fa-solid fa-folder-plus mr-2 text-primary" />
                  Criar Novo Departamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Nome</label>
                    <Input
                      placeholder="Nome do departamento"
                      value={newDeptName}
                      onChange={(e) => setNewDeptName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddDept()}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Ícone (imagem)</label>
                    <Input
                      ref={newIconInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => setNewDeptIcon(e.target.files?.[0] || null)}
                    />
                  </div>
                  <Button onClick={handleAddDept} disabled={addingDept || !newDeptName.trim()}>
                    {addingDept ? <i className="fa-solid fa-spinner fa-spin" /> : (
                      <><i className="fa-solid fa-plus mr-1" />Adicionar</>
                    )}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  O novo departamento ficará com a tela "Em desenvolvimento" até ser implementado.
                </p>
              </CardContent>
            </Card>

            {/* ── Departments List ── */}
            <Card className="mb-6 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-[Montserrat]">
                  <i className="fa-solid fa-building mr-2 text-primary" />
                  Departamentos ({depts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border">
                  {depts.map((d) => (
                    <div key={d.id} className="flex items-center gap-3 py-3">
                      {deptIcons[d.id] ? (
                        <img src={deptIcons[d.id]} alt={d.nome} className="h-8 w-8 rounded object-cover" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10">
                          <i className="fa-solid fa-folder text-primary text-sm" />
                        </div>
                      )}
                      <span className="flex-1 text-sm font-medium">{d.nome}</span>
                      <button
                        onClick={() => openEdit(d)}
                        className="text-xs text-primary hover:underline"
                        title="Editar"
                      >
                        <i className="fa-solid fa-pen-to-square" />
                      </button>
                      <button
                        onClick={() => handleDeleteDept(d)}
                        className="text-xs text-destructive hover:underline"
                        title="Excluir"
                      >
                        <i className="fa-solid fa-trash" />
                      </button>
                    </div>
                  ))}
                  {depts.length === 0 && (
                    <p className="py-4 text-center text-sm text-muted-foreground">Nenhum departamento cadastrado.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* ── Users Table ── */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-[Montserrat]">Gerenciar Usuários</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Departamentos</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.nome}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.cargo}</TableCell>
                        <TableCell>
                          {u.status ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-[hsl(var(--success))]">
                              <i className="fa-solid fa-circle-check" /> Ativo
                            </span>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => handleApprove(u.id)}>
                              Aprovar
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {depts.map(d => (
                              <label key={d.id} className="flex items-center gap-1 text-xs cursor-pointer">
                                <Checkbox
                                  checked={(perms[u.id] || []).includes(d.id)}
                                  onCheckedChange={() => togglePerm(u.id, d.id)}
                                />
                                {d.nome}
                              </label>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => savePerm(u.id)}
                            disabled={saving === u.id}
                          >
                            {saving === u.id ? (
                              <i className="fa-solid fa-spinner fa-spin" />
                            ) : (
                              'Salvar Permissões'
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* ── Edit Dialog ── */}
      <Dialog open={!!editDept} onOpenChange={(open) => !open && setEditDept(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-[Montserrat]">Editar Departamento</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Nome</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Ícone (imagem)</label>
              {editDept && deptIcons[editDept.id] && (
                <img src={deptIcons[editDept.id]} alt="Ícone atual" className="mb-2 h-12 w-12 rounded object-cover" />
              )}
              <Input
                ref={editIconInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => setEditIcon(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDept(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={savingEdit || !editName.trim()}>
              {savingEdit ? <i className="fa-solid fa-spinner fa-spin" /> : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Admin;
