const express = require('express');
const { MercadoPagoConfig, Preference } = require('mercadopago');
const cors = require('cors');
require('dotenv').config({ path: './config.env' });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'file://'], // Permitir arquivos locais
    credentials: true
}));
app.use(express.json());
app.use(express.static('../')); // Servir arquivos estáticos do diretório pai
app.use('/assets', express.static('../assets')); // Servir assets específicos

// Configuração do Mercado Pago
const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
    options: {
        timeout: 5000,
        idempotencyKey: 'abc'
    }
});

const preference = new Preference(client);

// Endpoint para criar preferência de pagamento
app.post('/api/create_preference', async (req, res) => {
    try {
        const { items } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ 
                error: 'Array de itens é obrigatório' 
            });
        }

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

        // Calcular total
        const total = items.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);

        // Criar preferência
        const preferenceData = {
            items: preferenceItems,
            back_urls: {
                success: process.env.SUCCESS_URL || `http://localhost:${PORT}/success`,
                failure: process.env.FAILURE_URL || `http://localhost:${PORT}/failure`,
                pending: process.env.PENDING_URL || `http://localhost:${PORT}/pending`
            },
            auto_return: 'all',
            external_reference: `nash_${Date.now()}`,
            notification_url: `http://localhost:${PORT}/api/webhook`,
            payment_methods: {
                excluded_payment_methods: [],
                excluded_payment_types: [],
                installments: 12
            },
            additional_info: `Compra na NASH COMPANY - Total: R$ ${total.toFixed(2)}`
        };

        const response = await preference.create({ body: preferenceData });

        console.log('Preferência criada:', response.id);
        console.log('Items:', preferenceItems);

        res.json({
            id: response.id,
            init_point: response.init_point,
            sandbox_init_point: response.sandbox_init_point
        });

    } catch (error) {
        console.error('Erro ao criar preferência:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor',
            details: error.message 
        });
    }
});

// Endpoint para webhook do Mercado Pago
app.post('/api/webhook', (req, res) => {
    console.log('Webhook recebido:', req.body);
    res.status(200).send('OK');
});

// Páginas de retorno do Mercado Pago
app.get('/success', (req, res) => {
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
            </style>
        </head>
        <body>
            <div class="success-container">
                <h1>✅ Pagamento Aprovado!</h1>
                <p>Seu pedido foi processado com sucesso.</p>
                <p>Em breve você receberá um contato via WhatsApp com os detalhes da entrega.</p>
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
    res.sendFile('index.html', { root: '../' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor NASH COMPANY rodando na porta ${PORT}`);
    console.log(`📱 Frontend: http://localhost:${PORT}`);
    console.log(`🔧 API: http://localhost:${PORT}/api/create_preference`);
    console.log(`⚠️  Certifique-se de configurar o MP_ACCESS_TOKEN no arquivo config.env`);
});
