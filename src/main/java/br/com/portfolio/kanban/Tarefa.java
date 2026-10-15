package br.com.portfolio.kanban;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tarefas")
public class Tarefa {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @Column(nullable = false, length = 120) public String titulo;
    @Column(length = 2000) public String descricao;
    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 24) public Status status;
    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 12) public Prioridade prioridade;
    public LocalDate prazo;
    @Column(nullable = false, updatable = false) public LocalDateTime criadaEm;
    @Column(nullable = false) public LocalDateTime atualizadaEm;
    @PrePersist void criar() { criadaEm = LocalDateTime.now(); atualizadaEm = criadaEm; }
    @PreUpdate void atualizar() { atualizadaEm = LocalDateTime.now(); }
}
