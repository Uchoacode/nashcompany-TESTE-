// --- LÓGICA DO CARRINHO DE COMPRAS (GLOBAL) ---

// Variável global do carrinho. Inicialmente vazia, o carregamento do localStorage
// é feito na função loadAndRenderCart() para garantir a recarga em caso de bfcache.
let cart = []; 
const cartIconBtn = document.getElementById('cart-icon-btn');
const miniCart = document.getElementById('mini-cart');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartBadge = document.getElementById('cart-badge');
const cartSubtotalEl = document.getElementById('cart-subtotal');
const checkoutBtn = document.getElementById('checkout-btn');

// Função para salvar o carrinho no localStorage
function saveCart() {
    localStorage.setItem('nashCart', JSON.stringify(cart));
}

// Função para carregar o carrinho do LocalStorage e renderizar o UI
// ESSENCIAL para corrigir o problema de navegação (bfcache).
function loadAndRenderCart() {
    cart = JSON.parse(localStorage.getItem('nashCart')) || []; // Reatribui a variável global com o estado mais recente
    renderCart(); // Renderiza a UI com o estado recém-carregado
}

// Função para atualizar o subtotal
function updateSubtotal() {
    // A função utiliza a variável global 'cart' que deve estar atualizada
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    if (cartSubtotalEl) {
        cartSubtotalEl.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    }
}

// Função para renderizar os itens no mini-carrinho
function renderCart() {
    if (!cartItemsContainer) return;
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p id="cart-empty-msg">Seu carrinho está vazio.</p>';
        updateSubtotal();
        updateCartBadge(); // Garante que o badge zere
        return;
    }

    cartItemsContainer.innerHTML = ''; 
    cart.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.classList.add('cart-item');
        itemEl.innerHTML = `
            <img src="${item.img}" alt="${item.name}" class="cart-item-img">
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <p class="cart-item-meta">${item.color} / ${item.size}</p>
                <p class="cart-item-price">R$ ${item.price.toFixed(2).replace('.', ',')} (x${item.quantity})</p>
                <button class="cart-item-remove-btn" data-cart-item-id="${item.cartItemId}">Remover</button>
            </div>
        `;
        cartItemsContainer.appendChild(itemEl);
    });
    updateSubtotal();
    updateCartBadge(); // Atualiza o badge após renderizar
}

// Função para atualizar o número no ícone do carrinho
function updateCartBadge() {
    if (!cartBadge) return;
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    cartBadge.textContent = totalItems;
    
    // Animação de "pulse"
    if (totalItems > 0) {
        cartBadge.classList.add('updated');
        setTimeout(() => {
            cartBadge.classList.remove('updated');
        }, 300);
    }
}

// Função para mostrar feedback no botão
function showAddedFeedback(button) {
    const originalText = button.textContent;
    button.textContent = 'Adicionado!';
    
    // Na página de produto, o botão é branco. Na home, é transparente.
    // Este check ajusta o feedback visual para ambos
    if (button.id === 'product-page-add-to-cart') {
        button.style.background = '#000';
        button.style.color = '#fff';
    } else {
        button.style.background = '#fff';
        button.style.color = '#000';
    }
    
    button.disabled = true;

    setTimeout(() => {
        button.textContent = originalText;
        if (button.id === 'product-page-add-to-cart') {
             button.style.background = '#fff';
             button.style.color = '#000';
        } else {
            button.style.background = 'transparent';
            button.style.color = '#fff';
        }
        button.disabled = false;
    }, 2000); 
}

// Função genérica para adicionar item (usada por ambos os tipos de botão)
function addItemToCart(data, button) {
    const { id, name, price, img, color, size } = data;
    const cartItemId = `${id}-${color}-${size}`; 

    const existingItem = cart.find(item => item.cartItemId === cartItemId);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ cartItemId, id, name, price, img, color, size, quantity: 1 });
    }

    showAddedFeedback(button);
    
    saveCart();
    renderCart();
    // updateCartBadge() é chamado dentro de renderCart()
    if (miniCart) miniCart.classList.add('open');
}

// --- LÓGICA DE CHECKOUT VIA MERCADO PAGO (GLOBAL) ---
async function handleCheckout(e) {
    e.preventDefault(); // Prevenir link de navegar
    
    if (cart.length === 0) {
        alert("Seu carrinho está vazio. Adicione alguns produtos antes de finalizar!");
        return;
    }

    // Mostrar modal de checkout
    showCheckoutModal();
}

