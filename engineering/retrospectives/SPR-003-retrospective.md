# engineering/retrospectives/SPR-003-retrospective.md

# SPR-003 — Retrospectiva Técnica

**Sprint:** SPR-003 — Configuration Module  
**Status:** Concluída

---

# Objetivo

Construir uma camada centralizada de configuração para eliminar o acesso direto a variáveis de ambiente e padronizar a obtenção de configurações da aplicação.

---

# O que foi entregue

- AppConfigModule
- AppConfigService
- Configuração centralizada
- Validação de ambiente
- Encapsulamento do ConfigService
- Remoção de acessos diretos ao process.env
- Testes automatizados

---

# O que funcionou bem

- Excelente separação de responsabilidades.
- Configuração passou a ser um serviço da aplicação.
- Código tornou-se muito mais testável.
- Dependências passaram a utilizar injeção de dependência corretamente.

---

# Problemas encontrados

Inicialmente algumas classes ainda acessavam diretamente:

process.env

Foi necessário refatorar esses pontos.

---

# Lições aprendidas

Toda configuração deve ser encapsulada por um serviço.

Nenhum módulo de negócio deve conhecer variáveis de ambiente.

---

# Melhorias aplicadas nas sprints seguintes

A SPR-004 passou a utilizar exclusivamente o AppConfigService.

A autenticação (SPR-007) também utilizou este padrão.

---

# Resultado

A arquitetura de configuração tornou-se estável e passou a ser considerada padrão do projeto.
