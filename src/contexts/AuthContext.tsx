import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabaseExt } from '@/lib/supabaseExternal';

export interface User {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  status: boolean;
  role: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<{ success: boolean; error?: string; pendente?: boolean }>;
  logout: () => void;
  register: (data: { nome: string; email: string; telefone: string; cargo: string; senha: string }) => Promise<{ success: boolean; error?: string }>;
  checkEmailExists: (email: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('pmt_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, senha: string) => {
    const { data, error } = await supabaseExt
      .from('pmt_usuarios')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .eq('senha_hash', senha)
      .maybeSingle();

    if (error) return { success: false, error: 'Erro ao conectar ao servidor' };
    if (!data) return { success: false, error: 'E-mail ou Senha Incorretos, entre em contato com o suporte, caso esqueceu seu e-mail ou senha' };
    if (!data.status) return { success: false, error: 'Cadastro pendente de aprovação', pendente: true };

    const u: User = {
      id: data.id,
      nome: data.nome,
      email: data.email,
      telefone: data.telefone,
      cargo: data.cargo,
      status: data.status,
      role: data.role,
      created_at: data.created_at,
    };
    setUser(u);
    localStorage.setItem('pmt_user', JSON.stringify(u));
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('pmt_user');
  }, []);

  const checkEmailExists = useCallback(async (email: string) => {
    const { data } = await supabaseExt
      .from('pmt_usuarios')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();
    return !!data;
  }, []);

  const register = useCallback(async (form: { nome: string; email: string; telefone: string; cargo: string; senha: string }) => {
    const { error } = await supabaseExt.from('pmt_usuarios').insert({
      nome: form.nome,
      email: form.email.trim().toLowerCase(),
      telefone: form.telefone,
      cargo: form.cargo,
      senha_hash: form.senha,
      status: false,
      role: 'usuario',
    });
    if (error) {
      if (error.code === '23505') return { success: false, error: 'E-mail já cadastrado' };
      return { success: false, error: error.message };
    }
    return { success: true };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, checkEmailExists }}>
      {children}
    </AuthContext.Provider>
  );
};
