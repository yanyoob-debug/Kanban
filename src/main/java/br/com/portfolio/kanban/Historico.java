package br.com.portfolio.kanban;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;

@Entity
@Table(name = "historico_tarefas")
public class Historico {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @JsonIgnore @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tarefa_id") @OnDelete(action = OnDeleteAction.SET_NULL)
    public Tarefa tarefa;
    @Column(nullable = false) public Long tarefaOriginalId;
    @Column(nullable = false, length = 120) public String tituloTarefa;
    @Column(nullable = false, length = 20) public String evento;
    @JdbcTypeCode(SqlTypes.LONGVARCHAR) @Column(columnDefinition = "TEXT") public String antes;
    @JdbcTypeCode(SqlTypes.LONGVARCHAR) @Column(columnDefinition = "TEXT") public String depois;
    @Column(nullable = false, updatable = false) public LocalDateTime registradaEm;
    @PrePersist void registrarData() { registradaEm = LocalDateTime.now(); }
}
