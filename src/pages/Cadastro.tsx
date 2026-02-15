import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import WhatsAppButton from '@/components/WhatsAppButton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const PHONE_REGEX = /^\(88\)\s?9\d{8}$/;

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 3) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
}

const Cadastro = () => {
  const { register, checkEmailExists } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', cargo: '', senha: '' });
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState<string | null>(null);
  const [popupMsg, setPopupMsg] = useState('');
  const [showEmailDup, setShowEmailDup] = useState(false);

  const showPopup = (msg: string) => { setPopupMsg(msg); setPopup('msg'); };

  const handleChange = (field: string, value: string) => {
    if (field === 'telefone') {
      setForm({ ...form, telefone: formatPhone(value) });
    } else {
      setForm({ ...form, [field]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim() || !form.email.trim() || !form.telefone.trim() || !form.cargo.trim() || !form.senha.trim()) {
      showPopup('Preencha todos os campos');
      return;
    }
    if (!PHONE_REGEX.test(form.telefone)) {
      showPopup('Telefone inválido. Formato correto: (88) 9XXXXXXXX — DDD 88 seguido de 9 e mais 8 dígitos.');
      return;
    }

    setLoading(true);
    const emailExists = await checkEmailExists(form.email);
    if (emailExists) {
      setLoading(false);
      setShowEmailDup(true);
      return;
    }

    const res = await register({
      nome: form.nome,
      email: form.email,
      telefone: form.telefone,
      cargo: form.cargo,
      senha: form.senha,
    });
    setLoading(false);

    if (res.success) {
      navigate('/confirmacao');
    } else {
      showPopup(res.error || 'Erro ao cadastrar');
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <i className="fa-solid fa-user-plus text-xl text-primary" />
            </div>
            <CardTitle className="text-xl font-bold font-[Montserrat]">Solicitar Cadastro</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label>Nome Completo</Label>
                <Input placeholder="Nome Completo" value={form.nome} onChange={(e) => handleChange('nome', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>E-mail</Label>
                <Input type="email" placeholder="E-mail" value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Telefone</Label>
                <Input placeholder="(88) 9XXXXXXXX" value={form.telefone} onChange={(e) => handleChange('telefone', e.target.value)} maxLength={15} />
              </div>
              <div className="space-y-1">
                <Label>Cargo ou Função</Label>
                <Input placeholder="Cargo ou Função" value={form.cargo} onChange={(e) => handleChange('cargo', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Senha</Label>
                <Input type="password" placeholder="Senha" value={form.senha} onChange={(e) => handleChange('senha', e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <><i className="fa-solid fa-spinner fa-spin mr-2" />Enviando...</> : 'Solicitar Acesso'}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Já tem conta?{' '}
              <Link to="/login" className="font-medium text-primary hover:underline">Voltar ao Login</Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* General popup */}
      <Dialog open={popup === 'msg'} onOpenChange={() => setPopup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <i className="fa-solid fa-circle-info text-[hsl(var(--warning))]" />
              Atenção
            </DialogTitle>
          </DialogHeader>
          <p>{popupMsg}</p>
          <DialogFooter>
            <Button onClick={() => setPopup(null)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email duplicado */}
      <Dialog open={showEmailDup} onOpenChange={() => setShowEmailDup(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <i className="fa-solid fa-circle-xmark text-destructive" />
              E-mail já cadastrado
            </DialogTitle>
          </DialogHeader>
          <p>O E-mail informado já está sendo usado, entre em contato com o suporte, caso esqueceu seu e-mail ou senha</p>
          <DialogFooter className="flex gap-2">
            <WhatsAppButton />
            <Button variant="outline" asChild>
              <Link to="/login">Voltar ao login</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Cadastro;
