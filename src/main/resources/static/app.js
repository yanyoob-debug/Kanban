import { formatDeadline, parseDeadline, maskDeadline } from './deadline.mjs?v=2';

const $ = selector => document.querySelector(selector);
const statusNames = { A_FAZER: 'A Fazer', EM_ANDAMENTO: 'Em Andamento', CONCLUIDO: 'Concluído' };
const priorityNames = { ALTA: 'Alta prioridade', MEDIA: 'Média prioridade', BAIXA: 'Baixa prioridade' };
let tasks = [], editingId = null, dueOnly = false, busy = false, toastTimer;
let loadVersion = 0;
const form = $('#task-form');
const dialog = $('#task-dialog');
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
async function api(path = '', options = {}, base = '/tarefas') {
  const response = await fetch(base + path, { cache: 'no-store', ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
  if (response.status === 404 && (base === '/historico' || path.endsWith('/historico'))) {
    throw new Error('O backend em execução ainda não disponibiliza o histórico. Execute database/03_historico.sql e reinicie a aplicação pelo terminal ou F5. Atualizar apenas a página não reinicia o backend.');
  }
  if (!response.ok) throw new Error(response.status === 404 ? 'Essa tarefa não existe mais. Atualize o quadro.' : response.status === 400 ? 'Verifique os dados da tarefa.' : 'Não foi possível salvar. Verifique sua conexão e tente novamente.');
  return response.status === 204 ? null : response.json();
}
function notify(message) { $('#toast').textContent = message; $('#toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').hidden = true, 4000); }
function render() {
  const search = $('#search').value.trim().toLocaleLowerCase('pt-BR');
  const priority = $('#priority-filter').value;
  const filtered = tasks.filter(t => `${t.titulo} ${t.descricao || ''}`.toLocaleLowerCase('pt-BR').includes(search) && (!priority || t.prioridade === priority) && (!dueOnly || t.prazo));
  $('#total').textContent = tasks.length;
  $('#progress').textContent = tasks.length ? `${tasks.filter(t => t.status === 'CONCLUIDO').length} de ${tasks.length} tarefas concluídas` : '0 tarefas concluídas';
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  document.querySelectorAll('.column').forEach(column => {
    const items = filtered.filter(t => t.status === column.dataset.status);
    column.querySelector('.count').textContent = items.length;
    column.querySelector('.cards').innerHTML = items.length ? items.map(t => {
      const overdue = t.prazo && t.prazo < today && t.status !== 'CONCLUIDO';
      const date = t.prazo ? new Date(t.prazo + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : 'Sem prazo';
      return `<article class="card" draggable="true" data-id="${t.id}"><div class="card-top"><span class="tag ${t.prioridade}">${priorityNames[t.prioridade]}</span><button class="edit-card" data-edit="${t.id}" aria-label="Editar ${escapeHtml(t.titulo)}">⋯</button></div><h3>${escapeHtml(t.titulo)}</h3><p>${escapeHtml(t.descricao || 'Adicione detalhes à sua tarefa.')}</p><div class="card-bottom"><span class="deadline ${overdue ? 'overdue' : ''}">◷ ${escapeHtml(date)}${overdue ? ' · Atrasada' : ''}</span><select data-move="${t.id}" aria-label="Mudar etapa de ${escapeHtml(t.titulo)}">${Object.entries(statusNames).map(([value, label]) => `<option value="${value}" ${value === t.status ? 'selected' : ''}>${label}</option>`).join('')}</select></div></article>`;
    }).join('') : '<div class="empty">Nenhuma tarefa nesta etapa.</div>';
  });
}
async function load() {
  const version = ++loadVersion;
  try {
    const fetchedTasks = await api();
    if (version !== loadVersion) return;
    tasks = fetchedTasks;
    $('#connection-error').hidden = true;
    render();
  } catch (error) { if (version === loadVersion) $('#connection-error').hidden = false; }
}
function openTask(id = null, status = 'A_FAZER') {
  editingId = id;
  form.reset(); $('#form-error').textContent = '';
  const task = tasks.find(t => t.id === id);
  if (task) for (const name of ['titulo', 'descricao', 'status', 'prioridade', 'prazo']) form.elements[name].value = name === 'prazo' ? formatDeadline(task.prazo) : task[name] || '';
  else form.elements.status.value = status;
  $('#dialog-title').textContent = task ? 'Editar tarefa' : 'Nova tarefa';
  $('#save-task').textContent = task ? 'Salvar alterações' : 'Criar tarefa';
  $('#delete-task').hidden = !task;
  $('#task-history').hidden = !task;
  dialog.showModal(); form.elements.titulo.focus();
}
function lock(value) { busy = value; $('#save-task').disabled = value; $('#delete-task').disabled = value; $('#close-dialog').disabled = value; }
form.addEventListener('submit', async event => {
  event.preventDefault(); if (busy) return;
  const data = Object.fromEntries(new FormData(form)); data.titulo = data.titulo.trim();
  try { data.prazo = parseDeadline(data.prazo); }
  catch (error) { $('#form-error').textContent = error.message; form.elements.prazo.focus(); return; }
  if (!data.titulo) { $('#form-error').textContent = 'Preencha o título da tarefa.'; return; }
  lock(true); ++loadVersion; $('#form-error').textContent = '';
  try {
    const task = await api(editingId ? '/' + editingId : '', { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(data) });
    tasks = editingId ? tasks.map(t => t.id === editingId ? task : t) : [task, ...tasks];
    if (!editingId) {
      $('#search').value = '';
      $('#priority-filter').value = '';
      setView(false);
    }
    dialog.close(); render(); notify(editingId ? 'Alterações salvas.' : 'Tarefa criada. Exibindo todas as tarefas.');
    await load();
  } catch (error) { $('#form-error').textContent = error.message; } finally { lock(false); }
});
$('#delete-task').addEventListener('click', async () => {
  if (busy || !confirm('Excluir esta tarefa? Esta ação não pode ser desfeita.')) return;
  lock(true); ++loadVersion;
  try { await api('/' + editingId, { method: 'DELETE' }); tasks = tasks.filter(t => t.id !== editingId); dialog.close(); render(); notify('Tarefa excluída.'); await load(); }
  catch (error) { $('#form-error').textContent = error.message; } finally { lock(false); }
});
$('#close-dialog').addEventListener('click', () => dialog.close());
form.elements.prazo.addEventListener('input', event => {
  const input = event.target;
  const masked = maskDeadline(input.value, input.selectionStart, event.inputType?.startsWith('delete'));
  input.value = masked.value;
  input.setSelectionRange(masked.caret, masked.caret);
});
$('#clear-deadline').addEventListener('click', () => { form.elements.prazo.value = ''; form.elements.prazo.focus(); });
$('#pick-deadline').addEventListener('click', () => {
  const picker = $('#deadline-picker');
  try { picker.value = parseDeadline(form.elements.prazo.value) || ''; } catch { picker.value = ''; }
  if (typeof picker.showPicker === 'function') picker.showPicker();
  else { picker.focus(); picker.click(); }
});
$('#deadline-picker').addEventListener('change', event => { form.elements.prazo.value = formatDeadline(event.target.value); });

let historyVersion = 0;
const historyFields = { titulo: 'Título', descricao: 'Descrição', status: 'Etapa', prioridade: 'Prioridade', prazo: 'Prazo' };
function historyValue(field, value) {
  if (value == null || value === '') return 'Não informado';
  if (field === 'status') return statusNames[value] || value;
  if (field === 'prioridade') return priorityNames[value] || value;
  return field === 'prazo' ? formatDeadline(value) : value;
}
async function openHistory(tarefaId = null) {
  const version = ++historyVersion;
  const historyDialog = $('#history-dialog');
  $('#history-title').textContent = tarefaId ? 'Histórico da tarefa' : 'Histórico de alterações';
  $('#history-list').innerHTML = '<p class="history-empty">Carregando histórico...</p>';
  historyDialog.showModal();
  try {
    const entries = tarefaId ? await api('/' + tarefaId + '/historico') : await api('', {}, '/historico');
    if (version !== historyVersion || !historyDialog.open) return;
    $('#history-list').innerHTML = entries.length ? entries.map(entry => {
      const before = entry.antes ? JSON.parse(entry.antes) : null;
      const after = entry.depois ? JSON.parse(entry.depois) : null;
      const action = { CRIACAO: 'Tarefa criada', ALTERACAO: 'Tarefa alterada', EXCLUSAO: 'Tarefa excluída' }[entry.evento] || entry.evento;
      const details = before && after ? Object.entries(historyFields).filter(([field]) => before[field] !== after[field]).map(([field, label]) => `<li><strong>${label}</strong><div><span class="old-value">${escapeHtml(historyValue(field, before[field]))}</span> → <span>${escapeHtml(historyValue(field, after[field]))}</span></div></li>`).join('') : '';
      return `<article class="history-entry"><header><strong>${escapeHtml(action)}</strong><time>${escapeHtml(new Date(entry.registradaEm).toLocaleString('pt-BR'))}</time></header><p>${escapeHtml(entry.tituloTarefa)} <span class="optional">#${entry.tarefaOriginalId}</span></p>${details ? `<ul>${details}</ul>` : ''}</article>`;
    }).join('') : '<p class="history-empty">Nenhuma alteração registrada.</p>';
  } catch (error) {
    if (version === historyVersion && historyDialog.open) $('#history-list').innerHTML = `<p class="form-error" role="alert">${escapeHtml(error.message)}</p>`;
  }
}
$('#history-view').addEventListener('click', () => openHistory());
$('#task-history').addEventListener('click', () => openHistory(editingId));
$('#close-history').addEventListener('click', () => $('#history-dialog').close());
$('#history-dialog').addEventListener('close', () => ++historyVersion);
dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
document.addEventListener('click', event => {
  const create = event.target.closest('[data-create]'); if (create) openTask(null, create.dataset.create || 'A_FAZER');
  const edit = event.target.closest('[data-edit]'); if (edit) openTask(Number(edit.dataset.edit));
});
async function moveTask(id, status) {
  const task = tasks.find(t => t.id === id); if (!task || task.status === status || busy) { render(); return; }
  busy = true; ++loadVersion;
  try { const updated = await api('/' + id, { method: 'PUT', body: JSON.stringify({ titulo: task.titulo, descricao: task.descricao, prioridade: task.prioridade, prazo: task.prazo, status }) }); tasks = tasks.map(t => t.id === id ? updated : t); render(); notify('Tarefa movida para ' + statusNames[status] + '.'); await load(); }
  catch (error) { notify(error.message); } finally { busy = false; render(); }
}
document.addEventListener('change', event => { if (event.target.matches('[data-move]')) moveTask(Number(event.target.dataset.move), event.target.value); });
document.addEventListener('dragstart', event => { const card = event.target.closest('.card'); if (card) { event.dataTransfer.setData('text/plain', card.dataset.id); event.dataTransfer.effectAllowed = 'move'; } });
document.querySelectorAll('.column').forEach(column => {
  column.addEventListener('dragover', event => { event.preventDefault(); column.classList.add('drag-over'); });
  column.addEventListener('dragleave', event => { if (!column.contains(event.relatedTarget)) column.classList.remove('drag-over'); });
  column.addEventListener('drop', event => { event.preventDefault(); column.classList.remove('drag-over'); moveTask(Number(event.dataTransfer.getData('text/plain')), column.dataset.status); });
});
document.addEventListener('dragend', () => document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over')));
$('#search').addEventListener('input', render); $('#priority-filter').addEventListener('change', render); $('#retry').addEventListener('click', load);
function setView(due) { dueOnly = due; $('#all-view').classList.toggle('active', !due); $('#due-view').classList.toggle('active', due); render(); }
$('#all-view').addEventListener('click', () => setView(false)); $('#due-view').addEventListener('click', () => setView(true));
window.addEventListener('focus', () => { if (!busy && !dialog.open) load(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden && !busy && !dialog.open) load(); });
render(); load();

