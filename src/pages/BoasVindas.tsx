import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabaseExt } from '@/lib/supabaseExternal';
import { supabase } from '@/integrations/supabase/client';
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
  const [deptIcons, setDeptIcons] = useState<Record<string, string>>({});
  const [deptDescs, setDeptDescs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [deptRes, iconRes] = await Promise.all([
        supabaseExt
          .from('pmt_usuario_departamentos')
          .select('departamento_id, pmt_departamentos(id, nome)')
          .eq('usuario_id', user.id),
        supabase.from('dept_icons').select('*'),
      ]);
      if (deptRes.data) {
        const mapped = deptRes.data.map((d: any) => ({
          id: d.pmt_departamentos.id,
          nome: d.pmt_departamentos.nome,
        }));
        setDepts(mapped);
      }
      if (iconRes.data) {
        const map: Record<string, string> = {};
        const descMap: Record<string, string> = {};
        iconRes.data.forEach((i: any) => {
          map[i.dept_id] = i.icon_url;
          if (i.description) descMap[i.dept_id] = i.description;
        });
        setDeptIcons(map);
        setDeptDescs(descMap);
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
      <div className="container mx-auto px-4 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-extrabold font-[Montserrat] text-foreground md:text-3xl">
            Bem-Vindo ao Painel do Gestor
          </h1>
          <p className="mt-2 text-sm text-muted-foreground mx-auto max-w-xl leading-relaxed">
            Plataforma centralizada para acompanhamento e gestão do acervo de documentos digitalizados da administração municipal de Tarrafas-CE
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            {user?.role === 'admin' && (
              <Button variant="outline" size="sm" onClick={() => navigate('/admin')} className="shadow-sm">
                <i className="fa-solid fa-gear mr-2" />Admin
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={logout} className="text-destructive hover:text-destructive">
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
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {depts.map((d) => (
              <Card
                key={d.id}
                className="group relative overflow-hidden cursor-pointer bg-card border-none shadow-none transition-all duration-200 hover:-translate-y-1"
                onClick={() => handleDeptClick(d.nome)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                <CardContent className="relative flex items-center gap-4 p-6">
                 <div className="flex shrink-0 items-center justify-center rounded-xl overflow-hidden w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] md:w-[140px] md:h-[140px] lg:w-[160px] lg:h-[160px]">
                    {deptIcons[d.id] ? (
                      <img src={deptIcons[d.id]} alt={d.nome} className="w-full h-full object-contain" />
                    ) : (
                      <i className={`fa-solid ${DEPT_ICONS[d.nome] || 'fa-folder'} text-3xl text-primary`} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold font-[Montserrat] text-foreground group-hover:text-primary transition-colors duration-200">{d.nome}</h3>
                    {deptDescs[d.id] && (
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{deptDescs[d.id]}</p>
                    )}
                  </div>
                  <i className="fa-solid fa-chevron-right text-xs text-muted-foreground/40 ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
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
