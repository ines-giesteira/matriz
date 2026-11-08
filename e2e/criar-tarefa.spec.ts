// Fluxo E2E: entrar, abrir o projeto, criar uma tarefa e vê-la na lista (Ficha 4, Exercício 4; US-01, US-11, US-17).
// Seed: a Ana é Gestora de "Lançamento do novo site", que começa com 10 tarefas (CA-18.1).
import { expect, test } from '@playwright/test';
import { PALAVRA_PASSE_E2E } from './dados';

test('CA-01.1, CA-11.1, CA-11.5: a Gestora entra, cria uma tarefa e vê-a na lista do projeto', async ({ page }) => {
  const titulo = 'Rever acessibilidade do formulário de contacto';

  // Entrar (CA-01.1): o painel mostra os projetos da Ana.
  await page.goto('/');
  await page.getByLabel('Email').fill('ana.silva@matriz.test');
  await page.getByLabel('Palavra-passe').fill(PALAVRA_PASSE_E2E);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: 'Olá, Ana Silva' })).toBeVisible();

  // Abrir o projeto (CA-25.2).
  await page.getByRole('link', { name: 'Lançamento do novo site' }).click();
  await expect(page.getByRole('heading', { name: 'Tarefas (10)' })).toBeVisible();

  // Criar a tarefa só com o título (CA-11.1).
  await page.getByRole('button', { name: 'Nova tarefa' }).click();
  await page.getByLabel('Título').fill(titulo);
  await page.getByRole('button', { name: 'Criar tarefa' }).click();

  // Verificar na interface: mensagem de sucesso, total atualizado sem recarregar (CA-11.5) e a tarefa na lista.
  await expect(page.getByRole('status').filter({ hasText: 'criada' })).toHaveText(`Tarefa "${titulo}" criada.`);
  await expect(page.getByRole('heading', { name: 'Tarefas (11)' })).toBeVisible();
  const linha = page.getByRole('row').filter({ has: page.getByRole('link', { name: titulo }) });
  await expect(linha).toBeVisible();
  await expect(linha).toContainText('Por fazer');

  // Depois de recarregar, a tarefa continua na lista (RNF-09).
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Tarefas (11)' })).toBeVisible();
  await expect(page.getByRole('link', { name: titulo })).toBeVisible();
});
