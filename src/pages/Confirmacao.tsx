import { Link } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import WhatsAppButton from '@/components/WhatsAppButton';

const Confirmacao = () => {
  return (
    <AppLayout>
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="text-center max-w-md space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[hsl(var(--success))]">
            <i className="fa-solid fa-check text-4xl text-white" />
          </div>
          <h1 className="text-2xl font-bold font-[Montserrat] text-foreground">Cadastro Concluído!</h1>
          <p className="text-destructive font-medium">
            Cadastro pendente de aprovação, entre em contato com o suporte para agilizar a liberação
          </p>
          <div className="flex flex-col items-center gap-3">
            <WhatsAppButton />
            <Link to="/login" className="text-sm font-medium text-primary hover:underline">
              Voltar ao Login
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Confirmacao;
