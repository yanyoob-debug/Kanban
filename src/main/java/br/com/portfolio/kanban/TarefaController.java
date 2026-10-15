package br.com.portfolio.kanban;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/tarefas")
public class TarefaController {
    private final TarefaService service;
    public TarefaController(TarefaService service) { this.service = service; }
    @GetMapping public List<Tarefa> listar() { return service.listar(); }
    @PostMapping public ResponseEntity<Tarefa> criar(@Valid @RequestBody TarefaRequest dados) {
        Tarefa tarefa = service.salvar(null, dados);
        return ResponseEntity.created(URI.create("/tarefas/" + tarefa.id)).body(tarefa);
    }
    @GetMapping("/{id}") public Tarefa buscar(@PathVariable Long id) { return service.buscar(id); }
    @PutMapping("/{id}") public Tarefa atualizar(@PathVariable Long id, @Valid @RequestBody TarefaRequest dados) { return service.salvar(id, dados); }
    @DeleteMapping("/{id}") public ResponseEntity<Void> excluir(@PathVariable Long id) { service.excluir(id); return ResponseEntity.noContent().build(); }
}
