// noxss/js/noxss.js

(function () {
    "use strict";

    const SVG_ICON_PLAY = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
    const SVG_ICON_PAUSE = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';
    const DEFAULT_ALBUM_ART_SRC = "packages/assets/preview/disc.jpg";
    const playersData = new Map(); // Para armazenar estado de cada player (playlist, currentIndex)

    function initializeNoxssPlayer(playerElement) {
        const playerId = playerElement.id;
        if (!playerId) {
            console.error("Noxss Player: O elemento player precisa de um ID único.");
            return;
        }

        const audioPlayer = playerElement.querySelector(".noxss-audio-player");
        const albumArtImg = playerElement.querySelector(".noxss-album-art");
        const trackTitleEl = playerElement.querySelector(".noxss-title");
        const trackArtistEl = playerElement.querySelector(".noxss-artist");
        const playPauseButton = playerElement.querySelector(".noxss-play-pause");
        const prevButton = playerElement.querySelector(".noxss-prev-button");
        const nextButton = playerElement.querySelector(".noxss-next-button");

        if (!audioPlayer) {
            console.error(`Noxss Player (${playerId}): Elemento <audio class='noxss-audio-player'> não encontrado.`);
            return;
        }

        // Inicializa dados do player
        playersData.set(playerId, {
            playlist: [],
            currentIndex: -1,
            element: playerElement,
            audioElement: audioPlayer,
            uiElements: { albumArtImg, trackTitleEl, trackArtistEl, playPauseButton, prevButton, nextButton }
        });

        function updateTrackInfoUI(title, artist) {
            if (trackTitleEl) trackTitleEl.textContent = title || "Título Desconhecido";
            if (trackArtistEl) trackArtistEl.textContent = artist || "Artista Desconhecido";
        }

        function updateAlbumArtUI(pictureData) {
            if (!albumArtImg) return;
            if (pictureData) {
                const { data, format } = pictureData;
                let base64String = "";
                for (let i = 0; i < data.length; i++) {
                    base64String += String.fromCharCode(data[i]);
                }
                albumArtImg.src = `data:${format};base64,${window.btoa(base64String)}`;
            } else {
                albumArtImg.src = DEFAULT_ALBUM_ART_SRC;
            }
        }

        function updatePlayPauseButtonUI(isPlaying) {
            if (!playPauseButton) return;
            playPauseButton.innerHTML = isPlaying ? SVG_ICON_PAUSE : SVG_ICON_PLAY;
            playPauseButton.classList.toggle("noxss-active", isPlaying);
            playPauseButton.setAttribute("aria-label", isPlaying ? "Pause" : "Play");
        }

        function setPlayerUIToLoading(songNameHint) {
            updateTrackInfoUI("Carregando...", songNameHint || "");
            if (albumArtImg) albumArtImg.src = DEFAULT_ALBUM_ART_SRC;
            if (playPauseButton) {
                playPauseButton.disabled = true;
                updatePlayPauseButtonUI(false);
            }
            if (prevButton) prevButton.disabled = true;
            if (nextButton) nextButton.disabled = true;
        }

        function setPlayerUIToDefault(message = "Nenhuma playlist carregada") {
            updateTrackInfoUI(message, "");
            if (albumArtImg) albumArtImg.src = DEFAULT_ALBUM_ART_SRC;
            if (playPauseButton) {
                playPauseButton.disabled = true;
                if (!playPauseButton.querySelector("svg")) {
                    playPauseButton.innerHTML = SVG_ICON_PLAY;
                }
                playPauseButton.classList.remove("noxss-active");
                playPauseButton.setAttribute("aria-label", "Play");
            }
            if (prevButton) prevButton.disabled = true;
            if (nextButton) nextButton.disabled = true;
        }

        function enablePlayerControls(hasPrev, hasNext) {
            if (playPauseButton) playPauseButton.disabled = false;
            if (prevButton) prevButton.disabled = !hasPrev;
            if (nextButton) nextButton.disabled = !hasNext;
        }

        async function fetchAndLoadSong(songUrl, songNameHint) {
            setPlayerUIToLoading(songNameHint);
            audioPlayer.pause(); // Garante que o anterior pare
            audioPlayer.src = songUrl;
            audioPlayer.load(); // Necessário para carregar a nova fonte

            try {
                // Tenta tocar (pode ser bloqueado por políticas de autoplay)
                await audioPlayer.play();
            } catch (playError) {
                console.warn(`Noxss Player (${playerId}): Autoplay bloqueado ou erro ao iniciar play para ${songUrl}. O usuário precisa interagir.`, playError);
                // A UI será atualizada para 'play' pelo evento 'canplay' ou 'pause'
            }

            if (typeof jsmediatags !== "undefined") {
                // jsmediatags não funciona bem com fetch para URLs diretas de áudio
                // para obter metadados sem baixar o arquivo inteiro.
                // A melhor forma é quando o áudio está carregado no <audio> e o navegador já parseou alguns metadados.
                // Ou usar um servidor proxy para ler tags.
                // Para simplificar, vamos tentar ler tags após o 'loadedmetadata' ou 'canplaythrough'.
                // Se não, usaremos o nome do arquivo (extraído da URL) como fallback.
            } else {
                console.warn(`Noxss Player (${playerId}): jsmediatags não carregado. Metadados não serão buscados.`);
                const fallbackTitle = songUrl.substring(songUrl.lastIndexOf("/") + 1).replace(/\.[^/.]+$/, "") || "Título Desconhecido";
                updateTrackInfoUI(fallbackTitle, "Artista Desconhecido");
                // enablePlayerControls já será chamado pelos eventos do audioPlayer
            }
        }

        // Função para tentar buscar metadados DEPOIS que o áudio está carregado o suficiente
        async function tryFetchMetadata(songUrl) {
            const playerData = playersData.get(playerId);
            if (!playerData || typeof jsmediatags === "undefined") return;

            try {
                // Para jsmediatags funcionar com URL, precisa de uma requisição.
                // Isso baixa o arquivo, o que pode ser indesejado para streaming.
                // Uma alternativa é usar o evento 'loadedmetadata' do <audio> e ver o que o navegador oferece.
                // Por agora, vamos simular a leitura para fins de demonstração.
                // Idealmente, seu backend forneceria metadados ou você usaria uma lib mais robusta para streaming.

                // Simulação: Extrai nome da URL
                let fileName = songUrl.substring(songUrl.lastIndexOf("/") + 1);
                updateTrackInfoUI(fileName.replace(/\.[^/.]+$/, ""), "Artista Desconhecido");
                updateAlbumArtUI(null); // Resetar para o padrão

                // Se você tiver um servidor que possa ler as tags do arquivo na URL:
                // jsmediatags.read(songUrl, { onSuccess: ..., onError: ... });
                // Ou se a URL permitir CORS e for um arquivo local acessível via fetch:
                const response = await fetch(songUrl);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const fileBlob = await response.blob();

                jsmediatags.read(fileBlob, {
                    onSuccess: function (tag) {
                        console.log(`Noxss Player (${playerId}): Metadados lidos para ${songUrl}`, tag.tags);
                        const tags = tag.tags;
                        updateTrackInfoUI(tags.title, tags.artist);
                        updateAlbumArtUI(tags.picture);
                    },
                    onError: function (error) {
                        console.error(`Noxss Player (${playerId}): Erro ao ler tags de ${songUrl}:`, error.type, error.info);
                        // Fallback para nome do arquivo já feito acima
                    }
                });
            } catch (error) {
                console.error(`Noxss Player (${playerId}): Falha ao buscar ou processar metadados para ${songUrl}`, error);
            }
        }

        function playSongAtIndex(index) {
            const playerData = playersData.get(playerId);
            if (!playerData || index < 0 || index >= playerData.playlist.length) {
                console.warn(`Noxss Player (${playerId}): Índice de música inválido: ${index}`);
                setPlayerUIToDefault("Fim da playlist");
                if (audioPlayer) audioPlayer.pause();
                return;
            }
            playerData.currentIndex = index;
            const songUrl = playerData.playlist[index];
            const songNameHint = songUrl.substring(songUrl.lastIndexOf("/") + 1);

            fetchAndLoadSong(songUrl, songNameHint);
            // Metadados serão tentados no evento 'loadedmetadata' ou 'canplay' do áudio
        }

        function playNext() {
            const playerData = playersData.get(playerId);
            if (playerData && playerData.currentIndex < playerData.playlist.length - 1) {
                playSongAtIndex(playerData.currentIndex + 1);
            } else {
                console.info(`Noxss Player (${playerId}): Fim da playlist.`);
                // Opcional: Parar ou voltar para o início
                setPlayerUIToDefault("Fim da playlist");
                if (audioPlayer) audioPlayer.pause();
                updatePlayPauseButtonUI(false);
                if (prevButton) prevButton.disabled = !(playerData.playlist.length > 1); // Habilita prev se tiver mais de uma
                if (nextButton) nextButton.disabled = true;
            }
        }

        function playPrevious() {
            const playerData = playersData.get(playerId);
            if (playerData && playerData.currentIndex > 0) {
                playSongAtIndex(playerData.currentIndex - 1);
            } else {
                console.info(`Noxss Player (${playerId}): Início da playlist.`);
            }
        }

        function togglePlayPause() {
            if (!audioPlayer || !audioPlayer.src || audioPlayer.src === window.location.href || audioPlayer.readyState < audioPlayer.HAVE_METADATA) {
                const playerData = playersData.get(playerId);
                if (playerData && playerData.playlist.length > 0 && playerData.currentIndex === -1) {
                    // Se tem playlist mas nenhuma música foi tocada, inicia a primeira
                    playSongAtIndex(0);
                } else {
                    console.warn(`Noxss Player (${playerId}): Nenhuma música carregada ou metadados insuficientes.`);
                }
                return;
            }
            if (audioPlayer.paused) {
                audioPlayer.play().catch(error => {
                    console.error(`Noxss Player (${playerId}): Erro ao tentar tocar:`, error);
                    updatePlayPauseButtonUI(false);
                });
            } else {
                audioPlayer.pause();
            }
        }

        // Event Listeners do Audio Element
        audioPlayer.addEventListener("play", () => {
            updatePlayPauseButtonUI(true);
            const playerData = playersData.get(playerId);
            if (playerData) enablePlayerControls(playerData.currentIndex > 0, playerData.currentIndex < playerData.playlist.length - 1);
        });
        audioPlayer.addEventListener("pause", () => {
            updatePlayPauseButtonUI(false);
            const playerData = playersData.get(playerId);
            if (playerData && playerData.playlist.length > 0) {
                // Mantém controles habilitados se tem playlist
                enablePlayerControls(playerData.currentIndex > 0, playerData.currentIndex < playerData.playlist.length - 1);
            }
        });
        audioPlayer.addEventListener("ended", playNext);
        audioPlayer.addEventListener("error", e => {
            console.error(`Noxss Player (${playerId}): Erro no elemento de áudio:`, e);
            setPlayerUIToDefault("Erro ao carregar música");
            // Tenta ir para a próxima em caso de erro?
            // setTimeout(playNext, 2000); // Ex: tenta a próxima após 2s
        });
        audioPlayer.addEventListener("loadedmetadata", () => {
            // ou 'canplay'
            const playerData = playersData.get(playerId);
            if (playerData && playerData.currentIndex !== -1) {
                const songUrl = playerData.playlist[playerData.currentIndex];
                tryFetchMetadata(songUrl); // Tenta buscar metadados agora que o áudio tem info
                enablePlayerControls(playerData.currentIndex > 0, playerData.currentIndex < playerData.playlist.length - 1);
                if (audioPlayer.paused && playPauseButton && !playPauseButton.disabled) {
                    // Se carregou mas não auto-iniciou
                    updatePlayPauseButtonUI(false);
                }
            }
        });

        // Event Listeners dos Botões de Controle
        if (playPauseButton) playPauseButton.addEventListener("click", togglePlayPause);
        if (prevButton) prevButton.addEventListener("click", playPrevious);
        if (nextButton) nextButton.addEventListener("click", playNext);

        setPlayerUIToDefault(); // Estado inicial do player
    }

    // API Pública da Biblioteca Noxss
    window.Noxss = {
        initPlayerById: function (playerId) {
            const playerElement = document.getElementById(playerId);
            if (playerElement) {
                if (!playersData.has(playerId)) {
                    // Evitar re-inicialização
                    initializeNoxssPlayer(playerElement);
                }
            } else {
                console.error(`Noxss: Player com ID '${playerId}' não encontrado.`);
            }
        },
        setPlaylist: function (playerId, songUrls, playImmediately = false) {
            const playerData = playersData.get(playerId);
            if (playerData && Array.isArray(songUrls)) {
                playerData.playlist = songUrls;
                playerData.currentIndex = -1; // Reseta o índice
                if (songUrls.length > 0) {
                    if (playImmediately) {
                        // A função playSongAtIndex é chamada dentro de initializeNoxssPlayer
                        // Vamos apenas chamar a função interna para tocar a primeira música
                        const playerInstance = playersData.get(playerId);
                        if (playerInstance) {
                            // Acessar a função playSongAtIndex de forma indireta ou refatorar
                            // Por agora, chamamos um método "interno"
                            const internalPlayFunc =
                                playerInstance.element.querySelector(".noxss-play-pause").__noxss_internal_playSongAtIndex ||
                                function (index) {
                                    // Fallback se não anexado
                                    const pData = playersData.get(playerId);
                                    if (!pData || index < 0 || index >= pData.playlist.length) return;
                                    pData.currentIndex = index;
                                    const songUrl = pData.playlist[index];
                                    const songNameHint = songUrl.substring(songUrl.lastIndexOf("/") + 1);
                                    pData.uiElements.playPauseButton.disabled = true; // Desabilita temporariamente
                                    // Replicar lógica de fetchAndLoadSong
                                    pData.audioElement.pause();
                                    pData.audioElement.src = songUrl;
                                    pData.audioElement.load();
                                    pData.audioElement.play().catch(e => console.warn("Autoplay bloqueado", e));
                                    // Metadados serão tratados no 'loadedmetadata'
                                    const fallbackTitle = songUrl.substring(songUrl.lastIndexOf("/") + 1).replace(/\.[^/.]+$/, "") || "Título Desconhecido";
                                    if (pData.uiElements.trackTitleEl) pData.uiElements.trackTitleEl.textContent = "Carregando...";
                                    if (pData.uiElements.trackArtistEl) pData.uiElements.trackArtistEl.textContent = fallbackTitle;
                                    if (pData.uiElements.albumArtImg) pData.uiElements.albumArtImg.src = DEFAULT_ALBUM_ART_SRC;
                                };
                            internalPlayFunc(0);
                        }
                    } else {
                        // Apenas atualiza a UI para mostrar que uma playlist está pronta
                        const firstSongUrl = songUrls[0];
                        const songNameHint = firstSongUrl.substring(firstSongUrl.lastIndexOf("/") + 1).replace(/\.[^/.]+$/, "");
                        if (playerData.uiElements.trackTitleEl) playerData.uiElements.trackTitleEl.textContent = songNameHint || "Pronto para tocar";
                        if (playerData.uiElements.trackArtistEl) playerData.uiElements.trackArtistEl.textContent = "Playlist carregada";
                        if (playerData.uiElements.albumArtImg) playerData.uiElements.albumArtImg.src = DEFAULT_ALBUM_ART_SRC;
                        playerData.uiElements.playPauseButton.disabled = false;
                        updatePlayPauseButtonUI(false);
                        playerData.uiElements.prevButton.disabled = true;
                        playerData.uiElements.nextButton.disabled = songUrls.length <= 1;
                    }
                } else {
                    setPlayerUIToDefault("Playlist vazia");
                }
            } else {
                console.error(`Noxss: Player com ID '${playerId}' não inicializado ou lista de músicas inválida.`);
            }
        }
        // Futuramente: Noxss.getPlayerState(playerId), etc.
    };

    // Inicializa todos os players com a classe .noxss-player-compact que têm um ID
    document.addEventListener("DOMContentLoaded", () => {
        if (typeof feather !== "undefined") feather.replace();
        if (typeof Waves !== "undefined") {
            Waves.init();
            // Waves.attach(".noxss-control-button", ["waves-circle", "waves-light"]);
        }

        const playersOnPage = document.querySelectorAll(".noxss-player-compact[id]");
        playersOnPage.forEach(playerEl => {
            if (!playersData.has(playerEl.id)) {
                window.Noxss.initPlayerById(playerEl.id);
            }
        });
    });
})();
