const express = require('express');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const cors = require('cors');
const WhatsAppService = require('./whatsapp');
require('dotenv').config({ path: __dirname + '/config.env' });

const app = express();
const PORT = process.env.PORT || 3000;

// Inicializar WhatsApp Service
const whatsappService = new WhatsAppService();
whatsappService.initialize();

// Armazenamento temporário de pedidos (em produção, usar banco de dados)
const pendingOrders = new Map();

// Middleware de segurança
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'file://'], // Permitir arquivos locais
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting básico
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por IP por janela
    message: 'Muitas tentativas, tente novamente em 15 minutos',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);

// Middleware para parsing seguro
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Headers de segurança
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

app.use(express.static(__dirname + '/../')); // Servir arquivos estáticos do diretório pai
app.use('/assets', express.static(__dirname + '/../assets')); // Servir assets específicos

// Configuração do Mercado Pago
const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
    options: {
        timeout: 5000,
        idempotencyKey: 'abc'
    }
});

const preference = new Preference(client);
const payment = new Payment(client);

// Função de validação de dados
function validateOrderData(items, customer, address) {
    const errors = [];

    // Validar itens
    if (!items || !Array.isArray(items) || items.length === 0) {
        errors.push('Array de itens é obrigatório');
    } else {
        items.forEach((item, index) => {
            if (!item.id || !item.name || !item.price || !item.quantity) {
                errors.push(`Item ${index + 1}: dados incompletos`);
            }
            if (typeof item.price !== 'number' || item.price <= 0) {
                errors.push(`Item ${index + 1}: preço inválido`);
            }
            if (typeof item.quantity !== 'number' || item.quantity <= 0) {
                errors.push(`Item ${index + 1}: quantidade inválida`);
            }
        });
    }

    // Validar cliente
    if (!customer || !customer.name || !customer.phone) {
        errors.push('Dados do cliente são obrigatórios');
    } else {
        if (customer.name.length < 2) {
            errors.push('Nome deve ter pelo menos 2 caracteres');
        }
        if (!/^[\d\s\(\)\-\+]+$/.test(customer.phone)) {
            errors.push('Telefone deve conter apenas números e caracteres válidos');
        }
    }

    // Validar endereço
    if (!address || !address.street || !address.city) {
        errors.push('Endereço de entrega é obrigatório');
    } else {
        if (address.street.length < 5) {
            errors.push('Endereço deve ter pelo menos 5 caracteres');
        }
        if (address.city.length < 2) {
            errors.push('Cidade deve ter pelo menos 2 caracteres');
        }
    }

    return errors;
}

// Endpoint para criar preferência de pagamento
app.post('/api/create_preference', async (req, res) => {
    try {
        const { items, customer, address } = req.body;

        // Validar dados de entrada
        const validationErrors = validateOrderData(items, customer, address);
        if (validationErrors.length > 0) {
            return res.status(400).json({ 
                error: 'Dados inválidos',
                details: validationErrors
            });
        }

        // Debug: verificar token
        console.log('🔑 Token configurado:', process.env.MP_ACCESS_TOKEN ? 'SIM' : 'NÃO');
        console.log('🔑 Token length:', process.env.MP_ACCESS_TOKEN ? process.env.MP_ACCESS_TOKEN.length : 0);
        console.log('🔑 Token preview:', process.env.MP_ACCESS_TOKEN ? process.env.MP_ACCESS_TOKEN.substring(0, 20) + '...' : 'NENHUM');

        // Forçar uso do Mercado Pago real (remover modo demo)

        // Mapear itens do carrinho para o formato do Mercado Pago
        const preferenceItems = items.map(item => ({
            id: item.id,
            title: item.name,
            description: `${item.color} / ${item.size}`,
            quantity: item.quantity,
            unit_price: parseFloat(item.price),
            currency_id: 'BRL',
            picture_url: `http://localhost:${PORT}/${item.img}`
        }));

        // Calcular total dos produtos (sem frete)
        const total = items.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);

        // Criar preferência
        const preferenceData = {
            items: preferenceItems,
            back_urls: {
                success: `http://localhost:${PORT}/success`,
                failure: `http://localhost:${PORT}/failure`,
                pending: `http://localhost:${PORT}/pending`
            },
            external_reference: `nash_${Date.now()}`,
            notification_url: `http://localhost:${PORT}/api/webhook`,
            payment_methods: {
                excluded_payment_methods: [],
                excluded_payment_types: [],
                installments: 12
            },
            additional_info: `Compra na NASH COMPANY - Cliente: ${customer.name} - Total: R$ ${total.toFixed(2)}`,
            payer: {
                name: customer.name,
                phone: {
                    number: customer.phone.replace(/\D/g, '')
                }
            }
        };

        const response = await preference.create({ body: preferenceData });

        console.log('Preferência criada:', response.id);
        console.log('Items:', preferenceItems);

        // Armazenar dados do pedido temporariamente
        const orderId = response.id;
        pendingOrders.set(orderId, {
            customer,
            address,
            items,
            total,
            paymentMethod: 'PIX/Cartão/Boleto',
            timestamp: Date.now()
        });

        // Limpar pedidos antigos (mais de 1 hora)
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        for (const [id, order] of pendingOrders.entries()) {
            if (order.timestamp < oneHourAgo) {
                pendingOrders.delete(id);
            }
        }

        res.json({
            id: response.id,
            init_point: response.init_point,
            sandbox_init_point: response.sandbox_init_point
        });

    } catch (error) {
        console.error('❌ Erro ao criar preferência:', error);
        
        // Retornar erro real para debug
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            details: error.message,
            token_configured: !!process.env.MP_ACCESS_TOKEN
        });
    }
});

