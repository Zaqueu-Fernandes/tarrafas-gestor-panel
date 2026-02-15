import { useParams } from 'react-router-dom';
import UnderDevelopment from '@/components/UnderDevelopment';

const DEPT_NAMES: Record<string, string> = {
  'licitacao': 'Licitação e Contratos',
  'rh': 'Recursos Humanos',
  'juridico': 'Jurídico',
  'contas': 'Contas de Governo e Gestão',
  'gabinete': 'Gabinete do Prefeito',
};

const Departamento = () => {
  const { slug } = useParams<{ slug: string }>();
  const nome = DEPT_NAMES[slug || ''] || slug || 'Departamento';

  return <UnderDevelopment departamento={nome} />;
};

export default Departamento;
