// Gestão de contas pelo Administrador (US-02 a US-04, RF-02, RF-03, RV-32 a RV-34, P25, P26).
// Ordem das verificações (RV-25): 404, 400 (formato) e 422 (regras de negócio).
// O módulo de contas não depende do de projetos (architecture.md, secção 4): as perguntas sobre projetos
// chegam pela interface `ConsultaProjetos`, que o módulo de projetos implementa e app.ts liga.
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { emTransacao, type Bd } from '../../bd/ligacao.js';
import { ErroHttp, naoEncontrado, validarFormato } from '../../http/erros.js';
import * as repo from './repositorio.js';
import type { LinhaConta, Perfil } from './repositorio.js';
import type { UtilizadorAutenticado } from './servico.js';

export type ConsultaProjetos = {
  /** É Gestor de algum projeto, ativo ou arquivado (A-16, A-17, Q-07). */
  eGestorDeAlgumProjeto: (utilizadorId: number) => boolean;
  /** É membro de algum projeto, ativo ou arquivado (RV-32, RV-34). */
  eMembroDeAlgumProjeto: (utilizadorId: number) => boolean;
};

export const PALAVRA_PASSE_MINIMO = 8; // P3

// ---------------------------------------------------------------- Formato dos pedidos (400)

const perfil = z.enum(['ADMIN', 'GESTOR']);
const listaPerfis = z.array(perfil).refine((l) => new Set(l).size === l.length); // uniqueItems

const novaConta = z.strictObject({
  nome: z.string(),
  email: z.string(),
  palavraPasse: z.string(),
  perfis: listaPerfis,
});

const alteracaoConta = z
  .strictObject({ perfis: listaPerfis.optional(), ativo: z.boolean().optional() })
  .refine((v) => Object.keys(v).length > 0); // minProperties: 1

// ---------------------------------------------------------------- Apresentação

const GRUPO = (c: LinhaConta) => (c.removida ? 2 : c.ativo ? 0 : 1);

/** Ativas, depois desativadas e no fim as anonimizadas, cada grupo por nome (P26). */
function compararContas(a: LinhaConta, b: LinhaConta): number {
  return GRUPO(a) - GRUPO(b) || a.nome.localeCompare(b.nome, 'pt') || a.id - b.id;
}

// ---------------------------------------------------------------- Regras (422)

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // P25: texto, "@" e domínio com ponto

function exigirPerfisCompativeis(perfis: Perfil[]): void {
  if (perfis.includes('ADMIN') && perfis.includes('GESTOR')) {
    throw new ErroHttp(
      422,
      'PERFIS_INCOMPATIVEIS',
      'Um Administrador não pode ter também o perfil Gestor.',
      'perfis',
    ); // RV-32
  }
}

// ---------------------------------------------------------------- Operações

export function listar(bd: Bd): LinhaConta[] {
  return repo.listarContas(bd).sort(compararContas);
}

/** Criar uma conta ativa com a palavra-passe inicial (RF-02, CA-02.1). A palavra-passe guarda-se só como hash (EC-49). */
export function criar(bd: Bd, corpo: unknown): LinhaConta {
  const pedido = validarFormato(novaConta, corpo);
  const nome = pedido.nome.trim(); // P26
  const email = pedido.email.trim();
  if (nome === '') throw new ErroHttp(422, 'NOME_OBRIGATORIO', 'O nome é obrigatório.', 'nome');
  if (email === '') throw new ErroHttp(422, 'EMAIL_OBRIGATORIO', 'O email é obrigatório.', 'email');
  if (!EMAIL_VALIDO.test(email)) throw new ErroHttp(422, 'EMAIL_INVALIDO', 'O email não é válido.', 'email');
  if ([...pedido.palavraPasse].length < PALAVRA_PASSE_MINIMO) {
    throw new ErroHttp(
      422,
      'PALAVRA_PASSE_CURTA',
      `A palavra-passe tem de ter pelo menos ${PALAVRA_PASSE_MINIMO} caracteres.`,
      'palavraPasse',
    );
  }
  exigirPerfisCompativeis(pedido.perfis);
  if (repo.existeEmail(bd, email)) {
    throw new ErroHttp(422, 'EMAIL_REPETIDO', 'Já existe uma conta com este email.', 'email'); // EC-33, EC-38
  }
  const hash = bcrypt.hashSync(pedido.palavraPasse, 10);
  const id = emTransacao(bd, () => {
    const novoId = repo.inserirConta(bd, nome, email, hash);
    repo.definirPerfis(bd, novoId, pedido.perfis);
    return novoId;
  });
  return repo.lerLinhaConta(bd, id)!;
}

/**
 * Alterar os perfis e ativar ou desativar uma conta (RF-02, RF-03).
 * As regras olham para o estado final da conta, para um só pedido poder mudar perfis e estado.
 */
export function alterar(
  bd: Bd,
  projetos: ConsultaProjetos,
  agora: () => Date,
  administrador: UtilizadorAutenticado,
  id: number,
  corpo: unknown,
): LinhaConta {
  const conta = repo.lerLinhaConta(bd, id);
  if (!conta) throw naoEncontrado();
  const pedido = validarFormato(alteracaoConta, corpo);
  if (conta.removida) {
    throw new ErroHttp(422, 'CONTA_REMOVIDA', 'Esta conta foi removida e já não pode ser alterada.'); // RV-34
  }

  const perfis = pedido.perfis ?? conta.perfis;
  const ativo = pedido.ativo ?? conta.ativo;
  const ganha = (p: Perfil) => perfis.includes(p) && !conta.perfis.includes(p);
  const perde = (p: Perfil) => !perfis.includes(p) && conta.perfis.includes(p);

  if (id === administrador.id && ganha('GESTOR')) {
    throw new ErroHttp(422, 'GESTOR_PROPRIO', 'Não pode atribuir a si próprio o perfil Gestor.', 'perfis'); // EC-36, RV-01
  }
  exigirPerfisCompativeis(perfis);
  const deixaDeGerir = perde('GESTOR') || (conta.ativo && !ativo);
  if (deixaDeGerir && projetos.eGestorDeAlgumProjeto(id)) {
    // EC-23, EC-26, A-16, A-17, Q-07
    throw new ErroHttp(422, 'GESTOR_COM_PROJETOS', 'Transfira primeiro todos os projetos deste Gestor.');
  }
  if (ganha('ADMIN') && projetos.eMembroDeAlgumProjeto(id)) {
    // EC-55, RV-32, RV-34
    throw new ErroHttp(
      422,
      'ADMINISTRADOR_COM_PROJETOS',
      'Um Administrador não pode ser membro de projetos. Remova primeiro esta pessoa de todos os projetos.',
      'perfis',
    );
  }
  const continuaAdministrador = perfis.includes('ADMIN') && ativo;
  if (!continuaAdministrador && conta.perfis.includes('ADMIN') && conta.ativo && repo.contarAdministradoresAtivos(bd, id) === 0) {
    // EC-27, A-18
    throw new ErroHttp(422, 'ULTIMO_ADMINISTRADOR', 'Tem de existir sempre pelo menos um Administrador ativo.');
  }

  emTransacao(bd, () => {
    if (pedido.perfis) repo.definirPerfis(bd, id, perfis);
    if (ativo !== conta.ativo) {
      repo.definirAtivo(bd, id, ativo, agora().toISOString());
      if (!ativo) repo.apagarSessoesDe(bd, id); // RV-09, EC-31
    }
  });
  return repo.lerLinhaConta(bd, id)!;
}