// Endpoint para webhook do Mercado Pago
app.post('/api/webhook', async (req, res) => {
    try {
        console.log('📨 Webhook recebido:', req.body);
        
        const { type, data } = req.body;
        
        if (type === 'payment') {
            const paymentId = data.id;
            console.log(`💳 Processando pagamento: ${paymentId}`);
            
            // Buscar detalhes do pagamento
            const paymentDetails = await payment.get({ id: paymentId });
            console.log('📋 Detalhes do pagamento:', paymentDetails);
            
            // Verificar se o pagamento foi aprovado
            if (paymentDetails.status === 'approved') {
                console.log('✅ Pagamento aprovado! Enviando notificações automaticamente...');
                
                // Buscar dados do pedido armazenados
                const orderId = paymentDetails.external_reference;
                const storedOrder = pendingOrders.get(orderId);
                
                if (storedOrder) {
                    console.log('📋 Dados do pedido encontrados:', storedOrder);
                    
                    try {
                        // Enviar notificação para o admin automaticamente
                        const adminResult = await whatsappService.sendOrderNotificationToAdmin(storedOrder);
                        console.log('📱 Notificação para admin enviada:', adminResult.method);
                        
                        // Enviar confirmação para o cliente automaticamente
                        const customerResult = await whatsappService.sendOrderConfirmationToCustomer(storedOrder);
                        console.log('📱 Confirmação para cliente enviada:', customerResult.method);
                        
                        console.log('✅ Todas as notificações foram enviadas automaticamente!');
                        
                        // Remover pedido da memória após processar
                        pendingOrders.delete(orderId);
                        
                    } catch (error) {
                        console.error('❌ Erro ao enviar notificações automáticas:', error);
                        // Mesmo com erro, remover da memória para evitar reprocessamento
                        pendingOrders.delete(orderId);
                    }
                } else {
                    console.log('⚠️ Dados do pedido não encontrados para:', orderId);
                }
            } else {
                console.log(`⚠️ Pagamento não aprovado. Status: ${paymentDetails.status}`);
            }
        }
        
        res.status(200).send('OK');
    } catch (error) {
        console.error('❌ Erro no webhook:', error);
        res.status(500).send('Erro interno');
    }
});

