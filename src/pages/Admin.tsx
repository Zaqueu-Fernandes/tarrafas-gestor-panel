import { useEffect, useState } from 'react';
import { useAuth, User } from '@/contexts/AuthContext';
import { supabaseExt } from '@/lib/supabaseExternal';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface Dept { id: string; nome: string; }
interface UserPerms { [userId: string]: string[] }

const Admin = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [depts, setDepts] = useState<Dept[]>([]);
  const [perms, setPerms] = useState<UserPerms>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [newDeptName, setNewDeptName] = useState('');
  const [addingDept, setAddingDept] = useState(false);

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

  const handleAddDept = async () => {
    const nome = newDeptName.trim();
    if (!nome) return;
    setAddingDept(true);
    const { data, error } = await supabaseExt.from('pmt_departamentos').insert({ nome }).select().single();
    if (error) {
      toast({ title: 'Erro ao criar departamento', description: error.message, variant: 'destructive' });
    } else if (data) {
      setDepts([...depts, data as Dept]);
      setNewDeptName('');
      toast({ title: `Departamento "${nome}" criado!` });
    }
    setAddingDept(false);
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
            {/* Add Department Section */}
            <Card className="mb-6 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-[Montserrat]">
                  <i className="fa-solid fa-folder-plus mr-2 text-primary" />
                  Criar Novo Departamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome do departamento"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddDept()}
                    className="max-w-sm"
                  />
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

            {/* Users Table */}
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
    </AppLayout>
  );
};

export default Admin;
