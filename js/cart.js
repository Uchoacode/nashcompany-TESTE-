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

    const originalText = checkoutBtn ? checkoutBtn.textContent : 'Finalizar Compra';

    try {
        if (checkoutBtn) {
            checkoutBtn.textContent = 'Processando...';
            checkoutBtn.disabled = true;
        }

        // ATENÇÃO: Isso só funciona se o servidor (node server/index.js) estiver rodando!
        const response = await fetch('/api/create_preference', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ items: cart })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Erro do servidor:', errorData);
            throw new Error(`Erro ao criar preferência de pagamento: ${errorData.error || response.statusText}`);
        }

        const data = await response.json();
        
        if (data.init_point) {
            window.location.href = data.init_point; // Redireciona para o Mercado Pago
        } else {
            throw new Error('URL de pagamento não encontrada');
        }

    } catch (error) {
        console.error('Erro no checkout:', error);
        alert('Erro ao processar o pagamento. Verifique se o servidor local está rodando (Passo 4 da análise) ou tente novamente.');
        
        if (checkoutBtn) {
            checkoutBtn.textContent = originalText;
            checkoutBtn.disabled = false;
        }
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