function showCheckoutModal() {
    // Criar modal de checkout
    const modal = document.createElement('div');
    modal.id = 'checkout-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;

    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    modal.innerHTML = `
        <div style="
            background: #0a0a0a;
            border: 1px solid #333;
            border-radius: 12px;
            padding: 25px;
            max-width: 500px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            color: #fff;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        ">
            <h2 style="margin-bottom: 25px; color: #fff; font-size: 1.8rem; text-transform: uppercase; letter-spacing: 0.5px;">Finalizar Compra</h2>
            
            <form id="checkout-form">
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #fff; margin-bottom: 15px; font-size: 1.2rem; text-transform: uppercase; letter-spacing: 0.3px;">Dados Pessoais</h3>
                    <input type="text" id="customer-name" placeholder="Nome completo" required 
                           style="width: 100%; padding: 12px; margin-bottom: 10px; background: #1a1a1a; border: 1px solid #333; color: #fff; border-radius: 5px; font-size: 16px;">
                    <input type="tel" id="customer-phone" placeholder="WhatsApp (ex: 71999887766)" required 
                           style="width: 100%; padding: 12px; margin-bottom: 10px; background: #1a1a1a; border: 1px solid #333; color: #fff; border-radius: 5px; font-size: 16px;">
                </div>

                <div style="margin-bottom: 20px;">
                    <h3 style="color: #fff; margin-bottom: 15px; font-size: 1.2rem; text-transform: uppercase; letter-spacing: 0.3px;">Endereço de Entrega</h3>
                    <input type="text" id="address-street" placeholder="Rua/Avenida" required 
                           style="width: 100%; padding: 12px; margin-bottom: 10px; background: #1a1a1a; border: 1px solid #333; color: #fff; border-radius: 5px; font-size: 16px;">
                    <input type="text" id="address-number" placeholder="Número" required 
                           style="width: 100%; padding: 12px; margin-bottom: 10px; background: #1a1a1a; border: 1px solid #333; color: #fff; border-radius: 5px; font-size: 16px;">
                    <input type="text" id="address-neighborhood" placeholder="Bairro" required 
                           style="width: 100%; padding: 12px; margin-bottom: 10px; background: #1a1a1a; border: 1px solid #333; color: #fff; border-radius: 5px; font-size: 16px;">
                    <input type="text" id="address-city" placeholder="Cidade" required 
                           style="width: 100%; padding: 12px; margin-bottom: 10px; background: #1a1a1a; border: 1px solid #333; color: #fff; border-radius: 5px; font-size: 16px;">
                    <input type="text" id="address-state" placeholder="Estado (ex: BA)" required 
                           style="width: 100%; padding: 12px; margin-bottom: 10px; background: #1a1a1a; border: 1px solid #333; color: #fff; border-radius: 5px; font-size: 16px;">
                    <input type="text" id="address-zipcode" placeholder="CEP" required 
                           style="width: 100%; padding: 12px; margin-bottom: 10px; background: #1a1a1a; border: 1px solid #333; color: #fff; border-radius: 5px; font-size: 16px;">
                </div>

                <div style="margin-bottom: 20px;">
                    <h3 style="color: #fff; margin-bottom: 15px; font-size: 1.2rem; text-transform: uppercase; letter-spacing: 0.3px;">Resumo do Pedido</h3>
                    <div style="background: #1a1a1a; padding: 15px; border-radius: 5px; margin-bottom: 10px;">
                        ${cart.map(item => `
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span>${item.name} - ${item.color}/${item.size} (x${item.quantity})</span>
                                <span>R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                            </div>
                        `).join('')}
                        <hr style="border-color: #333; margin: 10px 0;">
                        <div style="display: flex; justify-content: space-between; font-weight: bold;">
                            <span>Total:</span>
                            <span>R$ ${subtotal.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div style="background: #25D366; color: #fff; padding: 10px; border-radius: 5px; margin-top: 10px; text-align: center;">
                            <strong>📦 Entrega será combinada após confirmação do pagamento</strong>
                        </div>
                    </div>
                </div>

                <div style="display: flex; gap: 15px; margin-top: 25px;">
                    <button type="button" onclick="closeCheckoutModal()" 
                            style="flex: 1; padding: 15px; background: #333; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem; font-weight: 600; transition: all 0.3s ease;">
                        Cancelar
                    </button>
                    <button type="submit" id="finalize-checkout-btn"
                            style="flex: 1; padding: 15px; background: #25D366; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem; font-weight: 600; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);">
                        Finalizar Compra
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // Adicionar listener ao formulário
    document.getElementById('checkout-form').addEventListener('submit', handleCheckoutSubmit);
    
    // Adicionar responsividade para mobile
    const modalContent = modal.querySelector('div');
    if (window.innerWidth <= 768) {
        modalContent.style.padding = '20px';
        modalContent.style.margin = '10px';
        modalContent.style.maxWidth = 'none';
        modalContent.style.width = 'calc(100% - 20px)';
    }
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    if (modal) {
        modal.remove();
    }
}

async function handleCheckoutSubmit(e) {
    e.preventDefault();
    
    const originalText = document.getElementById('finalize-checkout-btn').textContent;
    const submitBtn = document.getElementById('finalize-checkout-btn');
    
    try {
        submitBtn.textContent = 'Processando...';
        submitBtn.disabled = true;

        // Coletar dados do formulário
        const customer = {
            name: document.getElementById('customer-name').value,
            phone: document.getElementById('customer-phone').value
        };

        const address = {
            street: document.getElementById('address-street').value,
            number: document.getElementById('address-number').value,
            neighborhood: document.getElementById('address-neighborhood').value,
            city: document.getElementById('address-city').value,
            state: document.getElementById('address-state').value,
            zipCode: document.getElementById('address-zipcode').value
        };

        // Enviar dados para o servidor
        const response = await fetch('http://localhost:3000/api/create_preference', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
                items: cart,
                customer: customer,
                address: address
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Erro do servidor:', errorData);
            throw new Error(`Erro ao criar preferência de pagamento: ${errorData.error || response.statusText}`);
        }

        const data = await response.json();
        
        if (data.init_point) {
            // Fechar modal e redirecionar
            closeCheckoutModal();
            window.location.href = data.init_point;
        } else {
            throw new Error('URL de pagamento não encontrada');
        }

    } catch (error) {
        console.error('Erro no checkout:', error);
        alert('Erro ao processar o pagamento. Verifique se o servidor local está rodando ou tente novamente.');
        
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}


// --- INICIALIZAÇÃO DE TODOS OS LISTENERS QUANDO O DOM ESTIVER PRONTO ---
document.addEventListener('DOMContentLoaded', function() {
    
    // 1. Listeners dos Botões da Home (Grid de Produtos)
    const gridAddToCartButtons = document.querySelectorAll('.product-card .add-to-cart-btn');
    gridAddToCartButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            if (!card) return;
            
            const selectedColorEl = card.querySelector('.color-swatch.active');
            const selectedSizeEl = card.querySelector('.size-select');

            const itemData = {
                id: card.dataset.id,
                name: card.dataset.name,
                price: parseFloat(card.dataset.price),
                img: card.dataset.img,
                color: selectedColorEl ? selectedColorEl.dataset.color : 'Padrão',
                size: selectedSizeEl ? selectedSizeEl.value : 'Único'
            };
            
            addItemToCart(itemData, button);
        });
    });

    // 2. Listener do Botão da Página de Produto (ex: camisa-2.html)
    const productPageButton = document.getElementById('product-page-add-to-cart');
    if (productPageButton) {
        productPageButton.addEventListener('click', (e) => {
            const detailsContainer = e.target.closest('.product-details-content');
            if (!detailsContainer) return;

            const selectedColorEl = detailsContainer.querySelector('.color-swatch.active');
            const selectedSizeEl = detailsContainer.querySelector('.size-select');
            
            const itemData = {
                id: detailsContainer.dataset.id,
                name: detailsContainer.dataset.name,
                price: parseFloat(detailsContainer.dataset.price),
                img: detailsContainer.dataset.img,
                color: selectedColorEl ? selectedColorEl.dataset.color : 'Padrão',
                size: selectedSizeEl ? selectedSizeEl.value : 'Único'
            };

            addItemToCart(itemData, productPageButton);
        });
    }

    // 3. Listeners do Mini-Carrinho (Abrir, Fechar, Remover Item)
    if (cartIconBtn && miniCart) {
        cartIconBtn.addEventListener('click', () => miniCart.classList.add('open'));
    }
    if (closeCartBtn && miniCart) {
        closeCartBtn.addEventListener('click', () => miniCart.classList.remove('open'));
    }
    if (cartItemsContainer) {
        cartItemsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('cart-item-remove-btn')) {
                const cartItemId = e.target.dataset.cartItemId;
                cart = cart.filter(item => item.cartItemId !== cartItemId);
                
                saveCart();
                renderCart(); // RenderCart já atualiza o subtotal e o badge
            }
        });
    }

    // 4. Listener do Botão de Checkout
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
    }

    // A chamada de loadAndRenderCart() agora está no final
});

// 5. Carregamento inicial do carrinho em TODAS as páginas
// Chamado no DOMContentLoaded para a primeira carga.
// E também chamado no 'pageshow' para lidar com a navegação de retorno (bfcache).
document.addEventListener('DOMContentLoaded', loadAndRenderCart);
window.addEventListener('pageshow', loadAndRenderCart);