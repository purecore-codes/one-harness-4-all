# WhatsApp Agent Configuration

## Visão Geral

Este diretório contém exemplos de configuração para agentes de WhatsApp usando o framework HARNESS. Os agentes são definidos via YAML ou JSON e suportam:

- **Regras baseadas em condições** para respostas automáticas
- **Fluxos de conversação** com estados e transições
- **Chamadas de função** para integração com sistemas externos
- **IA/LLM** para respostas inteligentes
- **Rate limiting** e gerenciamento de sessão
- **Analytics** para rastreamento de métricas

## Estrutura da Configuração

```json
{
  "agentId": "uuid",
  "name": "string",
  "version": "semver",
  "whatsapp": { /* configuração do provider */ },
  "session": { /* configuração de sessão */ },
  "rateLimit": { /* configuração de rate limit */ },
  "rules": [ /* array de regras */ ],
  "flows": [ /* array de fluxos */ ],
  "functions": [ /* array de funções */ ],
  "ai": { /* configuração de IA opcional */ },
  "analytics": { /* configuração de analytics */ },
  "defaultResponses": { /* respostas padrão */ }
}
```

## Exemplos Incluídos

### 1. Customer Support Bot (`customer-support-bot.json`)

Bot completo de atendimento ao cliente com:
- Respostas a saudações
- Menu de opções interativo
- Abertura de chamados de suporte
- Localização de lojas próximas
- Escalamento para atendente humano
- Fluxo de onboarding de novos usuários
- Integração com OpenAI para respostas inteligentes

## Como Usar

### Carregar Configuração via Código

```typescript
import { whatsappAgentParser } from './src/agents/whatsapp/parser';
import { HarnessGenerator } from './src/factory/HarnessGenerator';

// Parse de arquivo JSON
const result = await whatsappAgentParser.parse({
  type: 'file',
  filePath: './examples/whatsapp-agent/customer-support-bot.json'
});

if (result.success && result.config) {
  // Gerar o agent harness
  const generator = new HarnessGenerator();
  const harness = await generator.generate(result.config, {
    autoInitialize: true,
    autoStart: true
  });
}
```

### Criar Template Base

```typescript
import { whatsappAgentParser } from './src/agents/whatsapp/parser';

const parser = new WhatsAppAgentParser();

// Criar template básico
const template = parser.createTemplate({
  withAI: true,
  withFlows: true,
  provider: 'meta-cloud-api'
});

// Salvar como arquivo e editar
```

### Validar Configuração

```typescript
import { whatsappAgentValidator } from './src/agents/whatsapp/validator';

const validation = whatsappAgentValidator.validate(config);

if (!validation.valid) {
  console.error('Erros de validação:', validation.errors);
  console.warn('Avisos:', validation.warnings);
}
```

## Operadores de Condição Disponíveis

| Operador | Descrição | Exemplo |
|----------|-----------|---------|
| `equals` | Igualdade exata | `{"operator": "equals", "value": "hello"}` |
| `not_equals` | Diferente | `{"operator": "not_equals", "value": "spam"}` |
| `contains` | Contém substring | `{"operator": "contains", "value": "ajuda"}` |
| `starts_with` | Começa com | `{"operator": "starts_with", "value": "!"}` |
| `ends_with` | Termina com | `{"operator": "ends_with", "value": "?"}` |
| `regex` | Expressão regular | `{"operator": "regex", "pattern": "^hi.*"}` |
| `greater_than` | Maior que | `{"operator": "greater_than", "value": 18}` |
| `less_than` | Menor que | `{"operator": "less_than", "value": 100}` |
| `in` | Em uma lista | `{"operator": "in", "values": ["a", "b", "c"]}` |
| `not_in` | Não está na lista | `{"operator": "not_in", "values": ["spam", "junk"]}` |
| `exists` | Campo existe | `{"operator": "exists"}` |
| `not_exists` | Campo não existe | `{"operator": "not_exists"}` |

## Tipos de Ação Disponíveis

| Tipo | Descrição |
|------|-----------|
| `reply_text` | Responder com texto |
| `reply_media` | Responder com mídia (imagem, vídeo, áudio, documento) |
| `send_template` | Enviar template do WhatsApp Business |
| `send_buttons` | Enviar mensagem com botões |
| `send_list` | Enviar lista de opções |
| `call_function` | Chamar função externa |
| `forward_message` | Encaminhar mensagem |
| `mark_read` | Marcar mensagem como lida |
| `typing_indicator` | Mostrar indicador de digitação |
| `presence_update` | Atualizar status de presença |

## Providers Suportados

- `twilio` - Twilio API for WhatsApp
- `meta-cloud-api` - Meta Cloud API (recomendado)
- `whatsapp-business-api` - WhatsApp Business API on-premise
- `360dialog` - 360dialog API
- `wenovate` - Wenovate API

## Variáveis de Ambiente

Use `${VAR_NAME}` para referenciar variáveis de ambiente:

```json
{
  "whatsapp": {
    "apiKey": "${WHATSAPP_API_KEY}",
    "phoneNumberId": "${WHATSAPP_PHONE_ID}"
  }
}
```

## Próximos Passos

1. Copie um dos exemplos
2. Edite as configurações conforme necessário
3. Valide a configuração
4. Integre com seu sistema
5. Deploy e monitore via analytics

## Documentação Completa

Para documentação completa, consulte:
- `/src/agents/whatsapp/types.ts` - Definições de tipo
- `/src/agents/whatsapp/validator.ts` - Regras de validação
- `/src/agents/whatsapp/parser.ts` - Parser de configurações
