import { loadJson } from "./utils.js";

// Define os caminhos para os arquivos JSON de dados da Bíblia.
const versesPath = "resources/biblia/versions/NTLH/verses.json";
const storiesPath = "resources/biblia/versions/NTLH/stories.json";
const booksPath = "resources/biblia/books.json";

/**
 * Busca o nome de um livro e gera o cabeçalho HTML para um capítulo específico.
 * @param {number} bookID - O número de identificação do livro.
 * @param {number} chapter - O número do capítulo.
 * @returns {Promise<string>} Uma string contendo o HTML do cabeçalho.
 */
async function getBook(bookID, chapter) {
    const books = await loadJson(booksPath);
    const book = books.find(b => b.book_number === bookID);

    const headerHtml = `<h1 class="text-center mt-5 mb-1"><b>${book.name.toUpperCase()} ${chapter}</b></h1>\n\n<hr />\n\n`;

    return headerHtml;
}

/**
 * Busca e filtra as histórias (títulos de seções) para um capítulo específico.
 * @param {number} bookID - O número de identificação do livro.
 * @param {number} chapter - O número do capítulo.
 * @returns {Promise<Array<object>>} Um array de objetos, onde cada objeto é uma história.
 */
async function getStories(bookID, chapter) {
    let stories = await loadJson(storiesPath);

    // Filtra as histórias para o livro e capítulo corretos,
    // e remove títulos que contêm "<x>", que podem ser referências cruzadas ou notas.
    const filteredStories = stories.filter(story => story.book_number === bookID && story.chapter === chapter && !story.title.includes("<x>"));

    return filteredStories;
}

/**
 * Busca e filtra todos os versículos de um capítulo específico.
 * Esta função é responsável apenas por obter os dados brutos dos versículos.
 * @param {number} bookID - O número de identificação do livro.
 * @param {number} chapter - O número do capítulo.
 * @returns {Promise<Array<object>>} Um array de objetos, onde cada objeto é um versículo.
 */
async function getChapterVerses(bookID, chapter) {
    const verses = await loadJson(versesPath);

    // Filtra para obter apenas os versículos do livro e capítulo desejados,
    // e remove quaisquer versículos que tenham o campo de texto vazio.
    const filteredVerses = verses.filter(verse => verse.book_number === bookID && verse.chapter === chapter && verse.text !== "");

    console.log(filteredVerses);

    return filteredVerses;
}

/**
 * Processa os arrays de versículos e histórias para gerar o conteúdo HTML do capítulo.
 * @param {Array<object>} verses - O array de objetos de versículos.
 * @param {Array<object>} stories - O array de objetos de histórias (títulos).
 * @returns {string} Uma string contendo o HTML do corpo do capítulo.
 */
function processChapterHtml(verses, stories) {
    let chapterHtml = "";

    for (let i = 0; i < verses.length; i++) {
        let verseNumberHtml = "";

        // Encontra se existe uma história (título) para o versículo atual.
        const matchingStory = stories.find(story => story.verse === verses[i].verse);

        // Adiciona o número do versículo se ele já não estiver presente no texto (marcado com "<n>").
        if (!verses[i].text.includes("<n>")) {
            verseNumberHtml = `<n>${verses[i].verse}</n> `;
        }

        let storyHtml = "";
        // Se uma história foi encontrada, formata-a como um parágrafo de destaque.
        if (matchingStory) {
            storyHtml = `<p class="lead">${matchingStory.title}</p>\n\n`;
        }

        // Monta a string HTML para o versículo atual, incluindo a história (se houver).
        chapterHtml += storyHtml + `<p class="verse">${verseNumberHtml}${verses[i].text}</p>\n\n`;
    }

    return chapterHtml;
}

/**
 * Função controladora que orquestra a busca e a renderização de um capítulo.
 * @param {string} input - Uma string no formato "bookID chapter" (ex: "660 3").
 */
async function displayChapter(input) {
    const inputArray = input.split(" ");
    const bookID = Number(inputArray[0]);
    const chapter = Number(inputArray[1]);

    // 1. Obter todos os dados necessários de forma assíncrona.
    const versesData = await getChapterVerses(bookID, chapter);
    const storiesData = await getStories(bookID, chapter);
    const headerContent = await getBook(bookID, chapter);

    // 2. Processar os dados para gerar o HTML do corpo do capítulo.
    const chapterContent = processChapterHtml(versesData, storiesData);

    // 3. Renderizar o conteúdo no DOM.
    const bibleContainer = document.getElementById("biblia");
    bibleContainer.innerHTML = headerContent + chapterContent;
    console.log(bibleContainer.innerHTML);
}

/**
 * Ponto de entrada principal. Executado quando o DOM está totalmente carregado.
 * Carrega e exibe um capítulo padrão ao iniciar a página.
 */
document.addEventListener("DOMContentLoaded", async () => {
    console.log("DOM completamente carregado e parseado. Iniciando carregamento dos dados JSON.");

    try {
        const defaultBookID = 660;
        const defaultChapter = 3;

        // Etapa 1: Obter todos os dados necessários em paralelo para otimização.
        const [versesData, storiesData, headerContent] = await Promise.all([getChapterVerses(defaultBookID, defaultChapter), getStories(defaultBookID, defaultChapter), getBook(defaultBookID, defaultChapter)]);

        // Etapa 2: Processar os dados obtidos para gerar o HTML do corpo do capítulo.
        const chapterContent = processChapterHtml(versesData, storiesData);

        // Etapa 3: Encontrar o elemento no DOM e renderizar o conteúdo.
        const bibleContainer = document.getElementById("biblia");
        if (bibleContainer) {
            bibleContainer.innerHTML = headerContent + chapterContent;
            console.log(bibleContainer.innerHTML);
            console.log("Conteúdo da Bíblia adicionado ao DOM.");
        } else {
            console.error('Elemento com ID "biblia" não encontrado.');
        }
    } catch (error) {
        // Bloco para tratamento de erros durante a carga inicial.
        console.error("Ocorreu um erro durante o carregamento ou exibição dos dados:", error);
        const bibleContainer = document.getElementById("biblia");
        if (bibleContainer) {
            bibleContainer.innerHTML = "<p style='color: red;'>Ocorreu um erro ao carregar o conteúdo.</p>";
        }
    }
});
