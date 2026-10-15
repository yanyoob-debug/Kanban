package br.com.portfolio.kanban;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class HistoricoService {
    public record Snapshot(String titulo, String descricao, Status status, Prioridade prioridade, LocalDate prazo) {}
    private final HistoricoRepository repository;
    private final ObjectMapper mapper;
    public HistoricoService(HistoricoRepository repository, ObjectMapper mapper) { this.repository = repository; this.mapper = mapper; }
    public Snapshot snapshot(Tarefa tarefa) { return new Snapshot(tarefa.titulo, tarefa.descricao, tarefa.status, tarefa.prioridade, tarefa.prazo); }
    public void registrar(Tarefa tarefa, String evento, Snapshot antes, Snapshot depois) {
        Historico registro = new Historico();
        registro.tarefa = "EXCLUSAO".equals(evento) ? null : tarefa;
        registro.tarefaOriginalId = tarefa.id;
        registro.tituloTarefa = tarefa.titulo; registro.evento = evento;
        try {
            registro.antes = antes == null ? null : mapper.writeValueAsString(antes);
            registro.depois = depois == null ? null : mapper.writeValueAsString(depois);
        } catch (JsonProcessingException error) { throw new IllegalStateException("Não foi possível registrar o histórico.", error); }
        repository.saveAndFlush(registro);
    }
    @Transactional(readOnly = true)
    public List<Historico> listar(Long tarefaId) {
        return tarefaId == null ? repository.findTop100ByOrderByRegistradaEmDescIdDesc()
            : repository.findTop100ByTarefaOriginalIdOrderByRegistradaEmDescIdDesc(tarefaId);
    }
}
