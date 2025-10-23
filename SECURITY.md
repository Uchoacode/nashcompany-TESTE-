# 🔒 Guia de Segurança - NASH COMPANY

## Medidas de Segurança Implementadas

### 1. Rate Limiting
- **Limite**: 100 requests por IP a cada 15 minutos
- **Proteção**: Contra ataques de força bruta e spam
- **Configuração**: `express-rate-limit` com janela deslizante

### 2. Headers de Segurança
- `X-Content-Type-Options: nosniff` - Previne MIME type sniffing
- `X-Frame-Options: DENY` - Previne clickjacking
- `X-XSS-Protection: 1; mode=block` - Proteção contra XSS
- `Referrer-Policy: strict-origin-when-cross-origin` - Controle de referrer

### 3. Validação de Dados
- **Entrada**: Validação rigorosa de todos os dados de entrada
- **Sanitização**: Limpeza de dados antes do processamento
- **Tipos**: Verificação de tipos de dados (string, number, array)
- **Tamanhos**: Limites de tamanho para campos de texto

### 4. CORS Configurado
- **Origins**: Apenas domínios autorizados
- **Métodos**: Apenas métodos necessários (GET, POST, PUT, DELETE)
- **Headers**: Headers específicos autorizados

### 5. Limites de Payload
- **JSON**: Máximo 10MB por request
- **URL Encoded**: Máximo 10MB por request
- **Proteção**: Contra ataques de DoS por payload grande

### 6. Armazenamento Seguro
- **Pedidos**: Armazenamento temporário em memória
- **Limpeza**: Remoção automática de pedidos antigos (1 hora)
- **Logs**: Rotação automática de logs (máximo 100 mensagens)

### 7. Tratamento de Erros
- **Logs**: Logs detalhados sem exposição de dados sensíveis
- **Respostas**: Mensagens de erro genéricas para clientes
- **Debug**: Informações de debug apenas em desenvolvimento

## Configurações Recomendadas

### Variáveis de Ambiente
```env
# Mercado Pago (OBRIGATÓRIO)
MP_ACCESS_TOKEN=seu_token_do_mercadopago

# WhatsApp (OPCIONAL - para envio automático)
WHATSAPP_API_KEY=sua_api_key_do_whatsapp
WHATSAPP_API_URL=https://api.whatsapp.com

# Admin
ADMIN_WHATSAPP=5571988689508

# Servidor
PORT=3000
NODE_ENV=production
```

### Firewall e Rede
- **Porta**: Use apenas a porta 3000 ou configure proxy reverso
- **HTTPS**: Configure SSL/TLS em produção
- **Firewall**: Bloqueie portas desnecessárias

### Monitoramento
- **Logs**: Monitore logs de erro regularmente
- **Rate Limiting**: Acompanhe tentativas de rate limiting
- **Mensagens**: Verifique status das mensagens WhatsApp

## Checklist de Segurança

### ✅ Implementado
- [x] Rate limiting
- [x] Headers de segurança
- [x] Validação de dados
- [x] CORS configurado
- [x] Limites de payload
- [x] Tratamento de erros
- [x] Logs seguros
- [x] Limpeza automática de dados

### 🔄 Recomendado para Produção
- [ ] Configurar HTTPS
- [ ] Usar proxy reverso (Nginx/Apache)
- [ ] Implementar autenticação para admin
- [ ] Configurar backup automático
- [ ] Monitoramento com ferramentas externas
- [ ] Testes de penetração

## Contatos de Emergência

Em caso de problemas de segurança:
- **Admin**: 71988689508
- **Logs**: Verificar arquivo `logs/whatsapp-messages.json`
- **Status**: Acessar `/admin` para monitoramento

## Atualizações de Segurança

Este sistema deve ser atualizado regularmente:
- **Dependências**: `npm audit`
- **Sistema**: Manter SO atualizado
- **Node.js**: Usar versão LTS estável
