<div align="center">

# API Znuny R3 Ka Capital

**API de integração para consultar clientes em uma base PostgreSQL, armazenar resultados temporariamente no Redis e sincronizar empresas e usuários com o Znuny.**

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.19-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![node-postgres](https://img.shields.io/badge/node--postgres-8.x-4169E1?logo=postgresql&logoColor=white)](https://node-postgres.com/)
[![node-redis](https://img.shields.io/badge/node--redis-5.x-DC382D?logo=redis&logoColor=white)](https://github.com/redis/node-redis)
[![License: ISC](https://img.shields.io/badge/Licen%C3%A7a-ISC-blue.svg)](#-licença)

</div>

> [!IMPORTANT]
> Este serviço altera dados do Znuny e executa comandos administrativos no servidor. Antes de publicá-lo, restrinja o acesso às rotas, configure CORS e revise as recomendações da seção [Segurança](#-segurança).

## Sumário

- [Sobre o projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura e fluxo](#-arquitetura-e-fluxo)
- [Tecnologias](#-tecnologias)
- [Requisitos](#-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Uso da API](#-uso-da-api)
- [Estrutura de diretórios](#-estrutura-de-diretórios)
- [Segurança](#-segurança)
- [Solução de problemas](#-solução-de-problemas)
- [Limitações conhecidas](#-limitações-conhecidas)
- [Licença](#-licença)

## 📋 Sobre o projeto

A API centraliza a leitura de contatos da view `bi_r3ka_dim_clientes_completa` e a criação desses registros no Znuny. A consulta de origem usa PostgreSQL e pode ser filtrada por usuário ou limitada em quantidade. Seus resultados são armazenados no Redis para reduzir consultas repetidas.

Na sincronização, a aplicação:

1. consulta todos os contatos diretamente no PostgreSQL, ignorando o cache;
2. cria uma empresa no Znuny com `Admin::CustomerCompany::Add`;
3. extrai os e-mails válidos de cada contato;
4. cria um usuário do cliente para cada e-mail com `Admin::CustomerUser::Add`;
5. devolve um resumo com a quantidade processada e as falhas encontradas.

Existe ainda uma rota para atualizar diretamente `name`, `city` e `comments` na tabela `customer_company` do banco do Znuny.

> [!NOTE]
> A descrição do `package.json` menciona Mega, mas o código atual não contém serviço, rota ou configuração dessa integração. O nome Sienge utilizado pelo projeto representa a leitura da view PostgreSQL; não existe chamada à API HTTP do Sienge nesta versão.

## ✨ Funcionalidades

- Verificação simples de disponibilidade da API;
- consulta de contatos em uma view PostgreSQL;
- filtro de contatos pelo campo `cod_tareffa`;
- limitação opcional da quantidade de registros;
- cache de consultas no Redis com expiração configurável;
- opção de ignorar o cache;
- sincronização em lote de empresas e usuários com o Znuny;
- extração, normalização e remoção de e-mails duplicados;
- geração de login do usuário a partir do e-mail e do identificador do cliente;
- formatação de CPF ou CNPJ antes do envio ao Znuny;
- atualização parcial de empresas diretamente no PostgreSQL do Znuny;
- limpeza dos caches da aplicação Znuny por comandos de console.

## 🔄 Arquitetura e fluxo

```text
Cliente HTTP
    │
    ▼
Express / rotas / controladores
    ├──► PostgreSQL de origem ──► view bi_r3ka_dim_clientes_completa
    │             │
    │             └──► Redis (cache das consultas)
    │
    ├──► sudo + znuny.Console.pl ──► empresas e usuários no Znuny
    │
    └──► PostgreSQL do Znuny ──► UPDATE em customer_company
```

O projeto usa dois conjuntos independentes de credenciais PostgreSQL:

- `*_POSTGRESQL`: banco de origem que contém a view de clientes;
- `*_POSTGRESQLCAPITAL`: banco do Znuny usado pela rota de atualização.

## 🧰 Tecnologias

| Tecnologia | Uso no projeto |
|---|---|
| Node.js | Runtime JavaScript |
| Express 5 | Servidor HTTP e roteamento |
| PostgreSQL / `pg` | Consulta da origem e atualização do banco do Znuny |
| Redis / `redis` | Cache das consultas de contatos |
| `dotenv` | Carregamento das variáveis do arquivo `.env` |
| `cors` | Habilitação de requisições entre origens |
| `body-parser` | Dependência instalada, mas não importada pelo código atual |
| pnpm | Gerenciador definido no `package.json` e no lockfile |
| Znuny Console | Criação de empresas, criação de usuários e limpeza de cache |

As versões resolvidas das dependências ficam registradas em `pnpm-lock.yaml`.

## ✅ Requisitos

- Node.js **18.19.0 ou superior**, requisito mínimo da versão instalada do cliente Redis;
- pnpm compatível com a versão indicada em `package.json` (`10.33.1`);
- PostgreSQL acessível contendo a view `bi_r3ka_dim_clientes_completa`;
- Redis acessível pela aplicação;
- banco PostgreSQL do Znuny acessível para usar `PUT /sync/:customerId`;
- servidor Linux com `sudo`, usuário de serviço do Znuny e `znuny.Console.pl` para as operações de console;
- permissão para o usuário do processo Node.js executar o console como o usuário do Znuny;
- porta HTTP liberada para a aplicação, quando houver acesso remoto.

O servidor HTTP pode iniciar em outro sistema operacional, mas as rotas que executam `sudo` dependem de um ambiente Unix/Linux compatível.

## 🚀 Instalação

1. Clone o repositório e entre no diretório:

   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd ApiZnunyR3KaCapital
   ```

2. Habilite o pnpm com Corepack, caso necessário:

   ```bash
   corepack enable
   corepack prepare pnpm@10.33.1 --activate
   ```

3. Instale exatamente as dependências do lockfile:

   ```bash
   pnpm install --frozen-lockfile
   ```

4. Crie o arquivo `.env` na raiz e preencha-o conforme a seção [Configuração](#-configuração).

5. Confirme a conectividade com os dois bancos e com o Redis.

6. Em um host Znuny, valide o console e a permissão de `sudo` usando valores adequados ao ambiente:

   ```bash
   sudo -u <USUARIO_ZNUNY> <CAMINHO_ZNUNY_CONSOLE> --help
   ```

7. Inicie a aplicação:

   ```bash
   pnpm start
   ```

   Na ausência de `PORT`, o serviço escuta a porta `3000`.

> [!NOTE]
> O projeto não possui migrações de banco, contêineres, script de desenvolvimento ou suíte de testes automatizados. A infraestrutura e a view consultada devem existir previamente.

## ⚙️ Configuração

Crie um `.env` com valores próprios do ambiente. Não copie credenciais reais para o repositório:

```dotenv
# Aplicação
PORT=3000
CREATION_DATE=2026-01-01

# PostgreSQL de origem
HOST_POSTGRESQL=db-origem.exemplo.local
PORT_POSTGRESQL=5432
DATABASE_POSTGRESQL=base_origem
USER_POSTGRESQL=usuario_consulta
PASSWORD_POSTGRESQL=senha_segura

# PostgreSQL do Znuny
HOST_POSTGRESQLCAPITAL=db-znuny.exemplo.local
PORT_POSTGRESQLCAPITAL=5432
DATABASE_POSTGRESQLCAPITAL=base_znuny
USER_POSTGRESQLCAPITAL=usuario_znuny
PASSWORD_POSTGRESQLCAPITAL=senha_segura

# Redis
REDIS_HOST=redis.exemplo.local
REDIS_PORT=6379
REDIS_PASSWORD=senha_segura
REDIS_CACHE_EXPIRATION=3600

# Console Znuny
ZNUNY_CONSOLE=/opt/znuny/bin/znuny.Console.pl
ZNUNY_USER=znuny
```

### Referência das variáveis

| Variável | Obrigatória | Padrão | Finalidade |
|---|---:|---|---|
| `PORT` | Não | `3000` | Porta HTTP da aplicação |
| `CREATION_DATE` | Não | — | Texto exibido pela rota raiz |
| `HOST_POSTGRESQL` | Sim¹ | — | Host do banco de origem |
| `PORT_POSTGRESQL` | Não | `5432` | Porta do banco de origem |
| `DATABASE_POSTGRESQL` | Sim¹ | — | Nome do banco de origem |
| `USER_POSTGRESQL` | Sim¹ | — | Usuário do banco de origem |
| `PASSWORD_POSTGRESQL` | Sim¹ | — | Senha do banco de origem |
| `HOST_POSTGRESQLCAPITAL` | Sim² | — | Host do banco do Znuny |
| `PORT_POSTGRESQLCAPITAL` | Não | `5432` | Porta do banco do Znuny |
| `DATABASE_POSTGRESQLCAPITAL` | Sim² | — | Nome do banco do Znuny |
| `USER_POSTGRESQLCAPITAL` | Sim² | — | Usuário do banco do Znuny |
| `PASSWORD_POSTGRESQLCAPITAL` | Sim² | — | Senha do banco do Znuny |
| `REDIS_HOST` | Não | `127.0.0.1` | Host do Redis |
| `REDIS_PORT` | Não | `6379` | Porta do Redis |
| `REDIS_PASSWORD` | Não | vazio | Senha do Redis |
| `REDIS_CACHE_EXPIRATION` | Não | `3600` | TTL do cache em segundos |
| `ZNUNY_CONSOLE` | Não | `/opt/znuny/bin/znuny.Console.pl` | Caminho do console do Znuny |
| `ZNUNY_USER` | Não | `znuny` | Usuário usado pelo comando `sudo -u` |

¹ Necessária para as rotas que consultam contatos ou sincronizam a origem com o Znuny.  
² Necessária para `PUT /sync/:customerId`.

`ZNUNY_PASSWORD` e `DATABASE_POSTGRESQCAPITAL`, encontrados nos arquivos de ambiente locais, não são consumidos pelo código atual. O endpoint `/clearCache` também usa diretamente o usuário `znuny` e o caminho `/opt/znuny/bin/znuny.Console.pl`, sem consultar `ZNUNY_USER` ou `ZNUNY_CONSOLE`.

### Serviços externos

#### PostgreSQL de origem

O usuário configurado deve possuir acesso de leitura à view:

```sql
bi_r3ka_dim_clientes_completa
```

O filtro `user` é aplicado ao campo `cod_tareffa`. A aplicação usa parâmetros SQL para o filtro e o limite.

#### PostgreSQL do Znuny

O usuário precisa de permissão de atualização sobre `customer_company`. A rota direta altera somente `name`, `city` e `comments`, localizando o registro por `customer_id`.

#### Redis

O Redis é conectado durante o carregamento da aplicação. Cada cache utiliza o padrão:

```text
contatos:user:<USUARIO_OU_TODOS>:limit:<LIMITE_OU_SEM_LIMIT>
```

Os valores armazenados são registros JSON completos devolvidos pela view. Dimensione e proteja o Redis considerando que esses registros podem conter dados pessoais.

#### Znuny Console

A sincronização executa:

```text
Admin::CustomerCompany::Add
Admin::CustomerUser::Add
```

A limpeza de cache executa:

```text
Maint::Cache::Delete
Maint::Loader::CacheCleanup
```

Configure `sudoers` com o menor privilégio possível, limitando o usuário do processo Node.js aos comandos estritamente necessários. Evite conceder acesso genérico ao `sudo`.

## 📖 Uso da API

Nos exemplos abaixo, substitua a URL pelo endereço autorizado do serviço:

```bash
export API_URL="http://localhost:3000"
```

### Verificar a aplicação

```http
GET /
```

```bash
curl "$API_URL/"
```

Retorna uma mensagem HTML contendo `CREATION_DATE`.

### Listar contatos

```http
GET /contatos?limit=10&user=CODIGO&ignoreCache=true
```

| Parâmetro | Tipo | Padrão | Descrição |
|---|---|---|---|
| `limit` | inteiro | `0` | Quantidade máxima; `0` consulta sem limite |
| `user` | texto | vazio | Valor exato de `cod_tareffa`; vazio consulta todos |
| `ignoreCache` | booleano textual | `false` | Somente o valor `true` ignora o Redis |

```bash
curl "$API_URL/contatos?limit=10&user=CODIGO"
```

Resposta resumida:

```json
{
  "origem": "postgresql",
  "dados": []
}
```

Em uma consulta reaproveitada, `origem` será `redis`.

### Sincronizar todos os clientes com o Znuny

```http
GET /znuny/clientes/sincronizar
```

```bash
curl "$API_URL/znuny/clientes/sincronizar"
```

Essa operação sempre consulta a origem ignorando o cache e processa todos os registros, um por vez. A rota está implementada como `GET`, embora provoque alterações no Znuny. Os campos opcionais lidos do corpo (`origem`, `prefixoCustomerId` e `descricao`) compõem apenas o contexto da resposta nesta versão; `prefixoCustomerId` não modifica o identificador enviado.

### Atualizar uma empresa no banco do Znuny

```http
PUT /sync/:customerId
Content-Type: application/json
```

```bash
curl -X PUT "$API_URL/sync/CLIENTE-001" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Empresa Exemplo",
    "city": "Salvador",
    "comments": "Atualizado pela integração"
  }'
```

O corpo também reconhece os aliases:

- nome: `name`, `nome` ou `razao_social`;
- cidade: `city`, `cidade` ou `cpf_cnpj`;
- comentário: `comments`, `comment` ou `comentario`;
- identificador, quando não fornecido na URL: `customer_id`, `customerId` ou `id`.

Como a rota atual sempre contém `:customerId`, esse parâmetro prevalece sobre qualquer identificador enviado no corpo. Um array é aceito, mas todos os itens serão aplicados ao mesmo `customerId` da URL. Campos não enviados preservam o valor existente, exceto `city` e `comments`, que recebem respectivamente `"-"` e `"Vokkan"` por padrão no controlador.

### Limpar o cache do Znuny

```http
GET /clearCache
```

```bash
curl "$API_URL/clearCache"
```

Executa sequencialmente os dois comandos de manutenção do Znuny. Essa rota não limpa o cache de contatos mantido no Redis.

## 📁 Estrutura de diretórios

```text
.
├── src/
│   ├── Config/
│   │   └── redisClient.js              # Cliente e conexão Redis
│   ├── controllers/
│   │   ├── customerCompanyController.js # Atualização direta no banco Znuny
│   │   ├── homeController.js            # Status e limpeza do cache Znuny
│   │   └── sienge1Controller.js         # Consulta e sincronização em lote
│   ├── routes/
│   │   └── index.js                     # Definição dos endpoints HTTP
│   ├── services/
│   │   ├── customerSyncService.js       # Normalização e fluxo de sincronização
│   │   ├── siengeContatoService.js      # Consulta PostgreSQL e cache Redis
│   │   └── znunyConsoleService.js       # Execução segura do console com argumentos
│   ├── app.js                            # Middlewares e aplicação Express
│   └── database.js                       # Pool do PostgreSQL do Znuny
├── .env                                  # Configuração local (não versionar)
├── .gitignore
├── package.json
├── pnpm-lock.yaml
└── server.js                             # Carregamento do ambiente e servidor HTTP
```

## 🔒 Segurança

O código atual exige proteção adicional antes de ser exposto fora de uma rede confiável:

- **Não há autenticação nem autorização.** Todas as rotas, inclusive sincronização, atualização de banco e limpeza de cache, estão abertas para quem alcançar o serviço.
- **O CORS está irrestrito.** `cors()` aceita qualquer origem; defina uma lista explícita de origens confiáveis.
- **Operações destrutivas usam `GET`.** `/clearCache` e `/znuny/clientes/sincronizar` alteram estado e podem ser disparadas por navegação, crawlers ou requisições indevidas. Proteja-as e considere migrá-las para `POST`.
- **Erros internos são devolvidos ao cliente.** Algumas respostas incluem mensagens do banco, do sistema operacional ou `stderr`, o que pode revelar detalhes do ambiente.
- **Dados de contato são armazenados no Redis.** Use rede privada, autenticação, criptografia em trânsito quando disponível e TTL adequado.
- **O limite de corpo é de 30 MB.** Aplique limites menores, rate limiting e proteção contra abuso conforme o cenário.
- **O endpoint de atualização escreve diretamente no banco do Znuny.** Use uma conta dedicada com privilégios mínimos e restrinja os campos e clientes autorizados.
- **A aplicação executa `sudo`.** Limite rigorosamente o arquivo `sudoers`; não conceda comandos arbitrários ao usuário do processo.
- **Não há TLS na aplicação.** Coloque-a atrás de um proxy reverso HTTPS quando houver tráfego de rede.
- **Não há validação estrutural completa dos dados.** Valide tipos, tamanhos e campos antes de liberar a API.

O `.env` já é ignorado pelo Git. Entretanto, `.envBackup` está rastreado no repositório atual e pode conter segredos. Remova-o do histórico de forma coordenada, passe a ignorá-lo e **rotacione todas as credenciais que já tenham sido versionadas**. Esta documentação não altera nem remove esse arquivo automaticamente.

## 🛠️ Solução de problemas

### `pnpm` não inicia ou o Corepack não encontra o gerenciador

Ative e prepare a versão declarada pelo projeto:

```bash
corepack enable
corepack prepare pnpm@10.33.1 --activate
```

Se a instalação do Node.js não incluir um Corepack funcional, instale o pnpm pelos meios oficiais do seu ambiente e confirme com `pnpm --version`.

### A aplicação apresenta erro de conexão logo ao iniciar

O cliente Redis conecta durante a importação dos módulos. Confira `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, DNS, firewall e disponibilidade do servidor.

### `/contatos` retorna erro 500

Verifique:

- as variáveis `*_POSTGRESQL`;
- a conectividade com PostgreSQL e Redis;
- a existência da view `bi_r3ka_dim_clientes_completa`;
- a permissão de `SELECT` do usuário;
- se o campo `cod_tareffa` existe quando o filtro `user` é usado.

### A sincronização informa e-mail inválido

Cada registro precisa fornecer pelo menos um e-mail válido em `email`, `email_extra` ou `emails`. Os valores podem estar combinados em texto; a aplicação extrai endereços e remove duplicidades.

### A sincronização falha ao formatar CPF/CNPJ

O fluxo chama a formatação diretamente sobre `cpf_cnpj`. Registros sem esse campo podem causar erro antes da criação no Znuny. Garanta que a consulta de origem devolva uma string nesse campo.

### `sudo`, usuário ou console do Znuny não encontrado

Confirme `ZNUNY_USER`, `ZNUNY_CONSOLE`, o caminho do Perl/console e as permissões de execução. Observe que `/clearCache` usa valores fixos (`znuny` e `/opt/znuny/bin/znuny.Console.pl`) no código atual.

### Empresa ou usuário já existe no Znuny

O fluxo de sincronização chama apenas os comandos `Add`. Embora o serviço possua funções `Update`, elas não são alcançadas automaticamente após uma falha de criação. Registros existentes aparecerão nas falhas da resposta e precisarão de tratamento apropriado.

### `PUT /sync/:customerId` informa sucesso, mas não altera dados

O SQL só atualiza quando o `customer_id` existe e algum valor é diferente. Consulte o item `atualizado` da resposta: `false` também pode significar que o registro não existe ou já possui os mesmos dados.

### Alterações não aparecem imediatamente no Znuny

A atualização direta da tabela não executa automaticamente a limpeza do cache do Znuny. Após validar a alteração, use o procedimento administrativo protegido para limpeza de cache.

## ⚠️ Limitações conhecidas

- Não há testes automatizados; o script `pnpm test` termina com erro por definição.
- Não existem migrações ou criação automática da view e das tabelas.
- A sincronização é sequencial e não oferece paginação, fila ou retomada.
- Os comandos do Znuny têm timeout fixo de 120 segundos por execução.
- A sincronização pode criar a empresa e falhar em um ou mais usuários; não há transação ou rollback entre essas etapas.
- As funções de atualização via console existem, mas não fazem parte do fluxo efetivo.
- `prefixoCustomerId` é aceito pela rota de sincronização, mas não é aplicado.
- A aplicação não implementa desligamento gracioso dos pools PostgreSQL e do cliente Redis.

## 📄 Licença

O `package.json` declara a licença **ISC**. Porém, o repositório não contém atualmente um arquivo `LICENSE`; antes da publicação, inclua o texto da licença e confirme a titularidade e o detentor dos direitos autorais.
