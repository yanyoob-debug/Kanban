package br.com.portfolio.kanban;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.Sort;
import java.util.List;

@Service
@Transactional
public class TarefaService {
    private final TarefaRepository repository;
    private final HistoricoService historico;
    public TarefaService(TarefaRepository repository, HistoricoService historico) { this.repository = repository; this.historico = historico; }
    public List<Tarefa> listar() { return repository.findAll(Sort.by("criadaEm").descending()); }
    public Tarefa buscar(Long id) { return repository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tarefa não encontrada.")); }
    public Tarefa salvar(Long id, TarefaRequest dados) {
        Tarefa tarefa = id == null ? new Tarefa() : buscar(id);
        HistoricoService.Snapshot antes = id == null ? null : historico.snapshot(tarefa);
        tarefa.titulo = dados.titulo().trim(); tarefa.descricao = dados.descricao();
        tarefa.status = dados.status(); tarefa.prioridade = dados.prioridade(); tarefa.prazo = dados.prazo();
        repository.saveAndFlush(tarefa);
        HistoricoService.Snapshot depois = historico.snapshot(tarefa);
        if (!depois.equals(antes)) historico.registrar(tarefa, id == null ? "CRIACAO" : "ALTERACAO", antes, depois);
        return tarefa;
    }
    public void excluir(Long id) {
        Tarefa tarefa = buscar(id);
        historico.registrar(tarefa, "EXCLUSAO", historico.snapshot(tarefa), null);
        repository.delete(tarefa);
        repository.flush();
    }
}