// Páginas de retorno do Mercado Pago
app.get('/success', async (req, res) => {
    const isDemo = req.query.demo === 'true';
    const total = req.query.total || '0,00';
    
    // Buscar dados do pedido pelo external_reference
    let orderData = null;
    if (req.query.payment_id) {
        try {
            const paymentDetails = await payment.get({ id: req.query.payment_id });
            const orderId = paymentDetails.external_reference;
            orderData = pendingOrders.get(orderId);
            
            if (orderData) {
                console.log('📋 Dados do pedido encontrados na página de sucesso:', orderData);
                
                // Enviar notificações se ainda não foram enviadas
                try {
                    const adminUrl = await whatsappService.sendOrderNotificationToAdmin(orderData);
                    const customerUrl = await whatsappService.sendOrderConfirmationToCustomer(orderData);
                    
                    console.log('📱 Notificações criadas na página de sucesso!');
                    console.log(`🔗 Admin: ${adminUrl}`);
                    console.log(`🔗 Cliente: ${customerUrl}`);
                    
                    // Remover pedido da memória após processar
                    pendingOrders.delete(orderId);
                } catch (error) {
                    console.error('❌ Erro ao enviar notificações:', error);
                }
            }
        } catch (error) {
            console.error('❌ Erro ao buscar dados do pagamento:', error);
        }
    }
    
    res.send(`
        <!DOCTYPE html>
        <html lang="pt-br">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pagamento Aprovado - NASH COMPANY</title>
            <style>
                body { 
                    font-family: 'Inter', sans-serif; 
                    background: #000; 
                    color: #fff; 
                    text-align: center; 
                    padding: 50px; 
                }
                .success-container { 
                    max-width: 600px; 
                    margin: 0 auto; 
                    background: #0a0a0a; 
                    padding: 40px; 
                    border: 1px solid #222; 
                    border-radius: 10px; 
                }
                h1 { color: #25D366; margin-bottom: 20px; }
                p { margin-bottom: 15px; color: #ccc; }
                .whatsapp-btn { 
                    display: inline-block; 
                    background: #25D366; 
                    color: #fff; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    margin-top: 20px; 
                    font-weight: 600; 
                }
                .demo-notice {
                    background: #1a1a1a;
                    border: 1px solid #333;
                    border-radius: 5px;
                    padding: 15px;
                    margin-bottom: 20px;
                    color: #ffd700;
                }
            </style>
        </head>
        <body>
            <div class="success-container">
                ${isDemo ? `
                <div class="demo-notice">
                    <strong>🎭 MODO DE DEMONSTRAÇÃO</strong><br>
                    Esta é uma simulação do processo de pagamento.<br>
                    Total simulado: R$ ${total}
                </div>
                ` : ''}
                <h1>✅ Pagamento Aprovado!</h1>
                <p>Seu pedido foi processado com sucesso.</p>
                <p>As notificações foram enviadas via WhatsApp!</p>
                <div style="background: #1a1a1a; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <h3 style="color: #25D366; margin-bottom: 15px;">📱 Notificações Enviadas Automaticamente:</h3>
                    <p style="margin-bottom: 10px;">✅ Admin notificado automaticamente (71988689508)</p>
                    <p style="margin-bottom: 10px;">✅ Cliente notificado automaticamente (${orderData ? orderData.customer.phone : 'N/A'})</p>
                    <p style="color: #25D366; font-size: 14px; font-weight: bold;">🎉 Mensagens enviadas automaticamente via WhatsApp!</p>
                    <p style="color: #ccc; font-size: 12px;">As mensagens foram processadas e enviadas automaticamente. Verifique seu WhatsApp.</p>
                </div>
                <a href="https://wa.me/5571988689508" class="whatsapp-btn" target="_blank">
                    Entrar em Contato
                </a>
                <p><a href="/" style="color: #fff;">← Voltar ao Site</a></p>
            </div>
        </body>
        </html>
    `);
});

