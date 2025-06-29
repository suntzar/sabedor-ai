/**
 * Noxss Library: Compact Player Component JS
 * Anexa a funcionalidade do player ao namespace `Noxss.Player`.
 * Auto-inicializa players com a classe .noxss-player-compact que possuem um ID.
 */
(function(Noxss) {
    "use strict";

    if (typeof Noxss === 'undefined') {
        console.error("Noxss Core (core.js) não foi carregado. O componente Player não pode ser inicializado.");
        return;
    }

    const SVG_ICON_PLAY = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
    const SVG_ICON_PAUSE = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';
    const DEFAULT_ALBUM_ART_SRC = "packages/assets/preview/disc.jpg";
    const playersData = new Map();

    // Todas as funções internas que você já tinha (updateTrackInfoUI, fetchAndLoadSong, etc.)
    // vão aqui, sem alterações.
    // ...

    // [COLE AQUI TODA A LÓGICA INTERNA DO SEU ARQUIVO noxss.js ORIGINAL]
    // (Apenas o conteúdo da função IIFE, sem o `(function() { ... })()` externo)

    // Exemplo da estrutura interna que deve ser colada:
    function initializeNoxssPlayer(playerElement) {
        const playerId = playerElement.id;
        // ... sua lógica de inicialização existente
    }

    function setPlaylistForPlayer(playerId, songUrls, playImmediately = false) {
        const playerData = playersData.get(playerId);
        // ... sua lógica para definir a playlist
    }

    function initPlayerById(playerId) {
        const playerElement = document.getElementById(playerId);
        if (playerElement && !playersData.has(playerId)) {
            initializeNoxssPlayer(playerElement);
        } else if (!playerElement) {
            console.error(`Noxss.Player: Elemento com ID '${playerId}' não encontrado.`);
        }
    }

    function autoInitializePlayers() {
        const playersOnPage = document.querySelectorAll(".noxss-player-compact[id]");
        playersOnPage.forEach(playerEl => initPlayerById(playerEl.id));
    }

    // API Pública: Anexa o objeto Player ao namespace Noxss
    Noxss.Player = {
        initById: initPlayerById,
        setPlaylist: setPlaylistForPlayer,
        // Futuramente: getState, play, pause, etc.
    };
    
    // Auto-inicialização quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInitializePlayers);
    } else {
        autoInitializePlayers();
    }

})(window.Noxss);