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

type PopupType = 'empty' | 'wrong' | 'pendente' | null;

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState<PopupType>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !senha.trim()) {
      setPopup('empty');
      return;
    }
    setLoading(true);
    const res = await login(email, senha);
    setLoading(false);
    if (res.success) {
      navigate('/boas-vindas');
    } else if (res.pendente) {
      setPopup('pendente');
    } else {
      setPopup('wrong');
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <i className="fa-solid fa-lock text-2xl text-primary" />
            </div>
            <CardTitle className="text-xl font-bold text-foreground font-[Montserrat]">
              Acesso ao Painel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <div className="relative">
                  <Input
                    id="senha"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPass(!showPass)}
                    tabIndex={-1}
                  >
                    <i className={`fa-solid ${showPass ? 'fa-eye-slash' : 'fa-eye'}`} />
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-2" />
                    Logando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Não tem conta?{' '}
              <Link to="/cadastro" className="font-medium text-primary hover:underline">
                Cadastre-se aqui
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Popup: campos vazios */}
      <Dialog open={popup === 'empty'} onOpenChange={() => setPopup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <i className="fa-solid fa-circle-info text-[hsl(var(--warning))]" />
              Atenção
            </DialogTitle>
          </DialogHeader>
          <p>Preencha todos os campos</p>
          <DialogFooter>
            <Button onClick={() => setPopup(null)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Popup: credenciais erradas */}
      <Dialog open={popup === 'wrong'} onOpenChange={() => setPopup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <i className="fa-solid fa-circle-xmark text-destructive" />
              Erro
            </DialogTitle>
          </DialogHeader>
          <p>E-mail ou Senha Incorretos, entre em contato com o suporte, caso esqueceu seu e-mail ou senha</p>
          <DialogFooter className="flex gap-2">
            <WhatsAppButton />
            <Button variant="outline" onClick={() => setPopup(null)}>Sair</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Popup: cadastro pendente */}
      <Dialog open={popup === 'pendente'} onOpenChange={() => setPopup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <i className="fa-solid fa-clock text-[hsl(var(--warning))]" />
              Cadastro Pendente
            </DialogTitle>
          </DialogHeader>
          <p>Cadastro pendente de aprovação</p>
          <DialogFooter className="flex gap-2">
            <WhatsAppButton />
            <Button variant="outline" onClick={() => setPopup(null)}>Voltar para Login</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Login;
