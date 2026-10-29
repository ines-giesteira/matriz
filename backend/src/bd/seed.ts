import bcrypt from 'bcryptjs';
import { emTransacao, type Bd } from './ligacao.js';

/**
 * Dados de demonstração (docs/implementation-plan.md, I0). Todos os nomes e emails são fictícios.
 *
 * Permitem testar acessos distintos:
 * - Helena (Administrador) não é membro de nenhum projeto.
 * - Ana gere "Lançamento do novo site" e "Relatório anual 2025" (arquivado), mas não pertence a "Migração do CRM".
 * - Paulo gere "Migração do CRM".
 * - Marta e João são membros; Rui tem a conta desativada.
 * - "Lançamento do novo site" tem as 10 tarefas do CA-18.1 e do wireframe (docs/ui/).
 */

type Perfil = 'ADMIN' | 'GESTOR';
type Estado = 'TODO' | 'IN_PROGRESS' | 'DONE';
type Prioridade = 'HIGH' | 'MEDIUM' | 'LOW';

const UTILIZADORES: { chave: string; nome: string; email: string; perfis: Perfil[]; ativo: boolean }[] = [
  { chave: 'helena', nome: 'Helena Matos', email: 'helena.matos@matriz.test', perfis: ['ADMIN'], ativo: true },
  { chave: 'ana', nome: 'Ana Silva', email: 'ana.silva@matriz.test', perfis: ['GESTOR'], ativo: true },
  { chave: 'paulo', nome: 'Paulo Reis', email: 'paulo.reis@matriz.test', perfis: ['GESTOR'], ativo: true },
  { chave: 'marta', nome: 'Marta Lopes', email: 'marta.lopes@matriz.test', perfis: [], ativo: true },
  { chave: 'joao', nome: 'João Pires', email: 'joao.pires@matriz.test', perfis: [], ativo: true },
  { chave: 'rui', nome: 'Rui Costa', email: 'rui.costa@matriz.test', perfis: [], ativo: false },
];

type TarefaSeed = {
  titulo: string;
  prioridade: Prioridade;
  dataLimite: string | null;
  estado: Estado;
  responsaveis: string[];
  comentarios?: { autor: string; conteudo: string; criadoEm: string }[];
};

const PROJETOS: {
  nome: string;
  descricao: string | null;
  dataInicio: string | null;
  dataFim: string | null;
  arquivado: boolean;
  gestor: string;
  membros: string[];
  tarefas: TarefaSeed[];
}[] = [
  {
    nome: 'Lançamento do novo site',
    descricao: 'Novo site institucional da empresa.',
    dataInicio: '2026-10-01',
    dataFim: '2026-11-30',
    arquivado: false,
    gestor: 'ana',
    membros: ['ana', 'marta', 'joao', 'rui'],
    tarefas: [
      { titulo: 'Configurar formulário de contacto', prioridade: 'MEDIUM', dataLimite: '2026-10-29', estado: 'TODO', responsaveis: ['marta'] },
      { titulo: 'Definir mapa do site', prioridade: 'MEDIUM', dataLimite: '2026-11-05', estado: 'TODO', responsaveis: ['marta'] },
      { titulo: 'Escrever textos da página inicial', prioridade: 'LOW', dataLimite: '2026-11-12', estado: 'TODO', responsaveis: [] },
      { titulo: 'Preparar reunião de arranque', prioridade: 'MEDIUM', dataLimite: null, estado: 'TODO', responsaveis: [] },
      { titulo: 'Escolher fotografias', prioridade: 'LOW', dataLimite: null, estado: 'TODO', responsaveis: ['joao'] },
      {
        titulo: 'Enviar proposta ao fornecedor',
        prioridade: 'HIGH',
        dataLimite: '2026-10-20',
        estado: 'IN_PROGRESS',
        responsaveis: ['rui'],
        comentarios: [
          { autor: 'marta', conteudo: 'O Rui ficou sem acesso. Quem pega nesta tarefa?', criadoEm: '2026-10-27T09:15:00.000Z' },
          { autor: 'ana', conteudo: 'Fica comigo; envio a proposta esta semana.', criadoEm: '2026-10-27T10:02:00.000Z' },
        ],
      },
      { titulo: 'Rever orçamento', prioridade: 'HIGH', dataLimite: '2026-11-15', estado: 'IN_PROGRESS', responsaveis: ['ana', 'marta'] },
      { titulo: 'Aprovar logótipo', prioridade: 'HIGH', dataLimite: '2026-10-01', estado: 'DONE', responsaveis: ['joao'] },
      { titulo: 'Contratar alojamento', prioridade: 'MEDIUM', dataLimite: '2026-10-10', estado: 'DONE', responsaveis: ['ana'] },
      { titulo: 'Recolher requisitos', prioridade: 'MEDIUM', dataLimite: null, estado: 'DONE', responsaveis: ['marta'] },
    ],
  },
  {
    nome: 'Migração do CRM',
    descricao: 'Passar os contactos para o novo CRM.',
    dataInicio: '2026-10-15',
    dataFim: null,
    arquivado: false,
    gestor: 'paulo',
    membros: ['paulo', 'joao'],
    tarefas: [
      { titulo: 'Exportar contactos do sistema antigo', prioridade: 'MEDIUM', dataLimite: '2026-11-20', estado: 'TODO', responsaveis: ['joao'] },
      { titulo: 'Validar campos obrigatórios', prioridade: 'HIGH', dataLimite: null, estado: 'IN_PROGRESS', responsaveis: ['paulo'] },
    ],
  },
  {
    nome: 'Relatório anual 2025',
    descricao: null,
    dataInicio: '2026-01-05',
    dataFim: '2026-03-31',
    arquivado: true,
    gestor: 'ana',
    membros: ['ana', 'marta'],
    tarefas: [
      { titulo: 'Compilar indicadores', prioridade: 'MEDIUM', dataLimite: '2026-03-15', estado: 'DONE', responsaveis: ['marta'] },
    ],
  },
];

