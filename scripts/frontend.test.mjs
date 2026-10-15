import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { formatDeadline, parseDeadline, maskDeadline } from '../src/main/resources/static/deadline.mjs';

const source = (await readFile(new URL('../src/main/resources/static/app.js', import.meta.url), 'utf8')).replace(/^import[^\n]*\n/, '');

function setup(fetch) {
  const nodes = new Map();
  function node() {
    return { value: '', hidden: true, open: false, textContent: '', innerHTML: '', listeners: {},
      classList: { toggle() {}, remove() {} },
      addEventListener(event, callback) { this.listeners[event] = callback; },
      focus() {}, setSelectionRange() {},
      showModal() { this.open = true; }, close() { this.open = false; } };
  }
  const get = selector => { if (!nodes.has(selector)) nodes.set(selector, node()); return nodes.get(selector); };
  const form = get('#task-form');
  form.elements = Object.fromEntries(['titulo', 'descricao', 'status', 'prioridade', 'prazo'].map(name => [name, node()]));
  form.reset = () => Object.values(form.elements).forEach(element => element.value = '');
  const columns = ['A_FAZER', 'EM_ANDAMENTO', 'CONCLUIDO'].map(status => {
    const count = node(), cards = node();
    return { ...node(), dataset: { status }, cards, querySelector: selector => selector === '.count' ? count : cards };
  });
  const context = vm.createContext({
    formatDeadline, parseDeadline, maskDeadline, fetch, console, Date,
    setTimeout: () => 1, clearTimeout() {},
    FormData: class { constructor(form) { this.values = Object.entries(form.elements).map(([key, element]) => [key, element.value]); } [Symbol.iterator]() { return this.values[Symbol.iterator](); } },
    document: { querySelector: get, querySelectorAll: selector => selector === '.column' ? columns : [], addEventListener() {}, hidden: false },
    window: { addEventListener() {} }
  });
  vm.runInContext(source, context);
  return { context, get, columns, form };
}
const response = data => ({ ok: true, status: 200, json: async () => data });
const settle = () => new Promise(resolve => setImmediate(resolve));

test('filtro contém Todas, Alta, Média e Baixa como opções independentes', async () => {
  const html = await readFile(new URL('../src/main/resources/static/index.html', import.meta.url), 'utf8');
  const select = html.match(/<select id="priority-filter"[^>]*>([\s\S]*?)<\/select>/)[1];
  const options = [...select.matchAll(/<option value="([^"]*)">([^<]*)<\/option>/g)];
  assert.deepEqual(options.map(option => option[1]), ['', 'ALTA', 'MEDIA', 'BAIXA']);
  assert.doesNotMatch(select, /<\/option\s/);
});

test('nova tarefa aparece imediatamente com busca e prioridade ativas e é sincronizada com a API', async () => {
  let persisted = [], calls = [];
  const app = setup(async (_url, options) => {
    calls.push(options);
    if (options.method === 'POST') {
      const task = { ...JSON.parse(options.body), id: 7 };
      persisted = [task];
      return response(task);
    }
    return response(persisted);
  });
  await settle();
  app.get('#search').value = 'outra tarefa';
  app.get('#priority-filter').value = 'ALTA';
  for (const [name, value] of Object.entries({ titulo: 'Nova tarefa', descricao: '', status: 'A_FAZER', prioridade: 'BAIXA', prazo: '' })) app.form.elements[name].value = value;
  await app.form.listeners.submit({ preventDefault() {} });
  assert.match(app.columns[0].cards.innerHTML, /Nova tarefa/);
  assert.equal(app.get('#priority-filter').value, '');
  assert.equal(app.get('#search').value, '');
  assert.equal(app.get('#total').textContent, 1);
  assert.deepEqual(calls.map(call => call.method ?? 'GET'), ['GET', 'POST', 'GET']);
  assert.ok(calls.every(call => call.cache === 'no-store'));
});

test('resposta antiga de listagem não apaga uma tarefa recém-criada', async () => {
  let initialResolve, listRequests = 0;
  const task = { id: 9, titulo: 'Tarefa salva', descricao: '', status: 'A_FAZER', prioridade: 'MEDIA', prazo: null };
  const app = setup(async (_url, options) => {
    if (options.method === 'POST') return response(task);
    if (++listRequests === 1) return new Promise(resolve => { initialResolve = resolve; });
    return response([task]);
  });
  for (const [name, value] of Object.entries({ titulo: task.titulo, descricao: '', status: task.status, prioridade: task.prioridade, prazo: '' })) app.form.elements[name].value = value;
  await app.form.listeners.submit({ preventDefault() {} });
  initialResolve(response([]));
  await settle();
  assert.match(app.columns[0].cards.innerHTML, /Tarefa salva/);
  assert.equal(app.get('#total').textContent, 1);
});

test('histórico mostra alterações de etapa com valores escapados', async () => {
  const app = setup(async url => response(url === '/historico' ? [{
    id: 1, tarefaOriginalId: 7, tituloTarefa: '<script>teste</script>', evento: 'ALTERACAO', registradaEm: '2026-10-14T12:00:00',
    antes: JSON.stringify({ titulo: 'Antes', descricao: '', status: 'A_FAZER', prioridade: 'MEDIA', prazo: null }),
    depois: JSON.stringify({ titulo: '<b>Depois</b>', descricao: '', status: 'EM_ANDAMENTO', prioridade: 'MEDIA', prazo: null })
  }] : []));
  await settle();
  await app.get('#history-view').listeners.click();
  const html = app.get('#history-list').innerHTML;
  assert.match(html, /Tarefa alterada/);
  assert.match(html, /A Fazer/);
  assert.match(html, /Em Andamento/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /&lt;b&gt;Depois&lt;\/b&gt;/);
  assert.doesNotMatch(html, /<script>/);
});

test('histórico indisponível orienta reiniciar o backend', async () => {
  const app = setup(async url => url === '/historico' ? { ok: false, status: 404 } : response([]));
  await settle();
  await app.get('#history-view').listeners.click();
  assert.match(app.get('#history-list').innerHTML, /reinicie a aplicação/);
  assert.match(app.get('#history-list').innerHTML, /03_historico.sql/);
});
