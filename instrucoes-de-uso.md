# ImobCRM — Instruções de Uso

> Sistema CRM imobiliário. Stack: Next.js 16 · Supabase · Prisma · Vercel.

---

## Sumário

1. [Configuração inicial (passos manuais)](#1-configuração-inicial-passos-manuais)
2. [Perfis de usuário e permissões](#2-perfis-de-usuário-e-permissões)
3. [Páginas e como usar](#3-páginas-e-como-usar)
4. [Fluxo principal de vendas](#4-fluxo-principal-de-vendas)
5. [Fluxo de expiração automática de reserva](#5-fluxo-de-expiração-automática-de-reserva)
6. [Web Push — notificações](#6-web-push--notificações)

---

## 1. Configuração inicial (passos manuais)

Execute os scripts abaixo **uma única vez** no **SQL Editor do Supabase** (Dashboard → SQL Editor → New query).

| Ordem | Arquivo | O que faz |
|---|---|---|
| 1 | `supabase/seed.sql` | Cria o tenant padrão "Imobiliaria Teste" |
| 2 | `supabase/trigger_create_profile.sql` | Cria perfil automático ao cadastrar novo usuário |
| 3 | `supabase/seed_funnel.sql` | Cria o funil padrão com 5 etapas para o Kanban |
| 4 | `supabase/storage_enterprises.sql` | Cria o bucket de fotos de empreendimentos |
| 5 | `supabase/pg_cron_reservations.sql` | Agenda job de expiração de reservas (a cada 15 min) |

> **Antes do item 5:** habilite a extensão pg_cron em  
> Supabase Dashboard → Database → Extensions → pg_cron → Enable.

**Realtime (para o Kanban ao vivo):**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
```

---

## 2. Perfis de usuário e permissões

| Role | Acesso |
|---|---|
| `admin` | Tudo: criar empreendimentos, unidades, aprovar/rejeitar propostas, ver painel admin, gerenciar todos os leads |
| `manager` | Mesmo que admin |
| `broker` | Ver e criar leads, registrar atividades, criar propostas, ver Kanban e empreendimentos |
| `coordinator` / `partner` | Acesso básico (mesmo que broker neste MVP) |

O perfil é criado automaticamente ao se cadastrar via Supabase Auth. O `role` padrão é `broker`. Para promover alguém a admin, altere diretamente na tabela `users` no Supabase Dashboard (Table Editor → users → editar o campo `role`).

---

## 3. Páginas e como usar

### `/` — Início

Página inicial após o login. Exibe o nome e role do usuário logado.  
Admin e manager veem o atalho para o **Painel Administrativo**.  
Todos veem o atalho para **Leads**.

---

### `/login` — Login

Tela de autenticação. Insira e-mail e senha cadastrados no Supabase Auth.  
Ao autenticar, o sistema redireciona automaticamente para `/`.

---

### `/leads` — Lista de Leads

Lista todos os leads do tenant.

- **Admin/manager:** veem todos os leads.
- **Broker:** vê apenas os leads atribuídos a ele.
- **Filtros por status:** clique nas pílulas (Novo, Em andamento, Qualificado, etc.) para filtrar.
- **Novo lead:** botão "+ Novo lead" no canto superior direito.

---

### `/leads/new` — Novo Lead

Formulário para cadastrar um lead manualmente.

| Campo | Obrigatório | Descrição |
|---|---|---|
| Nome | Sim | Nome completo do lead |
| Telefone | Não | Telefone de contato |
| E-mail | Não | E-mail do lead |
| Origem | Sim | Como o lead chegou (Manual, Website, Facebook, etc.) |

Ao salvar, o sistema redireciona para o **detalhe do lead**.  
Leads criados por brokers são atribuídos automaticamente a eles.

---

### `/leads/[id]` — Detalhe do Lead

Página central de trabalho do corretor.

**Seções:**

1. **Card do lead** — nome, contato, responsável e origem.
   - **Etapa no funil** — dropdown para posicionar o lead em uma coluna do Kanban. Selecione a etapa e clique em Salvar.
   - **Status** (admin/manager) — pílulas para mudar o status geral do lead (Novo, Em andamento, Qualificado, Convertido, Perdido, Descartado).

2. **Registrar atividade** — formulário para registrar interações:
   - Tipos: Ligação, E-mail, Visita, Reunião, WhatsApp, Nota.
   - Preencha o tipo e a descrição e clique em **Salvar**.

3. **Timeline** — histórico cronológico de todas as atividades registradas, com data, hora e responsável.

4. **+ Criar proposta** — botão no topo da página que inicia o fluxo de proposta para este lead.

---

### `/kanban` — Funil Kanban

Visualização do funil de vendas em colunas.

- Cada coluna representa uma etapa do funil (Novo Contato → Qualificação → Proposta → Negociação → Fechamento).
- Cada card representa um lead atribuído àquela etapa.
- **Arrastar um card** entre colunas muda a etapa do lead e salva automaticamente.
- **Realtime:** a mudança aparece em todas as abas/sessões abertas instantaneamente.

> Para um lead aparecer no Kanban, ele precisa ter uma etapa atribuída. Faça isso na página de detalhe do lead (campo "Etapa no funil").

---

### `/enterprises` — Empreendimentos

Lista todos os empreendimentos cadastrados com foto de capa, tipo e status de vendas.

- Clique em um card para ver o detalhe e as unidades.
- **Admin/manager:** veem o botão "+ Novo" para cadastrar empreendimentos.

---

### `/enterprises/new` — Novo Empreendimento *(admin/manager)*

Formulário de cadastro de empreendimento.

| Campo | Descrição |
|---|---|
| Nome | Nome do empreendimento |
| Tipo | Vertical, Horizontal, Loteamento, Comercial, Misto |
| Descrição | Texto livre descritivo |
| Foto de capa | Upload de imagem (salva no Supabase Storage) |

---

### `/enterprises/[id]` — Detalhe do Empreendimento

Exibe a foto de capa, informações e todas as unidades.

**Filtro de unidades:** pílulas no topo da lista (Todas, Disponível, Reservada, Vendida, Indisponível).

**Card de unidade** exibe: identificador, tipologia, andar, dormitórios, área, preço e status atual.

**Admin/manager** podem:
- Mudar o **status do empreendimento** (Pré-lançamento, Lançamento, Em vendas, Esgotado, Entregue) via pílulas no card do empreendimento.
- Mudar o **status de cada unidade** individualmente via pílulas no card da unidade.
- Criar novas unidades via botão **"+ Nova unidade"**.

---

### `/enterprises/[id]/map` — Mapa Interativo

Visualização do mapa de loteamento com os lotes posicionados sobre a imagem aérea.

- Marcadores coloridos indicam o status de cada unidade (verde = disponível, amarelo = reservada, vermelho = vendida).
- Clique em um marcador para ver o popup com identificador, tipologia, status e preço.
- Admin/manager veem o botão **"Editar posições"** para acessar o editor.

> Aparece automaticamente no detalhe do empreendimento via botão **"🗺 Ver mapa"**.

### `/enterprises/[id]/map/edit` — Editor de Mapa *(admin/manager)*

Ferramenta para configurar o mapa interativo:

1. **Envie a imagem** do mapa (planta ou foto aérea) — salva no Supabase Storage.
2. **Selecione uma unidade** na lista lateral esquerda (unidades sem posição).
3. **Clique no ponto exato** da imagem onde a unidade está — a posição é salva automaticamente.
4. Para **reposicionar**, clique no marcador existente e clique em novo ponto.
5. Para **remover** a posição de uma unidade, clique em "remover" na lista de posicionadas.

### `/enterprises/[id]` — Detalhe (atualizado)

Além do que já existia, cada card de unidade agora inclui:

**Atualizar preço** *(admin/manager)*
- Campo "Novo preço R$" e campo opcional "Motivo"
- Ao submeter, o preço é atualizado e o histórico é registrado automaticamente

**Histórico de preços**
- Clique em "Histórico de preços (N)" para expandir
- Mostra os últimos 3 registros com valor, responsável, motivo e data

### `/enterprises/[id]/units/new` — Nova Unidade *(admin/manager)*

Formulário de cadastro de unidade.

| Campo | Descrição |
|---|---|
| Identificador | Código da unidade (ex: 101, A-01, Lote 05) |
| Tipologia | Descrição do tipo (ex: 2 dorms, Studio) |
| Andar | Número do andar |
| Dormitórios | Quantidade de dormitórios |
| Área privativa | Área em m² |
| Preço | Valor atual em R$ |

A unidade é criada com status **Disponível** automaticamente.

---

### `/proposals` — Propostas

Lista todas as propostas do tenant com status e valor.

- **Admin/manager:** veem um aviso de quantas propostas estão aguardando aprovação.
- Clique em uma proposta para ver o detalhe e as ações disponíveis.

---

### `/proposals/new` — Nova Proposta

Fluxo em 2 etapas dentro da mesma página:

1. **Selecione o empreendimento** — ao escolher, a página recarrega mostrando as unidades disponíveis.
2. **Selecione a unidade** e preencha os dados financeiros:

| Campo | Descrição |
|---|---|
| Valor proposto | Valor oferecido pelo cliente (R$) |
| Entrada | Valor de entrada, se houver |
| Parcelas | Número de parcelas do financiamento |
| Financiamento | Tipo (Caixa, Bancário, Direto, Consórcio) |
| Observações | Notas livres sobre a proposta |

Ao submeter, a proposta é criada com status **Aguardando aprovação** e o sistema redireciona para o detalhe.

> Acesse também pelo botão **"+ Criar proposta"** na página de detalhe de um lead — o `leadId` é preenchido automaticamente.

---

### `/proposals/[id]` — Detalhe da Proposta

Exibe todos os dados financeiros da proposta e a reserva associada (se aprovada).

**Ações disponíveis (admin/manager):**

| Ação | Quando aparece | O que faz |
|---|---|---|
| **Aprovar e reservar unidade** | Status = Aguardando aprovação | Aprova a proposta, cria reserva de 24h e muda a unidade para Reservada |
| **Rejeitar** | Status = Aguardando aprovação | Rejeita a proposta |
| **Cancelar reserva** | Status = Aprovada + reserva ativa | Cancela a reserva e libera a unidade de volta para Disponível |

---

### `/admin` — Painel Administrativo *(admin/manager)*

Painel restrito. Exibe o nome e role do gestor logado.  
Brokers que tentarem acessar `/admin` são redirecionados para `/`.

---

## 4. Fluxo principal de vendas

```
1. Cadastrar lead em /leads/new
        ↓
2. Registrar atividades no detalhe do lead (ligações, visitas, notas)
        ↓
3. Mover o lead pelo Kanban conforme avança no processo
        ↓
4. Clicar em "+ Criar proposta" no detalhe do lead
        ↓
5. Selecionar empreendimento + unidade disponível + valores
        ↓
6. Gestor aprova em /proposals/[id] → unidade fica Reservada por 24h
        ↓
7. Venda concluída: gestor muda status da unidade para Vendida
           e status do lead para Convertido
```

---

## 5. Fluxo de expiração automática de reserva

Quando uma proposta é aprovada, uma reserva de **24 horas** é criada.  
Um job pg_cron roda a cada 15 minutos e:

1. Marca como `expirada` qualquer reserva com `expires_at < agora`.
2. Libera as unidades correspondentes de volta para `Disponível`.

Isso acontece **automaticamente**, sem intervenção manual.  
O gestor também pode cancelar a reserva manualmente a qualquer momento na página da proposta.

---

## 6. Web Push — notificações

### Ativar notificações

Na primeira visita ao sistema, um botão **"🔔 Ativar notificações"** aparece no canto inferior direito da tela.  
Clique nele e conceda permissão no popup do browser.  
Após conceder, a assinatura é salva automaticamente no seu perfil.

> No **iOS (iPhone/iPad)** o push só funciona se o app estiver instalado na tela inicial ("Adicionar à Tela de Início"). No desktop e Android funciona diretamente no browser.

### Quando as notificações são disparadas

| Evento | Quem recebe |
|---|---|
| Novo lead cadastrado | Todos os admin/manager com push ativado |

### Configuração de ambiente (Vercel)

As chaves VAPID precisam estar nas variáveis de ambiente do Vercel:  
**Settings → Environment Variables** → adicionar:

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Chave pública gerada |
| `VAPID_PRIVATE_KEY` | Chave privada gerada |
| `VAPID_MAILTO` | `mailto:seu@email.com` |

### `/` — Home (KPIs do corretor)

A página inicial agora exibe três métricas pessoais:
- **Leads este mês** — leads atribuídos ao usuário no mês atual
- **Propostas pendentes** — total de propostas aguardando aprovação no tenant
- **Atividades (7 dias)** — atividades registradas pelo usuário na última semana

### `/admin` — Dashboard KPIs *(admin/manager)*

Exibe os indicadores globais do tenant:

| KPI | Descrição |
|---|---|
| Total de leads | Todos os leads ativos |
| Taxa de conversão | Leads convertidos ÷ total (%) |
| Propostas pendentes | Propostas aguardando aprovação |
| Reservas ativas | Reservas com status ativo |
| Unidades disponíveis | Com subtítulo de reservadas e vendidas |

Abaixo dos KPIs há um gráfico de barras horizontal com a distribuição de leads por status e três cards com contagem de unidades (Disponíveis / Reservadas / Vendidas).

---

## 7. Checklist de deploy (Vercel)

Antes de publicar em produção, confirme que todas as variáveis de ambiente estão configuradas em **Vercel → Settings → Environment Variables**:

| Variável | Onde obter |
|---|---|
| `DATABASE_URL` | Supabase → Settings → Database → Connection string (pooler, porta 6543) |
| `DIRECT_URL` | Supabase → Settings → Database → Connection string (direct, porta 5432) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public key |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Gerado via `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | Gerado via `npx web-push generate-vapid-keys` |
| `VAPID_MAILTO` | `mailto:seu@email.com` |

> Após adicionar as variáveis, faça um **Redeploy** no Vercel para aplicar.

---

## 8. Roteiro de demo

Sequência sugerida para apresentar o sistema a um cliente ou avaliador:

### Preparação (antes da demo)
- [ ] Criar 2 usuários no Supabase Auth: um com role `admin`, outro com role `broker`
- [ ] Criar 1 empreendimento com foto e pelo menos 3 unidades disponíveis
- [ ] Abrir o sistema em 2 abas no browser (para demonstrar o Realtime)

### Roteiro (≈ 10 minutos)

**1. Login e home (1 min)**
- Logue como admin → mostre a home com KPIs
- Mostre o link para o Painel Administrativo

**2. Criar lead (1 min)**
- Vá para `/leads/new`
- Cadastre um lead com nome, telefone e origem "Facebook"
- Mostre que o sistema redireciona para o detalhe do lead

**3. Timeline de atividades (1 min)**
- No detalhe do lead, registre uma atividade do tipo "Ligação"
- Mostre a timeline sendo atualizada

**4. Kanban ao vivo (2 min)**
- No detalhe do lead, atribua a etapa "Novo Contato"
- Abra `/kanban` na segunda aba
- Volte para a primeira aba, arraste o card para "Qualificação"
- Mostre que a segunda aba atualiza **sem recarregar**

**5. Empreendimento e unidades (1 min)**
- Vá para `/enterprises`
- Abra o empreendimento criado
- Mostre as unidades com filtro de status

**6. Criar e aprovar proposta (2 min)**
- No detalhe do lead, clique em "+ Criar proposta"
- Selecione o empreendimento → unidade → preencha o valor
- Submeta → proposta vai para "Aguardando aprovação"
- Como admin, clique em "Aprovar e reservar unidade"
- Mostre que a unidade mudou para "Reservada" no empreendimento

**7. PWA instalável (1 min)**
- No celular (ou Chrome desktop), abra o site
- Mostre o prompt de instalação ("Adicionar à tela inicial")
- Mostre o botão de ativar notificações push

**8. Dashboard KPIs (1 min)**
- Vá para `/admin`
- Mostre os KPIs atualizados refletindo as ações da demo
