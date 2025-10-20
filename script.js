document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. LÓGICA DO PRELOADER ---
    const preloader = document.getElementById('preloader');
    window.addEventListener('load', () => {
        setTimeout(() => {
            preloader.classList.add('hidden');
        }, 500); 
    });

    // --- 2. LÓGICA DO MENU MOBILE ---
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileNav = document.getElementById('mobile-nav');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
    
    hamburgerBtn.addEventListener('click', () => {
        mobileNav.classList.toggle('open');
    });

    mobileNavLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileNav.classList.remove('open');
        });
    });

    // --- 3. LÓGICA DO CARROSSEL HERO SWIPER ---
    const heroSwiper = new Swiper('.hero-carousel .swiper', {
        loop: true,
        effect: 'fade', 
        fadeEffect: {
            crossFade: true
        },
        autoplay: {
            delay: 5000, 
            disableOnInteraction: false,
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
    });

    // --- 4. LÓGICA DO CARROSSEL DE DEPOIMENTOS (BREAKPOINTS AJUSTADOS) ---
    const testimonialSwiper = new Swiper('.testimonial-swiper', {
        loop: true,
        autoplay: {
            delay: 5000,
            disableOnInteraction: false,
        },
        pagination: {
            el: '.testimonial-pagination',
            clickable: true,
        },
        slidesPerView: 1, // 1 slide no mobile
        spaceBetween: 20,
        breakpoints: {
            769: {
                slidesPerView: 2, // 2 slides no desktop
                spaceBetween: 30
            }
        }
    });

    // --- 5. LÓGICA DAS ANIMAÇÕES DE SCROLL ---
    const revealElements = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1 
    });
    revealElements.forEach(el => {
        observer.observe(el);
    });

    // --- 6. LÓGICA DE OPÇÕES DE PRODUTO (CORES) ---
    const allColorSwatchesGroups = document.querySelectorAll('.color-swatches');
    allColorSwatchesGroups.forEach(group => {
        const swatches = group.querySelectorAll('.color-swatch');
        swatches.forEach(swatch => {
            swatch.addEventListener('click', () => {
                swatches.forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
            });
        });
    });

    // --- 7. LÓGICA: POP-UP DO WHATSAPP ---
    const whatsappFab = document.querySelector('.whatsapp-fab');
    const promoBox = document.getElementById('whatsapp-promo-box');
    let hideTimeout;
    
    function showPromoBox() {
        if (promoBox.classList.contains('visible')) return; 
        promoBox.classList.add('visible');
        hideTimeout = setTimeout(() => {
            promoBox.classList.remove('visible');
        }, 5000); 
    }

    whatsappFab.addEventListener('click', () => {
        clearTimeout(hideTimeout);
        promoBox.classList.remove('visible');
    });

    setTimeout(function() {
        showPromoBox(); 
        setInterval(showPromoBox, 30000);
    }, 2000); 

    if (window.innerWidth >= 769) {
        whatsappFab.addEventListener('mouseenter', () => {
            clearTimeout(hideTimeout);
            promoBox.classList.add('visible');
        });
        whatsappFab.addEventListener('mouseleave', () => {
            hideTimeout = setTimeout(() => {
                promoBox.classList.remove('visible');
            }, 1000); 
        });
    }


    // --- 8. LÓGICA DO CARRINHO DE COMPRAS ---
    
    // MELHORIA: Carrega o carrinho do localStorage ou inicia um array vazio
    let cart = JSON.parse(localStorage.getItem('nashCart')) || [];

    const cartIconBtn = document.getElementById('cart-icon-btn');
    const miniCart = document.getElementById('mini-cart');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartBadge = document.getElementById('cart-badge');
    const cartSubtotalEl = document.getElementById('cart-subtotal');
    const cartEmptyMsg = document.getElementById('cart-empty-msg');
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');

    // --- FUNÇÕES DO CARRINHO (Definidas primeiro) ---

    // MELHORIA: Nova função para salvar o carrinho no localStorage
    function saveCart() {
        localStorage.setItem('nashCart', JSON.stringify(cart));
    }

    function updateSubtotal() {
        const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        cartSubtotalEl.textContent = `R$ ${subtotal.toFixed(2)}`;
    }

    function renderCart() {
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p id="cart-empty-msg">Seu carrinho está vazio.</p>';
            updateSubtotal();
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
                    <p class="cart-item-price">R$ ${item.price.toFixed(2)} (x${item.quantity})</p>
                    <button class="cart-item-remove-btn" data-cart-item-id="${item.cartItemId}">Remover</button>
                </div>
            `;
            cartItemsContainer.appendChild(itemEl);
        });
        updateSubtotal();
    }

    function updateCartBadge() {
        const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
        cartBadge.textContent = totalItems;
        
        cartBadge.classList.add('updated');
        setTimeout(() => {
            cartBadge.classList.remove('updated');
        }, 300);
    }
    
    // --- FIM DAS DEFINIÇÕES DE FUNÇÕES ---


    // --- EVENT LISTENERS DO CARRINHO ---

    cartIconBtn.addEventListener('click', () => miniCart.classList.add('open'));
    closeCartBtn.addEventListener('click', () => miniCart.classList.remove('open'));

    addToCartButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            
            const id = card.dataset.id;
            const name = card.dataset.name;
            const price = parseFloat(card.dataset.price);
            const img = card.dataset.img;
            
            const selectedColorEl = card.querySelector('.color-swatch.active');
            const color = selectedColorEl ? selectedColorEl.dataset.color : 'Padrão';
            
            const selectedSizeEl = card.querySelector('.size-select');
            const size = selectedSizeEl ? selectedSizeEl.value : 'Único';

            const cartItemId = `${id}-${color}-${size}`; 

            const existingItem = cart.find(item => item.cartItemId === cartItemId);

            if (existingItem) {
                existingItem.quantity++;
            } else {
                cart.push({
                    cartItemId,
                    id,
                    name,
                    price,
                    img,
                    color,
                    size,
                    quantity: 1
                });
            }

            // MELHORIA DE PERSUASÃO: Feedback visual no botão
            const originalText = button.textContent;
            button.textContent = 'Adicionado!';
            button.style.background = '#fff'; // Inverte para o estado hover
            button.style.color = '#000';
            button.disabled = true;

            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = 'transparent';
                button.style.color = '#fff';
                button.disabled = false;
            }, 2000); // Reseta o botão após 2 segundos

            saveCart(); // <-- MELHORIA: Salva o carrinho
            renderCart();
            updateCartBadge();
            miniCart.classList.add('open'); 
        });
    });

    cartItemsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('cart-item-remove-btn')) {
            const cartItemId = e.target.dataset.cartItemId;
            cart = cart.filter(item => item.cartItemId !== cartItemId);
            
            saveCart(); // <-- MELHORIA: Salva o carrinho
            renderCart();
            updateCartBadge();
        }
    });
    
    // --- CARREGAMENTO INICIAL DO CARRINHO ---
    // MELHORIA: Renderiza o carrinho salvo assim que a página carrega
    renderCart();
    updateCartBadge();


    // --- 9. LÓGICA DOS POP-UPS MODAIS (Adicionado) ---
    // Esta lógica agora também controla os novos modais de produto
    const modalOpeners = document.querySelectorAll('[data-modal-target]');
    const modalCloseButtons = document.querySelectorAll('.modal-close-btn');
    const modals = document.querySelectorAll('.modal-overlay');

    // Função para fechar o modal
    function closeModal(modal) {
        if(modal) {
            modal.classList.remove('active');
            document.body.style.overflow = ''; // Remove scroll-lock
        }
    }

    // Abrir modal ao clicar nos links ou itens da barra
    modalOpeners.forEach(opener => {
        opener.addEventListener('click', (e) => {
            e.preventDefault(); 
            const targetId = opener.dataset.modalTarget;
            const targetModal = document.getElementById(`modal-${targetId}`);
            
            if (targetModal) {
                // Fecha qualquer outro modal aberto antes de abrir o novo
                modals.forEach(m => m.classList.remove('active')); 

                targetModal.classList.add('active');
                document.body.style.overflow = 'hidden'; // Evita scroll do fundo
            }
        });
    });

    // Fechar modal ao clicar no botão 'X'
    modalCloseButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal-overlay');
            closeModal(modal);
        });
    });

    // Fechar modal ao clicar fora da área do conteúdo
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) { // Verifica se o clique foi no overlay
                closeModal(modal);
            }
        });
    });

    // Fechar modal ao pressionar ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal-overlay.active');
            if (openModal) {
                closeModal(openModal);
            }
        }
    });


    // --- 10. LÓGICA DO POP-UP VIP ---
    const vipPopup = document.getElementById('modal-vip-popup');
    
    // Verifica se o popup já foi visto nesta sessão
    if (!sessionStorage.getItem('vipPopupSeen')) {
        setTimeout(() => {
            // Verifica se nenhum outro modal já está ativo
            const isModalActive = document.querySelector('.modal-overlay.active');
            if (vipPopup && !isModalActive) {
                vipPopup.classList.add('active');
                document.body.style.overflow = 'hidden';
                // Marca como visto para esta sessão
                sessionStorage.setItem('vipPopupSeen', 'true');
            }
        }, 7000); // Atraso de 7 segundos
    }
    
    // --- 11. LÓGICA DAS SETAS DE PRODUTO (NOVO) ---
    const productCards = document.querySelectorAll('.product-card');

    productCards.forEach(card => {
        const wrapper = card.querySelector('.product-image-wrapper');
        const image = card.querySelector('.product-image');
        const nextBtn = card.querySelector('.arrow-next');
        const prevBtn = card.querySelector('.arrow-prev');
        
        if (!wrapper || !image || !nextBtn || !prevBtn) return; // Se não houver setas, ignora

        const frontImgSrc = wrapper.dataset.front;
        const backImgSrc = wrapper.dataset.back;

        // Função para trocar a imagem
        const swapImage = () => {
            // O 'src' pode vir com o URL completo (http://...), 
            // então usamos endsWith para verificar o final do caminho.
            if (image.src.endsWith(frontImgSrc)) {
                image.src = backImgSrc;
            } else {
                image.src = frontImgSrc;
            }
        };

        nextBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Impede o clique de "borbulhar"
            e.stopPropagation(); // Impede o clique de "borbulhar"
            swapImage();
        });

        prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            swapImage();
        });
    });

});