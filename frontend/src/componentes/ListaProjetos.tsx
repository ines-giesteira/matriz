// Cartões dos projetos do utilizador, com o Gestor e as contagens por estado (RF-08, RF-16, RF-35).
// Usada na lista de projetos e no painel inicial; cada nome abre o detalhe do projeto (CA-25.2).
import { Link } from 'react-router';
import type { ProjetoResumo } from '../api/projetos';
import { ESTADOS, NOME_ESTADO } from '../textos';

export function ListaProjetos({ projetos }: { projetos: ProjetoResumo[] }) {
  return (
    <ul className="lista-cartoes">
      {projetos.map((p) => (
        <li key={p.id} className={p.arquivado ? 'cartao arquivado' : 'cartao'}>
          <Link to={`/projetos/${p.id}`} className="cartao-titulo">
            {p.nome}
          </Link>
          {p.arquivado && <span className="etiqueta">Arquivado</span>}
          <p className="texto-suave">Gestor: {p.gestor.nome}</p>
          <p className="contagens" aria-label={`Tarefas por estado em ${p.nome}`}>
            {ESTADOS.map((e) => (
              <span key={e}>
                {NOME_ESTADO[e]}: <strong>{p.contagemPorEstado[e]}</strong>
              </span>
            ))}
          </p>
        </li>
      ))}
    </ul>
  );
}
