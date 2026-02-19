import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { supabaseExt } from '@/lib/supabaseExternal';
import AppLayout from '@/components/layout/AppLayout';
import UnderDevelopment from '@/components/UnderDevelopment';

interface DeptTab {
  id: string;
  dept_id: string;
  nome: string;
  slug: string;
  icon: string;
  ordem: number;
}

const Departamento = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [tabs, setTabs] = useState<DeptTab[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [deptName, setDeptName] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      // Find department by slug
      const { data: depts } = await supabaseExt.from('pmt_departamentos').select('*');
      const dept = depts?.find((d: any) => {
        const s = d.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        return s === slug;
      });
      if (dept) {
        setDeptName(dept.nome);
        const { data: tabsData } = await supabase.from('dept_tabs').select('*').eq('dept_id', dept.id).order('ordem');
        if (tabsData && tabsData.length > 0) {
          setTabs(tabsData as DeptTab[]);
          setActiveTab(tabsData[0].slug);
        }
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-1 items-center justify-center py-20">
          <i className="fa-solid fa-spinner fa-spin text-3xl text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (tabs.length === 0) {
    return <UnderDevelopment />;
  }

  return (
    <AppLayout>
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden md:flex w-56 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
          <nav className="flex flex-col gap-1 p-3">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.slug)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === tab.slug
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'hover:bg-sidebar-accent/50'
                }`}
              >
                <i className={tab.icon} />
                {tab.nome}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {/* Mobile tabs */}
          <div className="flex md:hidden border-b border-border overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.slug)}
                className={`flex-shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap ${
                  activeTab === tab.slug
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                {tab.nome}
              </button>
            ))}
          </div>

          {/* Tab content - placeholder for now */}
          <div className="p-6">
            <div className="mb-4 flex items-center gap-3">
              <button onClick={() => navigate('/boas-vindas')} className="text-xs font-medium text-primary hover:underline">
                <i className="fa-solid fa-arrow-left mr-1" />Voltar
              </button>
              <h2 className="text-lg font-bold font-[Montserrat]">{deptName} — {tabs.find(t => t.slug === activeTab)?.nome}</h2>
            </div>
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <i className={`${tabs.find(t => t.slug === activeTab)?.icon || 'fa-solid fa-file'} text-4xl mb-3 text-primary/40`} />
              <p className="text-sm">Conteúdo da aba em desenvolvimento.</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Departamento;
