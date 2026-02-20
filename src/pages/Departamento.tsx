import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { supabaseExt } from '@/lib/supabaseExternal';
import { Settings } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import WhatsAppButton from '@/components/WhatsAppButton';
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
      <div className="flex flex-1 min-h-[calc(100vh-8rem)]">
        {/* Sidebar */}
        <aside className="hidden md:flex w-56 flex-shrink-0 flex-col bg-sidebar text-sidebar-foreground sidebar-glow">
          <div className="px-4 pt-4 pb-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">{deptName}</p>
          </div>
          <nav className="flex flex-col gap-0.5 px-3 pb-3">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.slug)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  activeTab === tab.slug
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                    : 'hover:bg-sidebar-accent/40 text-sidebar-foreground/70 hover:text-sidebar-foreground'
                }`}
              >
                <i className={`${tab.icon} w-4 text-center`} />
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

          {/* Tab content */}
          <div className="p-6 md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <button onClick={() => navigate('/boas-vindas')} className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors">
                <i className="fa-solid fa-arrow-left text-xs" />Voltar
              </button>
              <div className="h-4 w-px bg-border" />
              <h2 className="text-lg font-bold font-[Montserrat] text-foreground">{tabs.find(t => t.slug === activeTab)?.nome}</h2>
            </div>
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <div className="relative mb-8 p-6 rounded-full bg-primary/[0.06]">
                <Settings
                  className="animate-[spin_4s_linear_infinite] text-primary/70"
                  size={80}
                  strokeWidth={1.5}
                />
                <Settings
                  className="absolute bottom-4 right-2 animate-[spin_3s_linear_infinite_reverse] text-primary/35"
                  size={36}
                  strokeWidth={1.5}
                />
              </div>
              <h3 className="mb-2 text-lg font-semibold font-[Montserrat] text-foreground">
                Esta aba está em desenvolvimento
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm text-center leading-relaxed">Em breve estará disponível. Em caso de dúvidas, entre em contato com o desenvolvedor.</p>
              <div className="mt-4">
                <WhatsAppButton />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Departamento;
