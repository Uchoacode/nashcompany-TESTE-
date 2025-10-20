document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. LÓGICA DO PRELOADER ---
    const preloader = document.getElementById('preloader');
    window.addEventListener('load', () => {
        setTimeout(() => {
            if(preloader) preloader.classList.add('hidden');
        }, 500); 
    });

    // --- 2. LÓGICA DO MENU MOBILE ---
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileNav = document.getElementById('mobile-nav');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
    
    if (hamburgerBtn && mobileNav) {
        hamburgerBtn.addEventListener('click', () => {
            mobileNav.classList.toggle('open');
        });
    }

    mobileNavLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (mobileNav) mobileNav.classList.remove('open');
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

    // --- 4. LÓGICA DO CARROSSEL DE DEPOIMENTOS ---
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
            swatch.addEventListener('click', (e) => {
                e.preventDefault();
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
        if (!promoBox) return;
        if (promoBox.classList.contains('visible')) return; 
        promoBox.classList.add('visible');
        hideTimeout = setTimeout(() => {
            promoBox.classList.remove('visible');
        }, 5000); 
    }

    if(whatsappFab) {
        whatsappFab.addEventListener('click', () => {
            clearTimeout(hideTimeout);
            if(promoBox) promoBox.classList.remove('visible');
        });

        setTimeout(function() {
            showPromoBox(); 
            setInterval(showPromoBox, 30000);
        }, 2000); 

        if (window.innerWidth >= 769) {
            whatsappFab.addEventListener('mouseenter', () => {
                clearTimeout(hideTimeout);
                if(promoBox) promoBox.classList.add('visible');
            });
            whatsappFab.addEventListener('mouseleave', () => {
                hideTimeout = setTimeout(() => {
                    if(promoBox) promoBox.classList.remove('visible');
                }, 1000); 
            });
        }
    }


    // --- 8. LÓGICA DO CARRINHO DE COMPRAS (GLOBAL) ---
    
    // Variáveis globais do carrinho
    let cart = JSON.parse(localStorage.getItem('nashCart')) || [];
    const cartIconBtn = document.getElementById('cart-icon-btn');
    const miniCart = document.getElementById('mini-cart');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartBadge = document.getElementById('cart-badge');
    const cartSubtotalEl = document.getElementById('cart-subtotal');
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');

    // Função para salvar o carrinho no localStorage
    function saveCart() {
        localStorage.setItem('nashCart', JSON.stringify(cart));
    }

    // Função para atualizar o subtotal
    function updateSubtotal() {
        const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        if (cartSubtotalEl) {
            cartSubtotalEl.textContent = `R$ ${subtotal.toFixed(2)}`;
        }
    }

    // Função para renderizar os itens no mini-carrinho
    function renderCart() {
        if (!cartItemsContainer) return;
        
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

    // Função para atualizar o número no ícone do carrinho
    function updateCartBadge() {
        if (!cartBadge) return;
        const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
        cartBadge.textContent = totalItems;
        
        cartBadge.classList.add('updated');
        setTimeout(() => {
            cartBadge.classList.remove('updated');
        }, 300);
    }
    
    // --- Event Listeners do Carrinho (Página Principal) ---
    if (cartIconBtn && miniCart) {
        cartIconBtn.addEventListener('click', () => miniCart.classList.add('open'));
    }
    if (closeCartBtn && miniCart) {
        closeCartBtn.addEventListener('click', () => miniCart.classList.remove('open'));
    }

    // Adicionar ao carrinho (nos cards da HOME)
    addToCartButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            if (!card) return;
            
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
                cart.push({ cartItemId, id, name, price, img, color, size, quantity: 1 });
            }

            const originalText = button.textContent;
            button.textContent = 'Adicionado!';
            button.style.background = '#fff';
            button.style.color = '#000';
            button.disabled = true;

            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = 'transparent';
                button.style.color = '#fff';
                button.disabled = false;
            }, 2000); 

            saveCart();
            renderCart();
            updateCartBadge();
            if (miniCart) miniCart.classList.add('open'); 
        });
    });

    // Remover do carrinho (listener global no container)
    if (cartItemsContainer) {
        cartItemsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('cart-item-remove-btn')) {
                const cartItemId = e.target.dataset.cartItemId;
                cart = cart.filter(item => item.cartItemId !== cartItemId);
                
                saveCart();
                renderCart();
                updateCartBadge();
            }
        });
    }
    
    // Carregamento inicial do carrinho em TODAS as páginas
    renderCart();
    updateCartBadge();


    // --- 9. LÓGICA DOS POP-UPS MODAIS (GLOBAL) ---
    const modalOpeners = document.querySelectorAll('[data-modal-target]');
    const modalCloseButtons = document.querySelectorAll('.modal-close-btn');
    const modals = document.querySelectorAll('.modal-overlay');

    function closeModal(modal) {
        if(modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    modalOpeners.forEach(opener => {
        opener.addEventListener('click', (e) => {
            e.preventDefault(); 
            const targetId = opener.dataset.modalTarget;
            const targetModal = document.getElementById(`modal-${targetId}`);
            
            if (targetModal) {
                modals.forEach(m => m.classList.remove('active')); 
                targetModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    });

    modalCloseButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal-overlay');
            closeModal(modal);
        });
    });

    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal);
            }
        });
    });

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
    
    if (vipPopup && !sessionStorage.getItem('vipPopupSeen')) {
        setTimeout(() => {
            const isModalActive = document.querySelector('.modal-overlay.active');
            if (vipPopup && !isModalActive) {
                vipPopup.classList.add('active');
                document.body.style.overflow = 'hidden';
                sessionStorage.setItem('vipPopupSeen', 'true');
            }
        }, 7000);
    }
    
    // --- 11. LÓGICA DAS SETAS DE PRODUTO (HOME) ---
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        const wrapper = card.querySelector('.product-image-wrapper');
        const image = card.querySelector('.product-image');
        const nextBtn = card.querySelector('.arrow-next');
        const prevBtn = card.querySelector('.arrow-prev');
        
        if (!wrapper || !image || !nextBtn || !prevBtn) return;

        const frontImgSrc = wrapper.dataset.front;
        const backImgSrc = wrapper.dataset.back;

        const swapImage = () => {
            if (image.src.endsWith(frontImgSrc)) {
                image.src = backImgSrc;
            } else {
                image.src = frontImgSrc;
            }
        };

        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            swapImage();
        });

        prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            swapImage();
        });
    });
    
    // --- 12. LÓGICA DE CHECKOUT VIA WHATSAPP (GLOBAL) ---
    const phoneNumber = "5571988689508"; 
    const checkoutBtn = document.getElementById('checkout-btn');

    function handleCheckout() {
        if (cart.length === 0) {
            alert("Seu carrinho está vazio. Adicione alguns produtos antes de finalizar!");
            return;
        }

        let message = "Olá, NASH COMPANY! 🚀\nGostaria de finalizar meu pedido:\n\n";

        cart.forEach(item => {
            message += `*Produto:* ${item.name}\n`;
            message += `*Detalhes:* ${item.color} / ${item.size}\n`;
            message += `*Preço:* R$ ${item.price.toFixed(2)}\n`;
            message += `*Quantidade:* ${item.quantity}\n`;
            message += `------------------------\n`;
        });

        const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        message += `\n*SUBTOTAL DO PEDIDO: R$ ${subtotal.toFixed(2)}*`;
        message += `\n\nAguardo as instruções para pagamento.`;

        const encodedMessage = encodeURIComponent(message);
        const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
        window.open(whatsappURL, '_blank');
        
        // Opcional: Limpar o carrinho (descomente as linhas abaixo se quiser)
        // cart = [];
        // saveCart();
        // renderCart();
        // updateCartBadge();
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleCheckout();
        });
    }

    // --- 13. LÓGICA DO BANNER DE CONTAGEM REGRESSIVA ---
    function startCountdown() {
        // Define uma data-alvo. 
        // Para um drop real, defina uma data fixa. Ex: "Oct 25, 2025 23:59:59"
        let targetTime;
        const storedTarget = localStorage.getItem('countdownTarget');

        // Se já tem um timer rodando no localStorage E ele não expirou, usa ele
        if (storedTarget && storedTarget > new Date().getTime()) {
            targetTime = parseInt(storedTarget);
        } else {
            // Se não tem, cria um novo timer de 24h e salva
            targetTime = new Date().getTime() + (24 * 60 * 60 * 1000);
            localStorage.setItem('countdownTarget', targetTime);
        }

        const countdownElement = document.getElementById('countdown');
        if (!countdownElement) return;

        const interval = setInterval(function() {
            const now = new Date().getTime();
            const distance = targetTime - now;

            if (distance < 0) {
                clearInterval(interval);
                const banner = document.getElementById('promo-banner');
                if (banner) banner.innerHTML = "<p>PROMOÇÃO DE LANÇAMENTO ENCERRADA</p>";
                localStorage.removeItem('countdownTarget');
                return;
            }

            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            const f_hours = hours.toString().padStart(2, '0');
            const f_minutes = minutes.toString().padStart(2, '0');
            const f_seconds = seconds.toString().padStart(2, '0');

            countdownElement.innerHTML = `${f_hours}:${f_minutes}:${f_seconds}`;

        }, 1000);
    }
    
    // Só inicia o countdown se o banner existir na página (só no index.html)
    if (document.getElementById('promo-banner')) {
        startCountdown();
    }

});