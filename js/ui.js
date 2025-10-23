// --- LÓGICA DE UI/UX (Menu Mobile, Swipers, Animações de Scroll, Modals) ---

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

// --- 5. LÓGICA DO CARROSSEL DA PÁGINA DE PRODUTO (CORREÇÃO APLICADA) ---
const productGallerySwiper = new Swiper('.product-gallery-swiper', {
    loop: true,
    spaceBetween: 0,
    grabCursor: true, // Permite arrastar no desktop
    pagination: {
        el: '.swiper-pagination',
        clickable: true,
    },
    navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
    },
});


// --- 6. LÓGICA DAS ANIMAÇÕES DE SCROLL ---
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

// --- 7. LÓGICA DE OPÇÕES DE PRODUTO (CORES) ---
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

// --- 8. LÓGICA: POP-UP DO WHATSAPP ---
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

// --- 12. LÓGICA DO BANNER DE CONTAGEM REGRESSIVA ---
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


