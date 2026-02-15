import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabaseExt } from '@/lib/supabaseExternal';
import { slugify } from '@/lib/slugify';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const DEPT_ICONS: Record<string, string> = {
  'Contabilidade': 'fa-calculator',
  'Licitação e Contratos': 'fa-file-contract',
  'Recursos Humanos': 'fa-users',
  'Jurídico': 'fa-scale-balanced',
  'Contas de Governo e Gestão': 'fa-landmark',
  'Gabinete do Prefeito': 'fa-building-columns',
};

/** Departments that have a dedicated page (not "under development") */
const IMPLEMENTED_ROUTES: Record<string, string> = {
  'Contabilidade': '/contabilidade',
};

interface Dept {
  id: string;
  nome: string;
}

const BoasVindas = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [depts, setDepts] = useState<Dept[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabaseExt
        .from('pmt_usuario_departamentos')
        .select('departamento_id, pmt_departamentos(id, nome)')
        .eq('usuario_id', user.id);
      if (data) {
        const mapped = data.map((d: any) => ({
          id: d.pmt_departamentos.id,
          nome: d.pmt_departamentos.nome,
        }));
        setDepts(mapped);
      }
      setLoading(false);
    })();
  }, [user]);

  const handleDeptClick = (nome: string) => {
    const route = IMPLEMENTED_ROUTES[nome] || `/departamento/${slugify(nome)}`;
    navigate(route);
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold font-[Montserrat] text-foreground">
            Bem-Vindo ao Painel do Gestor
          </h1>
          <p className="mt-1 text-sm text-muted-foreground mx-auto max-w-2xl">
            Plataforma centralizada para acompanhamento e gestão do acervo de documentos digitalizados da administração municipal de Tarrafas-CE
          </p>
          <div className="mt-3 flex items-center justify-center gap-3">
            {user?.role === 'admin' && (
              <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
                <i className="fa-solid fa-gear mr-2" />Admin
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={logout} className="text-destructive">
              <i className="fa-solid fa-right-from-bracket mr-1" />Sair
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <i className="fa-solid fa-spinner fa-spin text-3xl text-primary" />
          </div>
        ) : depts.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">Nenhum departamento vinculado.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {depts.map((d) => (
              <Card
                key={d.id}
                className="relative overflow-hidden transition-all cursor-pointer hover:shadow-lg hover:-translate-y-0.5"
                onClick={() => handleDeptClick(d.nome)}
              >
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <i className={`fa-solid ${DEPT_ICONS[d.nome] || 'fa-folder'} text-xl text-primary`} />
                  </div>
                  <div>
                    <h3 className="font-semibold font-[Montserrat] text-foreground">{d.nome}</h3>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default BoasVindas;
