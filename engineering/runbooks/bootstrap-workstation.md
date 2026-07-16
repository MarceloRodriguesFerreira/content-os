# Bootstrap Workstation

## Objetivo

Preparar uma máquina de desenvolvimento para executar o content-OS.

---

# Pré-requisitos

## Git

Verificar:

```bash
git --version
```

---

## Node.js

Versão suportada:

```
>= 24.x
```

Verificar:

```bash
node -v
```

---

## pnpm

Versão utilizada pelo projeto:

```
11.11.0
```

Verificar:

```bash
pnpm -v
```

---

## Docker Desktop

Verificar:

```bash
docker --version
docker compose version
```

Docker Desktop deve estar iniciado.

---

# Clonar o projeto

```bash
git clone <repositorio>
```

Entrar na pasta:

```bash
cd content-os
```

---

# Instalar dependências

```bash
pnpm install
```

---

# Aprovar Build Scripts

Necessário para versões recentes do pnpm.

```bash
pnpm approve-builds
```

Aprovar:

- @prisma/engines
- prisma
- sharp
- unrs-resolver

---

# Subir infraestrutura

```bash
docker compose -f docker/docker-compose.yml up -d
```

---

# Validar PostgreSQL

```bash
docker ps
```

Container esperado:

```
content-os-postgres
```

---

# Validar Prisma

```bash
pnpm --filter api exec prisma -v
```

---

# Iniciar o Backend

```bash
pnpm --filter api start:dev
```

---

# Iniciar o Frontend

```bash
pnpm --filter web dev
```

---

# Checklist

- [ ] Git instalado
- [ ] Node instalado
- [ ] pnpm instalado
- [ ] Docker iniciado
- [ ] Dependências instaladas
- [ ] Build scripts aprovados
- [ ] PostgreSQL executando
- [ ] Prisma funcionando
- [ ] Backend iniciado
- [ ] Frontend iniciado