/**
 * Cria os dados de demonstração só se ainda não existir nenhuma conta,
 * para nunca apagar nem duplicar dados (Ficha 3, Exercício 2).
 *
 * @returns verdadeiro se criou os dados; falso se a base já tinha contas
 */
export function semear(bd: Bd, palavraPasse: string): boolean {
  const existentes = bd.prepare('SELECT COUNT(*) AS n FROM utilizador').get();
  if (Number(existentes?.n) > 0) return false;

  const hash = bcrypt.hashSync(palavraPasse, 10);

  emTransacao(bd, () => {
    const ids = new Map<string, number>();
    const inserirUtilizador = bd.prepare(
      'INSERT INTO utilizador (nome, email, palavra_passe_hash, ativo) VALUES (?, ?, ?, ?)',
    );
    const inserirPerfil = bd.prepare('INSERT INTO perfil_atribuido (utilizador_id, perfil) VALUES (?, ?)');
    for (const u of UTILIZADORES) {
      const { lastInsertRowid } = inserirUtilizador.run(u.nome, u.email, hash, u.ativo ? 1 : 0);
      const id = Number(lastInsertRowid);
      ids.set(u.chave, id);
      for (const perfil of u.perfis) inserirPerfil.run(id, perfil);
    }
    const id = (chave: string): number => {
      const valor = ids.get(chave);
      if (valor === undefined) throw new Error(`Utilizador de seed desconhecido: ${chave}`);
      return valor;
    };

    const inserirProjeto = bd.prepare(
      'INSERT INTO projeto (nome, descricao, data_inicio, data_fim, arquivado, gestor_id) VALUES (?, ?, ?, ?, ?, ?)',
    );
    const inserirMembro = bd.prepare('INSERT INTO membro_projeto (projeto_id, utilizador_id) VALUES (?, ?)');
    const inserirTarefa = bd.prepare(
      'INSERT INTO tarefa (projeto_id, titulo, prioridade, data_limite, estado) VALUES (?, ?, ?, ?, ?)',
    );
    const inserirAtribuicao = bd.prepare('INSERT INTO atribuicao (tarefa_id, utilizador_id) VALUES (?, ?)');
    const inserirComentario = bd.prepare(
      'INSERT INTO comentario (tarefa_id, autor_id, conteudo, criado_em) VALUES (?, ?, ?, ?)',
    );

    for (const p of PROJETOS) {
      const projetoId = Number(
        inserirProjeto.run(p.nome, p.descricao, p.dataInicio, p.dataFim, p.arquivado ? 1 : 0, id(p.gestor))
          .lastInsertRowid,
      );
      for (const m of p.membros) inserirMembro.run(projetoId, id(m));
      for (const t of p.tarefas) {
        const tarefaId = Number(
          inserirTarefa.run(projetoId, t.titulo, t.prioridade, t.dataLimite, t.estado).lastInsertRowid,
        );
        for (const r of t.responsaveis) inserirAtribuicao.run(tarefaId, id(r));
        for (const c of t.comentarios ?? []) inserirComentario.run(tarefaId, id(c.autor), c.conteudo, c.criadoEm);
      }
    }
  });

  return true;
}
