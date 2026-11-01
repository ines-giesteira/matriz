import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { RotaProtegida } from './componentes/RotaProtegida';
import { AdminContas } from './paginas/AdminContas';
import { AdminProjetos } from './paginas/AdminProjetos';
import { Entrada } from './paginas/Entrada';
import { Painel } from './paginas/Painel';
import { Projeto } from './paginas/Projeto';
import { Projetos } from './paginas/Projetos';
import { Tarefa } from './paginas/Tarefa';
import { FornecedorSessao, useSessao } from './sessao/ContextoSessao';

/** Só o Administrador abre a administração; os outros perfis voltam ao início (a API recusa na mesma, EC-41). */
function SoAdministrador({ children }: { children: ReactNode }) {
  const { estado } = useSessao();
  if (estado.tipo === 'autenticado' && !estado.utilizador.perfis.includes('ADMIN')) return <Navigate to="/" replace />;
  return <>{children}</>;
}

// Navegação da Matriz. Todas as páginas, exceto a entrada, exigem sessão (CA-01.2).
export function App() {
  const protegida = (pagina: ReactNode) => <RotaProtegida>{pagina}</RotaProtegida>;
  return (
    <FornecedorSessao>
      <BrowserRouter>
        <Routes>
          <Route path="/entrar" element={<Entrada />} />
          <Route path="/" element={protegida(<Painel />)} />
          <Route path="/projetos" element={protegida(<Projetos />)} />
          <Route path="/projetos/:projetoId" element={protegida(<Projeto />)} />
          <Route path="/projetos/:projetoId/tarefas/:tarefaId" element={protegida(<Tarefa />)} />
          <Route
            path="/administracao/contas"
            element={protegida(
              <SoAdministrador>
                <AdminContas />
              </SoAdministrador>,
            )}
          />
          <Route
            path="/administracao/projetos"
            element={protegida(
              <SoAdministrador>
                <AdminProjetos />
              </SoAdministrador>,
            )}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </FornecedorSessao>
  );
}
