import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { RotaProtegida } from './componentes/RotaProtegida';
import { Entrada } from './paginas/Entrada';
import { Painel } from './paginas/Painel';
import { FornecedorSessao } from './sessao/ContextoSessao';

// Navegação da Matriz. Todas as páginas, exceto a entrada, exigem sessão (CA-01.2).
export function App() {
  return (
    <FornecedorSessao>
      <BrowserRouter>
        <Routes>
          <Route path="/entrar" element={<Entrada />} />
          <Route
            path="/"
            element={
              <RotaProtegida>
                <Painel />
              </RotaProtegida>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </FornecedorSessao>
  );
}
