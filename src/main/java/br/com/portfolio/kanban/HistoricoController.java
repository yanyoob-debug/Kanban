package br.com.portfolio.kanban;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
public class HistoricoController {
    private final HistoricoService service;
    public HistoricoController(HistoricoService service) { this.service = service; }
    @GetMapping("/historico") public List<Historico> listar() { return service.listar(null); }
    @GetMapping("/tarefas/{id}/historico") public List<Historico> porTarefa(@PathVariable Long id) { return service.listar(id); }
}