app.get('/pending', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="pt-br">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pagamento Pendente - NASH COMPANY</title>
            <style>
                body { 
                    font-family: 'Inter', sans-serif; 
                    background: #000; 
                    color: #fff; 
                    text-align: center; 
                    padding: 50px; 
                }
                .pending-container { 
                    max-width: 600px; 
                    margin: 0 auto; 
                    background: #0a0a0a; 
                    padding: 40px; 
                    border: 1px solid #222; 
                    border-radius: 10px; 
                }
                h1 { color: #ffd700; margin-bottom: 20px; }
                p { margin-bottom: 15px; color: #ccc; }
                .whatsapp-btn { 
                    display: inline-block; 
                    background: #25D366; 
                    color: #fff; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    margin-top: 20px; 
                    font-weight: 600; 
                }
            </style>
        </head>
        <body>
            <div class="pending-container">
                <h1>⏳ Pagamento Pendente</h1>
                <p>Seu pagamento está sendo processado.</p>
                <p>Você receberá uma confirmação por e-mail quando for aprovado.</p>
                <a href="https://wa.me/5571988689508" class="whatsapp-btn" target="_blank">
                    Entrar em Contato
                </a>
                <p><a href="/" style="color: #fff;">← Voltar ao Site</a></p>
            </div>
        </body>
        </html>
    `);
});

app.get('/failure', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="pt-br">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pagamento Não Aprovado - NASH COMPANY</title>
            <style>
                body { 
                    font-family: 'Inter', sans-serif; 
                    background: #000; 
                    color: #fff; 
                    text-align: center; 
                    padding: 50px; 
                }
                .failure-container { 
                    max-width: 600px; 
                    margin: 0 auto; 
                    background: #0a0a0a; 
                    padding: 40px; 
                    border: 1px solid #222; 
                    border-radius: 10px; 
                }
                h1 { color: #ff4444; margin-bottom: 20px; }
                p { margin-bottom: 15px; color: #ccc; }
                .whatsapp-btn { 
                    display: inline-block; 
                    background: #25D366; 
                    color: #fff; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    margin-top: 20px; 
                    font-weight: 600; 
                }
            </style>
        </head>
        <body>
            <div class="failure-container">
                <h1>❌ Pagamento Não Aprovado</h1>
                <p>Houve um problema com seu pagamento.</p>
                <p>Entre em contato conosco para tentar novamente.</p>
                <a href="https://wa.me/5571988689508" class="whatsapp-btn" target="_blank">
                    Entrar em Contato
                </a>
                <p><a href="/" style="color: #fff;">← Voltar ao Site</a></p>
            </div>
        </body>
        </html>
    `);
});

// Rota principal - servir o index.html
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: __dirname + '/../' });
});

// Rota para página de administração
app.get('/admin', (req, res) => {
    res.sendFile('admin.html', { root: __dirname + '/../' });
});

// Endpoint para visualizar mensagens WhatsApp
app.get('/admin/messages', (req, res) => {
    const fs = require('fs');
    const path = require('path');
    
    const logFile = path.join(__dirname, '..', 'logs', 'whatsapp-messages.json');
    
    if (!fs.existsSync(logFile)) {
        return res.json({ messages: [], message: 'Nenhuma mensagem encontrada' });
    }
    
    try {
        const messages = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        
        // Estatísticas das mensagens
        const stats = {
            total: messages.length,
            sent: messages.filter(m => m.status === 'sent').length,
            pending: messages.filter(m => m.status === 'pending').length,
            error: messages.filter(m => m.status === 'error').length
        };
        
        res.json({ 
            messages: messages.reverse(), // Mais recentes primeiro
            stats,
            lastUpdate: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao ler mensagens' });
    }
});

// Endpoint para reenviar mensagens pendentes
app.post('/admin/resend-message/:messageId', async (req, res) => {
    try {
        const { messageId } = req.params;
        const fs = require('fs');
        const path = require('path');
        
        const logFile = path.join(__dirname, '..', 'logs', 'whatsapp-messages.json');
        
        if (!fs.existsSync(logFile)) {
            return res.status(404).json({ error: 'Arquivo de mensagens não encontrado' });
        }
        
        const messages = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        const message = messages.find(m => m.id === messageId);
        
        if (!message) {
            return res.status(404).json({ error: 'Mensagem não encontrada' });
        }
        
        // Tentar reenviar a mensagem
        const result = await whatsappService.sendMessage(message.phoneNumber, message.message);
        
        // Atualizar status da mensagem
        message.status = result.success ? 'sent' : 'error';
        message.lastAttempt = new Date().toISOString();
        
        fs.writeFileSync(logFile, JSON.stringify(messages, null, 2));
        
        res.json({ 
            success: result.success, 
            method: result.method,
            message: result.success ? 'Mensagem reenviada com sucesso' : 'Erro ao reenviar mensagem'
        });
        
    } catch (error) {
        console.error('❌ Erro ao reenviar mensagem:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor NASH COMPANY rodando na porta ${PORT}`);
    console.log(`📱 Frontend: http://localhost:${PORT}`);
    console.log(`🔧 API: http://localhost:${PORT}/api/create_preference`);
    console.log(`👨‍💼 Admin: http://localhost:${PORT}/admin`);
    console.log(`📊 Mensagens: http://localhost:${PORT}/admin/messages`);
    console.log(`⚠️  Certifique-se de configurar o MP_ACCESS_TOKEN no arquivo config.env`);
    console.log(`📱 WhatsApp automático configurado para: ${process.env.ADMIN_WHATSAPP || '71988689508'}`);
});
