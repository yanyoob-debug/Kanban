# Kanban — Sistema de Gerenciamento de Tarefas

Aplicação Full Stack com HTML5, CSS3, JavaScript, Java 17, Spring Boot e MySQL. Visual inspirado na referência fornecida: menu lateral, colunas suaves, cartões com etiquetas e fundo em tons pastel.

## Início rápido — Docker (recomendado)

Requisito: Docker com Compose, em execução com containers Linux (no Windows/macOS, Docker Desktop). Baixe o repositório pelo GitHub, extraia e abra um terminal na pasta do projeto:

```sh
docker compose up --build -d
```

Abra **http://localhost:8080**. A primeira execução baixa as imagens, compila e testa o Java, inicia o MySQL e cria automaticamente o banco e as tabelas. Aguarde a inicialização; para acompanhar:

```sh
docker compose logs -f app
```

Quando aparecer `Tomcat started on port 8080`, a aplicação estará disponível. Não é necessário instalar Java, Maven, Node.js ou MySQL na máquina, nem informar a senha do seu MySQL local.

Para parar, mantendo as tarefas salvas:

```sh
docker compose down
```

Para iniciar novamente:

```sh
docker compose up -d
```

Os dados ficam no volume `kanban_data`, independente do seu MySQL instalado. O banco do Docker usa a porta 3306 apenas na rede dos containers; a interface fica acessível na máquina local em 8080. As credenciais padrão são exclusivas da demonstração local. Esta configuração não deve ser publicada diretamente como ambiente de produção.

Se a porta 8080 já estiver ocupada, pare a execução anterior ou escolha outra porta:

```powershell
# Windows / PowerShell
$env:KANBAN_PORT = '8081'
docker compose up --build -d
```

```sh
# Linux / macOS
KANBAN_PORT=8081 docker compose up --build -d
```

Nesse caso, abra http://localhost:8081. Scripts de criação são executados na primeira inicialização do volume. Atualizações de código exigem repetir `docker compose up --build -d`.

## Funcionalidades

- Criar, editar e excluir tarefas.
- Arrastar cartões entre etapas ou mover pelo seletor acessível.
- Prioridade, prazo e indicação de atraso.
- Busca por título/descrição e filtros de prioridade e prazo.
- Layout responsivo, estados vazios, mensagens de erro e confirmação de exclusão.
- Persistência pela API REST, validação no servidor e organização Controller → Service → Repository.
- Histórico de criação, edição, movimentação e exclusão com valores anteriores/novos e data/hora; acesso pelo menu Histórico ou ao editar uma tarefa.

## Executar sem instalar MySQL

Para uma demonstração sem MySQL, execute `node scripts/start.mjs --demo` diretamente no terminal. Requer Node.js, Java 17 e Maven no PATH. O inicializador executa o Maven e abre o navegador quando o Tomcat está pronto. Os logs aparecem no terminal; use **Ctrl+C** para encerrar. O F5 está configurado exclusivamente para MySQL. Sem `--demo`, o inicializador usa MySQL e exige as credenciais.

Requisitos: Java 17 e Maven.

```powershell
mvn spring-boot:run "-Dspring-boot.run.profiles=demo"
```

Abra http://localhost:8080. O perfil `demo` usa H2 e persiste as tarefas na pasta local `data/`. O quadro começa vazio; crie suas tarefas usando o botão Nova tarefa.

## Executar com MySQL

Execute `database/01_schema.sql` no MySQL em `localhost:3306`. O script cria o banco `kanban`, as tabelas e as chaves estrangeiras. Veja [instruções e diagrama](database/README.md). Configure as variáveis no terminal, sem salvar senhas no repositório:

```powershell
$env:DB_URL = 'jdbc:mysql://localhost:3306/kanban'
$env:DB_USER = 'kanban'
$env:DB_PASSWORD = '<sua senha>'
mvn spring-boot:run
```

Com MySQL, o Hibernate valida a estrutura criada pelo script. O perfil demo continua criando/atualizando seu banco H2 local. A interface é servida pelo Spring Boot, no mesmo endereço da API. No VS Code, a configuração **Kanban — Front + Back (MySQL)** solicita as credenciais e inicia ambos.

## API

| Método | Rota | Resultado |
| --- | --- | --- |
| GET | `/tarefas` | Listar tarefas |
| GET | `/tarefas/{id}` | Buscar uma tarefa |
| POST | `/tarefas` | Criar (201) |
| PUT | `/tarefas/{id}` | Atualizar |
| DELETE | `/tarefas/{id}` | Excluir (204) |
| GET | `/historico` | Últimos 100 eventos do quadro |
| GET | `/tarefas/{id}/historico` | Últimos 100 eventos da tarefa, inclusive após exclusão |

```json
{
  "titulo": "Estudar Spring Boot",
  "descricao": "Implementar a API do portfólio",
  "status": "A_FAZER",
  "prioridade": "ALTA",
  "prazo": "2026-10-20"
}
```

Status: `A_FAZER`, `EM_ANDAMENTO`, `CONCLUIDO`. Prioridades: `BAIXA`, `MEDIA`, `ALTA`. Prazo opcional. O servidor gera `id`, `criadaEm` e `atualizadaEm`.

## Verificar

```powershell
mvn test
node --check src/main/resources/static/app.js
node --test scripts/frontend.test.mjs
```

Esta versão é para um espaço pessoal, sem autenticação. Antes de disponibilizar para múltiplos usuários, implemente login e autorização por proprietário. As fontes Google são opcionais; a interface possui fallback sans-serif.
