/* ==========================================================================
   Noxss Library: Drawers Component (JavaScript)
   - Lógica para controlar painéis laterais (off-canvas).
   - Versão: 1.0
   - Depende de: js/core.js
   ========================================================================== */

(function (Noxss, window, document) {
    'use strict';

    if (!Noxss) {
        console.error("Noxss Core (core.js) é necessário, mas não foi encontrado.");
        return;
    }

    const drawers = new Map();
    const FOCUSABLE_ELEMENTS = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    let openDrawerId = null;

    /**
     * Abre uma gaveta específica e gerencia o estado da página.
     * @param {string} drawerId - O ID da gaveta a ser aberta.
     */
    function openDrawer(drawerId) {
        const drawer = drawers.get(drawerId);
        if (!drawer || drawer.isOpen) return;

        openDrawerId = drawerId;
        const drawerEl = drawer.element;

        drawerEl.style.display = 'block'; // Garante que a gaveta seja visível para a animação
        
        // Usar requestAnimationFrame garante que a transição ocorra corretamente
        requestAnimationFrame(() => {
            drawerEl.classList.add('is-open');
        });

        document.body.style.overflow = 'hidden';

        const firstFocusable = drawerEl.querySelector(FOCUSABLE_ELEMENTS);
        if (firstFocusable) {
            firstFocusable.focus();
        }
        
        drawer.isOpen = true;
    }

    /**
     * Fecha a gaveta atualmente aberta.
     */
    function closeDrawer() {
        if (!openDrawerId) return;

        const drawer = drawers.get(openDrawerId);
        if (drawer) {
            const drawerEl = drawer.element;
            drawerEl.classList.remove('is-open');

            drawerEl.addEventListener('transitionend', () => {
                drawerEl.style.display = 'none'; // Esconde o elemento após a animação
            }, { once: true });
            
            document.body.style.overflow = '';
            
            if (drawer.triggerElement) {
                drawer.triggerElement.focus();
            }
            
            drawer.isOpen = false;
            openDrawerId = null;
        }
    }
    
    function handleFocusTrap(event) {
        if (event.key !== 'Tab' || !openDrawerId) return;
        
        const drawerElement = drawers.get(openDrawerId)?.element;
        if (!drawerElement) return;

        const focusableElements = Array.from(drawerElement.querySelectorAll(FOCUSABLE_ELEMENTS));
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) { // Shift + Tab
            if (document.activeElement === firstElement) {
                lastElement.focus();
                event.preventDefault();
            }
        } else { // Tab
            if (document.activeElement === lastElement) {
                firstElement.focus();
                event.preventDefault();
            }
        }
    }

    const DrawersAPI = {
        init: function() {
            const drawerElements = document.querySelectorAll('[data-noxss-drawer]');
            drawerElements.forEach(drawerEl => {
                const drawerId = drawerEl.id;
                if (!drawerId) {
                    console.warn("Noxss Drawers: Gaveta encontrada sem ID. Ignorando.", drawerEl);
                    return;
                }
                drawers.set(drawerId, {
                    element: drawerEl,
                    isOpen: false,
                    triggerElement: null
                });

                // Adiciona listener para fechar ao clicar no backdrop
                const backdrop = drawerEl.querySelector('.noxss-drawer__backdrop');
                if (backdrop) {
                    backdrop.addEventListener('click', closeDrawer);
                }
            });

            // Configura os gatilhos de abertura
            document.querySelectorAll('[data-noxss-drawer-open]').forEach(trigger => {
                const drawerId = trigger.dataset.noxssDrawerOpen;
                trigger.addEventListener('click', (event) => {
                    const drawer = drawers.get(drawerId);
                    if (drawer) {
                        drawer.triggerElement = event.currentTarget;
                    }
                    openDrawer(drawerId);
                });
            });

            // Configura os gatilhos de fechamento internos
            document.querySelectorAll('[data-noxss-drawer-close]').forEach(trigger => {
                trigger.addEventListener('click', closeDrawer);
            });
            
            // Listeners globais
            window.addEventListener('keydown', (event) => {
                if (event.key === 'Escape' && openDrawerId) {
                    closeDrawer();
                }
                handleFocusTrap(event);
            });
        },
        open: openDrawer,
        close: closeDrawer
    };

    Noxss.Drawers = DrawersAPI;
    document.addEventListener('DOMContentLoaded', () => Noxss.Drawers.init());

})(window.Noxss, window, document);