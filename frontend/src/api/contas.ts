// Operações de contas do openapi.yaml (US-02 a US-04, RF-02, RF-03), só para o Administrador.
import { pedido } from './cliente';

export type Perfil = 'ADMIN' | 'GESTOR';

export type Conta = {
  id: number;
  nome: string;
  email: string;
  perfis: Perfil[];
  ativo: boolean;
  /** Anonimizada um ano depois da desativação: "Conta removida", sem ações (RV-33, RV-34). */
  removida: boolean;
};

export type NovaConta = { nome: string; email: string; palavraPasse: string; perfis: Perfil[] };
export type AlteracaoConta = { perfis?: Perfil[]; ativo?: boolean };

const json = (metodo: string, corpo: unknown): RequestInit => ({ method: metodo, body: JSON.stringify(corpo) });

export const listarContas = () => pedido<Conta[]>('/utilizadores');
export const criarConta = (dados: NovaConta) => pedido<Conta>('/utilizadores', json('POST', dados));
export const alterarConta = (id: number, dados: AlteracaoConta) => pedido<Conta>(`/utilizadores/${id}`, json('PATCH', dados));
