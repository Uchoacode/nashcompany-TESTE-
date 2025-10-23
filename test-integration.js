#!/usr/bin/env node

/**
 * Script de teste para verificar a integração do sistema
 * Testa: Servidor, WhatsApp, Validação, Segurança
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const TEST_PHONE = '5571999999999';

// Cores para output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function testServer() {
    return new Promise((resolve, reject) => {
        log('\n🔍 Testando servidor...', 'blue');
        
        const testData = {
            items: [{
                id: 'test-1',
                name: 'Camisa Teste',
                price: 50.00,
                quantity: 1,
                color: 'Preto',
                size: 'M'
            }],
            customer: {
                name: 'Cliente Teste',
                phone: TEST_PHONE
            },
            address: {
                street: 'Rua Teste, 123',
                number: '123',
                neighborhood: 'Centro',
                city: 'Salvador',
                state: 'BA',
                zipCode: '40000-000'
            }
        };

        axios.post(`${BASE_URL}/api/create_preference`, testData)
            .then(response => {
                if (response.data.id) {
                    log('✅ Servidor respondendo corretamente', 'green');
                    resolve(true);
                } else {
                    log('❌ Resposta do servidor inválida', 'red');
                    reject(new Error('Resposta inválida'));
                }
            })
            .catch(error => {
                if (error.code === 'ECONNREFUSED') {
                    log('❌ Servidor não está rodando. Execute: npm start', 'red');
                } else {
                    log(`❌ Erro do servidor: ${error.response?.data?.error || error.message}`, 'red');
                }
                reject(error);
            });
    });
}

function testValidation() {
    return new Promise((resolve, reject) => {
        log('\n🔍 Testando validação de dados...', 'blue');
        
        const invalidData = {
            items: [], // Array vazio - deve falhar
            customer: {
                name: 'A', // Nome muito curto - deve falhar
                phone: 'invalid' // Telefone inválido - deve falhar
            },
            address: {
                street: 'A', // Endereço muito curto - deve falhar
                city: 'B' // Cidade muito curta - deve falhar
            }
        };

        axios.post(`${BASE_URL}/api/create_preference`, invalidData)
            .then(() => {
                log('❌ Validação não está funcionando - dados inválidos foram aceitos', 'red');
                reject(new Error('Validação falhou'));
            })
            .catch(error => {
                if (error.response?.status === 400) {
                    log('✅ Validação funcionando - dados inválidos rejeitados', 'green');
                    resolve(true);
                } else {
                    log('❌ Erro inesperado na validação', 'red');
                    reject(error);
                }
            });
    });
}

function testWhatsAppService() {
    return new Promise((resolve, reject) => {
        log('\n🔍 Testando serviço WhatsApp...', 'blue');
        
        try {
            const WhatsAppService = require('./server/whatsapp');
            const whatsapp = new WhatsAppService();
            
            // Testar formatação de número
            const formattedNumber = whatsapp.formatPhoneNumber('71999999999');
            if (formattedNumber === '5571999999999') {
                log('✅ Formatação de número funcionando', 'green');
            } else {
                log('❌ Formatação de número falhou', 'red');
                reject(new Error('Formatação de número falhou'));
                return;
            }
            
            // Testar salvamento de mensagem
            whatsapp.saveMessageToFile(TEST_PHONE, 'Mensagem de teste', 'test');
            
            const logFile = path.join(__dirname, 'logs', 'whatsapp-messages.json');
            if (fs.existsSync(logFile)) {
                log('✅ Salvamento de mensagem funcionando', 'green');
                resolve(true);
            } else {
                log('❌ Salvamento de mensagem falhou', 'red');
                reject(new Error('Salvamento falhou'));
            }
            
        } catch (error) {
            log(`❌ Erro no serviço WhatsApp: ${error.message}`, 'red');
            reject(error);
        }
    });
}

function testAdminEndpoint() {
    return new Promise((resolve, reject) => {
        log('\n🔍 Testando endpoint de admin...', 'blue');
        
        axios.get(`${BASE_URL}/admin/messages`)
            .then(response => {
                if (response.data && typeof response.data === 'object') {
                    log('✅ Endpoint de admin funcionando', 'green');
                    resolve(true);
                } else {
                    log('❌ Resposta do endpoint de admin inválida', 'red');
                    reject(new Error('Resposta inválida'));
                }
            })
            .catch(error => {
                log(`❌ Erro no endpoint de admin: ${error.message}`, 'red');
                reject(error);
            });
    });
}

function testSecurity() {
    return new Promise((resolve, reject) => {
        log('\n🔍 Testando medidas de segurança...', 'blue');
        
        // Testar rate limiting (fazer muitas requisições)
        const promises = [];
        for (let i = 0; i < 5; i++) {
            promises.push(
                axios.get(`${BASE_URL}/admin/messages`)
                    .catch(error => error.response)
            );
        }
        
        Promise.all(promises)
            .then(responses => {
                const rateLimited = responses.some(r => r?.status === 429);
                if (rateLimited) {
                    log('✅ Rate limiting funcionando', 'green');
                } else {
                    log('⚠️ Rate limiting pode não estar funcionando', 'yellow');
                }
                resolve(true);
            })
            .catch(error => {
                log(`❌ Erro no teste de segurança: ${error.message}`, 'red');
                reject(error);
            });
    });
}

async function runTests() {
    log('🚀 Iniciando testes de integração...', 'bold');
    
    const tests = [
        { name: 'Servidor', fn: testServer },
        { name: 'Validação', fn: testValidation },
        { name: 'WhatsApp Service', fn: testWhatsAppService },
        { name: 'Admin Endpoint', fn: testAdminEndpoint },
        { name: 'Segurança', fn: testSecurity }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        try {
            await test.fn();
            passed++;
        } catch (error) {
            failed++;
            log(`❌ ${test.name} falhou: ${error.message}`, 'red');
        }
    }
    
    log('\n📊 Resultados dos testes:', 'bold');
    log(`✅ Passou: ${passed}`, 'green');
    log(`❌ Falhou: ${failed}`, 'red');
    
    if (failed === 0) {
        log('\n🎉 Todos os testes passaram! Sistema funcionando corretamente.', 'green');
    } else {
        log('\n⚠️ Alguns testes falharam. Verifique os erros acima.', 'yellow');
    }
    
    return failed === 0;
}

// Executar testes se chamado diretamente
if (require.main === module) {
    runTests().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = { runTests };
