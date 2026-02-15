import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import WhatsAppButton from '@/components/WhatsAppButton';

const UnderDevelopment = () => {
  const navigate = useNavigate();
  return (
  <AppLayout>
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <div className="relative mb-8">
        <Settings
          className="animate-[spin_4s_linear_infinite] text-primary/80"
          size={96}
          strokeWidth={1.5}
        />
        <Settings
          className="absolute top-12 left-16 animate-[spin_3s_linear_infinite_reverse] text-primary/50"
          size={48}
          strokeWidth={1.5}
        />
      </div>

      <h3 className="mb-3 text-lg font-semibold font-[Montserrat] text-foreground">
        Esta tela está em desenvolvimento.
      </h3>

      <p className="mb-6 max-w-md text-sm text-muted-foreground">
        Em caso de dúvidas, entre em contato com o desenvolvedor através do WhatsApp abaixo.
      </p>

      <WhatsAppButton />

      <button
        onClick={() => navigate('/boas-vindas')}
        className="mt-4 text-sm font-medium text-primary hover:underline"
      >
        <i className="fa-solid fa-arrow-left mr-1" />Voltar
      </button>
    </div>
  </AppLayout>
  );
};

export default UnderDevelopment;
