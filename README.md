# 🖤 NASH COMPANY - Site Oficial

Sistema completo de e-commerce com integração WhatsApp automática e máxima segurança.

## ✨ Funcionalidades Principais

### 🛒 E-commerce Completo
- **Catálogo de produtos** com imagens e descrições
- **Carrinho de compras** persistente no localStorage
- **Checkout seguro** via Mercado Pago
- **Design responsivo** para mobile e desktop

### 📱 WhatsApp Automático
- **Envio automático** de notificações quando pagamento é aprovado
- **Notificação para admin** (71988689508) com detalhes do pedido
- **Confirmação para cliente** com resumo da compra
- **Sistema de fallback** com links WhatsApp Web
- **Monitoramento** de status das mensagens

### 🔒 Segurança Avançada
- **Rate limiting** (100 requests/15min por IP)
- **Headers de segurança** (XSS, Clickjacking, etc.)
- **Validação rigorosa** de todos os dados de entrada
- **CORS configurado** apenas para domínios autorizados
- **Limites de payload** para prevenir DoS
- **Logs seguros** sem exposição de dados sensíveis

### 👨‍💼 Painel Administrativo
- **Monitoramento** de mensagens WhatsApp em tempo real
- **Estatísticas** de envios (enviadas, pendentes, com erro)
- **Reenvio** de mensagens pendentes
- **Histórico completo** de todas as notificações

## 🚀 Como Executar

### 1. Instalação
```bash
npm install
```

### 2. Configuração
Edite o arquivo `server/config.env`:
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
NODE_ENV=development
```

### 3. Iniciar Servidor
```bash
npm start
```

### 4. Acessar
- **Site**: http://localhost:3000
- **Admin**: http://localhost:3000/admin
- **API**: http://localhost:3000/api/create_preference

## 🧪 Testes

Execute o script de teste de integração:
```bash
node test-integration.js
```

## 📁 Estrutura do Projeto

```
├── assets/              # Imagens e recursos
│   └── images/         # Produtos e logo
├── css/                # Estilos CSS
│   ├── main.css        # Estilos principais
│   ├── _layout.css     # Layout responsivo
│   ├── _products.css   # Estilos dos produtos
│   └── _modals.css     # Modais e popups
├── js/                 # JavaScript frontend
│   ├── main.js         # Lógica principal
│   ├── cart.js         # Carrinho de compras
│   └── ui.js           # Interface do usuário
├── server/             # Backend Node.js
│   ├── index.js        # Servidor principal
│   ├── whatsapp.js     # Serviço WhatsApp
│   └── config.env      # Configurações
├── logs/               # Logs do sistema
│   └── whatsapp-messages.json
├── admin.html          # Painel administrativo
├── index.html          # Página principal
├── camisa-1.html       # Página do produto 1
├── camisa-2.html       # Página do produto 2
└── SECURITY.md         # Documentação de segurança
```

## 🔧 Configuração do Mercado Pago

1. **Criar conta** no [Mercado Pago](https://www.mercadopago.com.br)
2. **Obter Access Token** na seção de credenciais
3. **Configurar webhook** para `http://seu-dominio.com/api/webhook`
4. **Testar** com cartões de teste

### Cartões de Teste
- **Aprovado**: 4009 1753 3280 6176
- **Pendente**: 4000 0000 0000 0002
- **Rejeitado**: 4000 0000 0000 0004

## 📱 Configuração WhatsApp

### Método 1: API Externa (Recomendado)
1. Configure `WHATSAPP_API_KEY` no `config.env`
2. Configure `WHATSAPP_API_URL` se necessário
3. Mensagens serão enviadas automaticamente

### Método 2: WhatsApp Web (Fallback)
- Sistema gera links automáticos
- Mensagens são salvas para envio manual
- Acesse `/admin` para monitorar

## 🛡️ Segurança

### Medidas Implementadas
- ✅ Rate limiting (100 req/15min)
- ✅ Headers de segurança
- ✅ Validação de dados
- ✅ CORS configurado
- ✅ Limites de payload
- ✅ Logs seguros

### Para Produção
- [ ] Configurar HTTPS
- [ ] Usar proxy reverso
- [ ] Implementar autenticação admin
- [ ] Configurar backup
- [ ] Monitoramento externo

## 📊 Monitoramento

### Endpoints Disponíveis
- `GET /admin` - Painel administrativo
- `GET /admin/messages` - API de mensagens
- `POST /admin/resend-message/:id` - Reenviar mensagem

### Logs
- **Mensagens**: `logs/whatsapp-messages.json`
- **Servidor**: Console do Node.js
- **Erros**: Logs detalhados sem dados sensíveis

## 🚨 Troubleshooting

### Problemas Comuns

**Servidor não inicia:**
```bash
# Verificar se a porta 3000 está livre
lsof -i :3000
# Matar processo se necessário
kill -9 PID
```

**Mensagens não são enviadas:**
1. Verificar configuração do WhatsApp
2. Acessar `/admin` para ver status
3. Verificar logs em `logs/whatsapp-messages.json`

**Pagamento não processa:**
1. Verificar `MP_ACCESS_TOKEN` no `config.env`
2. Testar com cartões de teste
3. Verificar logs do servidor

## 📞 Suporte

- **Admin WhatsApp**: 71988689508
- **Logs**: Verificar arquivo de logs
- **Status**: Acessar `/admin` para monitoramento

## 🔄 Atualizações

Para manter o sistema atualizado:
```bash
# Atualizar dependências
npm update

# Verificar vulnerabilidades
npm audit

# Instalar correções
npm audit fix
```

## 📄 Licença

Projeto proprietário da NASH COMPANY.