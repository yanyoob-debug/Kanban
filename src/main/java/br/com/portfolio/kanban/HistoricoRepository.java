package br.com.portfolio.kanban;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HistoricoRepository extends JpaRepository<Historico, Long> {
    List<Historico> findTop100ByOrderByRegistradaEmDescIdDesc();
    List<Historico> findTop100ByTarefaOriginalIdOrderByRegistradaEmDescIdDesc(Long tarefaOriginalId);
}
