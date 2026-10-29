import { useEffect, useState } from 'react';
import { ErroApi, pedido } from './api/cliente';

type Saude = { estado: string; baseDeDados: string; migrations: number };

type EstadoPagina =
  | { tipo: 'a-carregar' }
  | { tipo: 'ok'; saude: Saude }
  | { tipo: 'erro'; mensagem: string };

// Página provisória do I0: confirma que a interface chega ao backend e à base de dados.
// É substituída pelo ecrã de entrada no I1 (docs/implementation-plan.md).
export function App() {
  const [estado, setEstado] = useState<EstadoPagina>({ tipo: 'a-carregar' });

  useEffect(() => {
    pedido<Saude>('/saude')
      .then((saude) => setEstado({ tipo: 'ok', saude }))
      .catch((erro: unknown) =>
        setEstado({ tipo: 'erro', mensagem: erro instanceof ErroApi ? erro.message : 'Erro inesperado.' }),
      );
  }, []);

  return (
    <main className="pagina">
      <h1>Matriz</h1>
      {estado.tipo === 'a-carregar' && <p role="status">A verificar o servidor…</p>}
      {estado.tipo === 'ok' && (
        <p role="status">
          Servidor e base de dados disponíveis ({estado.saude.migrations} migration aplicada
          {estado.saude.migrations === 1 ? '' : 's'}).
        </p>
      )}
      {estado.tipo === 'erro' && (
        <p role="alert" className="erro">
          {estado.mensagem}
        </p>
      )}
    </main>
  );
}
