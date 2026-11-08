// @vitest-environment jsdom
// Testes de componentes da lista de tarefas (CR-01, P41): EC-51, EC-50 e CR-03.
// A API é simulada com um `fetch` falso; o componente e os módulos da interface são os reais.
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Progresso, Projeto } from '../src/api/projetos';
import type { Tarefa } from '../src/api/tarefas';
import { TarefasProjeto } from '../src/componentes/TarefasProjeto';
import { FornecedorSessao } from '../src/sessao/ContextoSessao';

const ANA = { id: 2, nome: 'Ana Silva', email: 'ana.silva@matriz.test', perfis: ['GESTOR'] };
const PROJETO: Projeto = {
  id: 1,
  nome: 'Lançamento do novo site',
  descricao: null,
  dataInicio: null,
  dataFim: null,
  arquivado: false,
  gestor: { id: 2, nome: 'Ana Silva' },
  souGestor: true,
};
const tarefa = (id: number, titulo: string): Tarefa => ({
  id,
  projetoId: 1,
  titulo,
  descricao: null,
  responsaveis: [],
  prioridade: 'MEDIUM',
  dataLimite: null,
  estado: 'TODO',
  emAtraso: false,
});
const progresso = (total: number): Progresso => ({
  projetoId: 1,
  dataReferencia: '2026-11-08',
  total,
  contagemPorEstado: { TODO: total, IN_PROGRESS: 0, DONE: 0 },
  percentagemConcluida: total === 0 ? null : 0,
  tarefasEmAtraso: { quantidade: 0, tarefas: [] },
});

type Rota = (corpo: unknown) => Promise<{ estado: number; corpo?: unknown }> | { estado: number; corpo?: unknown };

/** API simulada: as rotas são "MÉTODO /caminho"; regista cada pedido. */
function simularApi(rotas: Record<string, Rota>) {
  const pedidos: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, opcoes: RequestInit = {}) => {
      const chave = `${opcoes.method ?? 'GET'} ${url.replace(/^\/api/, '')}`;
      pedidos.push(chave);
      const rota = rotas[chave];
      if (!rota) throw new Error(`Pedido não simulado: ${chave}`);
      const { estado, corpo } = await rota(opcoes.body ? JSON.parse(String(opcoes.body)) : undefined);
      return new Response(estado === 204 ? null : JSON.stringify(corpo), {
        status: estado,
        headers: { 'Content-Type': 'application/json' },
      });
    }),
  );
  return pedidos;
}

function mostrar() {
  render(
    <MemoryRouter>
      <FornecedorSessao>
        <TarefasProjeto projeto={PROJETO} />
      </FornecedorSessao>
    </MemoryRouter>,
  );
}

let tarefas: Tarefa[];
const rotasBase = (): Record<string, Rota> => ({
  'GET /sessao': () => ({ estado: 200, corpo: ANA }),
  'GET /projetos/1/progresso': () => ({ estado: 200, corpo: progresso(tarefas.length) }),
  'GET /projetos/1/tarefas': () => ({ estado: 200, corpo: tarefas }),
  'GET /projetos/1/membros': () => ({ estado: 200, corpo: [{ id: 2, nome: 'Ana Silva', contaAtiva: true }] }),
});

beforeEach(() => {
  tarefas = [tarefa(5, 'Rever orçamento')];
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('EC-51: submissão repetida', () => {
  it('duplo clique em "Criar tarefa", com a resposta da API atrasada, cria uma só tarefa', async () => {
    let responder: () => void = () => {};
    const pedidos = simularApi({
      ...rotasBase(),
      'POST /projetos/1/tarefas': (corpo) =>
        new Promise((resolver) => {
          responder = () => {
            const criada = { ...tarefa(6, (corpo as { titulo: string }).titulo) };
            tarefas = [...tarefas, criada];
            resolver({ estado: 201, corpo: criada });
          };
        }),
    });
    mostrar();
    fireEvent.click(await screen.findByRole('button', { name: 'Nova tarefa' }));
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Escolher alojamento' } });

    const criar = screen.getByRole('button', { name: 'Criar tarefa' });
    fireEvent.click(criar);
    fireEvent.click(criar);
    await act(async () => responder());

    expect(await screen.findByText('Tarefa "Escolher alojamento" criada.')).toBeTruthy();
    expect(pedidos.filter((p) => p === 'POST /projetos/1/tarefas')).toHaveLength(1);
  });
});

describe('EC-50, P1: mensagem de sucesso', () => {
  it('a mensagem de sucesso desaparece quando começa outra ação (mudar o estado de uma tarefa)', async () => {
    simularApi({
      ...rotasBase(),
      'POST /projetos/1/tarefas': (corpo) => {
        const criada = tarefa(6, (corpo as { titulo: string }).titulo);
        tarefas = [...tarefas, criada];
        return { estado: 201, corpo: criada };
      },
      'PUT /projetos/1/tarefas/5/estado': () => ({ estado: 200, corpo: { ...tarefas[0], estado: 'IN_PROGRESS' } }),
    });
    mostrar();
    fireEvent.click(await screen.findByRole('button', { name: 'Nova tarefa' }));
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Escolher alojamento' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar tarefa' }));
    expect(await screen.findByText('Tarefa "Escolher alojamento" criada.')).toBeTruthy();

    fireEvent.change(await screen.findByLabelText('Estado de Rever orçamento'), { target: { value: 'IN_PROGRESS' } });
    await waitFor(() => expect(screen.queryByText('Tarefa "Escolher alojamento" criada.')).toBeNull());
  });
});

describe('CR-03, P39: tarefa eliminada noutro pedido', () => {
  it('quando mudar o estado responde 404, a lista recarrega e a linha desaparece', async () => {
    const pedidos = simularApi({
      ...rotasBase(),
      'PUT /projetos/1/tarefas/5/estado': () => {
        tarefas = []; // foi eliminada noutro pedido
        return { estado: 404, corpo: { codigo: 'NAO_ENCONTRADO', mensagem: 'Não encontrado.' } };
      },
    });
    mostrar();
    fireEvent.change(await screen.findByLabelText('Estado de Rever orçamento'), { target: { value: 'DONE' } });

    expect(await screen.findByText('Este projeto ainda não tem tarefas.')).toBeTruthy();
    expect(screen.queryByText('Rever orçamento')).toBeNull();
    expect(pedidos.filter((p) => p === 'GET /projetos/1/tarefas')).toHaveLength(2);
  });
});
