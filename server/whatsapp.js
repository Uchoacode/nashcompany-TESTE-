const axios = require('axios');
const https = require('https');

class WhatsAppService {
    constructor() {
        this.isReady = true; // Sempre pronto para usar a API
        this.adminNumber = process.env.ADMIN_WHATSAPP || '5571988689508';
        this.apiKey = process.env.WHATSAPP_API_KEY;
        this.apiUrl = process.env.WHATSAPP_API_URL || 'https://api.whatsapp.com';
    }

    async initialize() {
        console.log('🚀 WhatsApp Service inicializado (modo API)');
        console.log('📱 Notificações serão enviadas via WhatsApp Web API');
        console.log('🔑 API Key configurada:', !!this.apiKey);
    }

    async sendMessage(phoneNumber, message) {
        try {
            // Formatar número para o padrão internacional
            const formattedNumber = this.formatPhoneNumber(phoneNumber);
            
            console.log(`📤 Enviando mensagem para ${formattedNumber}`);
            console.log(`📝 Mensagem: ${message.substring(0, 100)}...`);
            
            // Tentar envio automático primeiro
            if (this.apiKey) {
                try {
                    await this.sendMessageViaAPI(formattedNumber, message);
                    console.log('✅ Mensagem enviada automaticamente via API');
                    this.saveMessageToFile(phoneNumber, message, 'sent');
                    return { success: true, method: 'api' };
                } catch (apiError) {
                    console.warn('⚠️ Falha no envio automático, usando método alternativo:', apiError.message);
                }
            }
            
            // Método alternativo: WhatsApp Web
            const whatsappUrl = `https://wa.me/${formattedNumber.replace('@c.us', '')}?text=${encodeURIComponent(message)}`;
            
            console.log(`🔗 Link WhatsApp gerado: ${whatsappUrl}`);
            console.log('✅ Link de mensagem criado com sucesso!');
            
            // Salvar mensagem em arquivo para referência
            this.saveMessageToFile(phoneNumber, message, 'pending');
            
            return { success: true, method: 'web', url: whatsappUrl };
            
        } catch (error) {
            console.error('❌ Erro ao enviar mensagem:', error);
            this.saveMessageToFile(phoneNumber, message, 'error');
            throw error;
        }
    }

    async sendMessageViaAPI(phoneNumber, message) {
        if (!this.apiKey) {
            throw new Error('API Key não configurada');
        }

        const payload = {
            to: phoneNumber,
            message: message,
            type: 'text'
        };

        const response = await axios.post(`${this.apiUrl}/send`, payload, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000,
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            })
        });

        if (response.status !== 200) {
            throw new Error(`API retornou status ${response.status}`);
        }

        return response.data;
    }

    formatPhoneNumber(phoneNumber) {
        // Remove todos os caracteres não numéricos
        let cleanNumber = phoneNumber.replace(/\D/g, '');
        
        // Se não começar com 55 (Brasil), adiciona
        if (!cleanNumber.startsWith('55')) {
            cleanNumber = '55' + cleanNumber;
        }
        
        return cleanNumber;
    }

    saveMessageToFile(phoneNumber, message, status = 'pending') {
        const fs = require('fs');
        const path = require('path');
        
        const logDir = path.join(__dirname, '..', 'logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            phoneNumber,
            message,
            status,
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        
        const logFile = path.join(logDir, 'whatsapp-messages.json');
        let messages = [];
        
        if (fs.existsSync(logFile)) {
            try {
                messages = JSON.parse(fs.readFileSync(logFile, 'utf8'));
            } catch (error) {
                console.warn('⚠️ Erro ao ler arquivo de mensagens, criando novo:', error.message);
                messages = [];
            }
        }
        
        messages.push(logEntry);
        
        // Manter apenas as últimas 100 mensagens para não sobrecarregar
        if (messages.length > 100) {
            messages = messages.slice(-100);
        }
        
        fs.writeFileSync(logFile, JSON.stringify(messages, null, 2));
        
        console.log(`📝 Mensagem salva em: ${logFile} (Status: ${status})`);
    }

    async sendOrderNotificationToAdmin(orderData) {
        const message = this.formatAdminMessage(orderData);
        const adminNumber = process.env.ADMIN_WHATSAPP || '5571988689508';
        
        try {
            const result = await this.sendMessage(adminNumber, message);
            console.log('📧 Notificação enviada para o admin:', result.method);
            return result;
        } catch (error) {
            console.error('❌ Erro ao enviar notificação para admin:', error);
            throw error;
        }
    }

    async sendOrderConfirmationToCustomer(customerData) {
        const message = this.formatCustomerMessage(customerData);
        
        try {
            const customerPhone = customerData.customer?.phone || customerData.phone;
            const result = await this.sendMessage(customerPhone, message);
            console.log('📧 Confirmação enviada para o cliente:', result.method);
            return result;
        } catch (error) {
            console.error('❌ Erro ao enviar confirmação para cliente:', error);
            throw error;
        }
    }

    formatAdminMessage(orderData) {
        const { customer, items, total, paymentMethod, address } = orderData;
        
        const itemsText = items.map(item => 
            `• ${item.name} - ${item.color} / ${item.size} (x${item.quantity})`
        ).join('\n');

        const isFromSalvador = this.isFromSalvador(address);

        return `Salve, Nash! 👋

Novo pedido confirmado no site da Nash Company 🖤

🧾 Dados do pedido:
• Cliente: ${customer.name}
• Telefone: ${customer.phone}
• Produtos:
${itemsText}
• Valor total: R$ ${total.toFixed(2).replace('.', ',')}

📍 Endereço de entrega:
${address.street}, ${address.number}
${address.neighborhood}, ${address.city} - ${address.state}
CEP: ${address.zipCode}

🏙️ Localidade:
${isFromSalvador ? 'Salvador' : 'Fora de Salvador'}

💳 Forma de pagamento: ${paymentMethod}
🕒 Status: Pagamento confirmado ✅

👉 Logo após a confirmação do pagamento, iremos ver como via funcionar a entrega.`;
    }

    formatCustomerMessage(customerData) {
        const { items, total, address } = customerData;
        
        const itemsText = items.map(item => 
            `• ${item.name} - ${item.color} / ${item.size} (x${item.quantity})`
        ).join('\n');

        const isFromSalvador = this.isFromSalvador(address);

        return `Olá! 👋

Seu pedido foi confirmado na NASH COMPANY! 🖤

🧾 Resumo do seu pedido:
${itemsText}

💰 Valor total: R$ ${total.toFixed(2).replace('.', ',')}

📍 Entrega será feita em:
${address.street}, ${address.number}
${address.neighborhood}, ${address.city} - ${address.state}

🏙️ Localidade: ${isFromSalvador ? 'Salvador' : 'Fora de Salvador'}

✅ Pagamento confirmado! Logo após a confirmação do pagamento, iremos ver como via funcionar a entrega.

Obrigado por escolher a NASH COMPANY! 🖤`;
    }

    isFromSalvador(address) {
        if (!address || !address.city) return false;
        
        const city = address.city.toLowerCase();
        return city.includes('salvador') || city.includes('ssa');
    }

    async close() {
        if (this.client) {
            await this.client.destroy();
        }
    }
}

module.exports = WhatsAppService;
