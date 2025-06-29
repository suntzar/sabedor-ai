/* ==========================================================================
   Noxss Library: FAB Component (JavaScript)
   - Versão: 1.1 (Conteúdo dinâmico e desacoplado)
   - Gerencia o estado e a ação do Botão de Ação Flutuante.
   - Ouve o evento 'noxss:tab:change' para se atualizar.
   ========================================================================== */
(function (Noxss, window, document) {
    'use strict';
    
    if (!Noxss) { 
        console.error("Noxss Core (core.js) é necessário."); 
        return; 
    }

    const FabController = {
        fabElement: null,
        defaultIcon: 'plus', // Ícone padrão do Feather a ser usado como fallback

        /**
         * Inicializa o controlador do FAB.
         * @param {string} [selector='.noxss-fab'] - O seletor para o elemento FAB.
         */
        init: function(selector = '.noxss-fab') {
            this.fabElement = document.querySelector(selector);
            if (!this.fabElement) return; // Se não houver FAB na página, não faz nada.

            this.bindEvents();
        },

        /**
         * Vincula os eventos necessários para o funcionamento do FAB.
         */
        bindEvents: function() {
            // Ouve o evento global de mudança de aba para se atualizar.
            document.body.addEventListener('noxss:tab:change', (event) => {
                this.updateState(event.detail.targetPanel);
            });
            
            // Adiciona um listener de clique no próprio FAB para acionar ações customizadas.
            this.fabElement.addEventListener('click', (event) => {
                // Se o FAB não for um gatilho de modal, executa a ação customizada.
                // O `data-bs-toggle` é uma forma de verificar se é um modal do Bootstrap.
                if (!this.fabElement.dataset.bsToggle) {
                    this.executeAction(event);
                }
            });
        },
        
        /**
         * Atualiza a visibilidade, conteúdo e ações do FAB com base nos atributos do painel ativo.
         * @param {HTMLElement} activePanel - O painel da aba que se tornou ativa.
         */
        updateState: function(activePanel) {
            if (!this.fabElement) return;
            
            // Se não houver painel ativo ou se o painel não tiver o atributo de visibilidade, esconde o FAB.
            const isVisible = activePanel && activePanel.hasAttribute('data-fab-visible');
            this.fabElement.classList.toggle('is-hidden', !isVisible);

            if (isVisible) {
                // Atualiza o conteúdo visual do FAB (ícone, html, etc.)
                this.updateContent(activePanel);

                // Configura o alvo do modal (para compatibilidade com Bootstrap)
                this.fabElement.dataset.bsTarget = activePanel.dataset.fabTarget || '';
                this.fabElement.dataset.bsToggle = activePanel.dataset.fabTarget ? 'modal' : '';

                // Armazena a ação customizada a ser executada
                this.fabElement.dataset.action = activePanel.dataset.fabAction || '';
            }
        },

        /**
         * Atualiza o conteúdo interno do FAB com base em uma hierarquia de atributos de dados.
         * @param {HTMLElement} activePanel - O painel ativo que dita o conteúdo.
         */
        updateContent: function(activePanel) {
            // Prioridade 1: HTML Customizado (data-fab-html)
            // Oferece flexibilidade máxima para usar qualquer biblioteca de ícones, SVG, emoji, etc.
            if (activePanel.hasAttribute('data-fab-html')) {
                const customHTML = activePanel.dataset.fabHtml;
                if (this.fabElement.innerHTML !== customHTML) {
                    this.fabElement.innerHTML = customHTML;
                }
                return; // Encerra a função aqui, pois esta é a maior prioridade.
            }

            // Prioridade 2: Ícone Feather (data-fab-icon)
            // Um atalho conveniente se a biblioteca Feather Icons estiver em uso no projeto.
            if (window.feather) {
                const iconName = activePanel.dataset.fabIcon || this.defaultIcon;
                const currentIconElement = this.fabElement.querySelector('.noxss-icon');

                // Otimização: Evita re-renderizar se o ícone já for o correto.
                if (currentIconElement && currentIconElement.dataset.feather === iconName) return;

                // Garante que o ícone solicitado exista no Feather, senão usa o padrão.
                const iconSvg = feather.icons[iconName] 
                    ? feather.icons[iconName].toSvg({ class: 'noxss-icon', 'data-feather': iconName })
                    : feather.icons[this.defaultIcon].toSvg({ class: 'noxss-icon', 'data-feather': this.defaultIcon });

                this.fabElement.innerHTML = iconSvg;
            } 
            // Prioridade 3: Fallback de texto simples
            // Se Feather não estiver disponível, exibe um '+' para garantir que nunca fique vazio.
            else {
                this.fabElement.innerHTML = '<span style="font-size: 2rem; line-height: 1;">+</span>';
            }
        },

        /**
         * Executa a ação definida no atributo `data-fab-action`.
         * @param {Event} event - O evento de clique.
         */
        executeAction: function(event) {
            const actionString = this.fabElement.dataset.action;
            if (actionString) {
                event.preventDefault(); // Previne qualquer comportamento padrão se for um link, por exemplo.
                try {
                    // Executa a string como uma função. Ex: "app.minhaFuncao('parametro')"
                    // Nota: Esta abordagem é poderosa, mas requer que a função esteja acessível no escopo global (ex: window.app.minhaFuncao).
                    new Function(actionString)();
                } catch (e) {
                    console.error(`Noxss FAB: Erro ao executar a ação "${actionString}"`, e);
                }
            }
        }
    };

    // Anexa à biblioteca e auto-inicializa.
    Noxss.Fab = FabController;
    document.addEventListener('DOMContentLoaded', () => Noxss.Fab.init());

})(window.Noxss, window, document);