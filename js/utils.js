// js/utils.js

// Objeto para armazenar os dados JSON em cache
const jsonCache = {};

export async function loadJson(path) {
    // Verifica se os dados para este path já estão no cache
    if (jsonCache[path]) {
        console.log(`[Cache Hit] Retornando dados cacheados para: ${path}`);
        // Retorna a Promise que já está no cache (pode ser resolvida ou ainda pendente)
        return jsonCache[path];
    }

    console.log(`[Cache Miss] Carregando dados para: ${path}`);
    // Se não estiver no cache, faz a requisição e o parse
    const dataPromise = fetch(path)
        .then(response => {
            if (!response.ok) {
                // Lidar com erros HTTP (ex: 404 Not Found)
                throw new Error(`HTTP error! status: ${response.status} loading ${path}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error(`Erro ao carregar ou parsear ${path}:`, error);
            // Opcional: Remover do cache se falhou, ou cachear o erro
            // delete jsonCache[path]; // Descomente se quiser tentar carregar novamente na próxima vez que falhar
            throw error; // Propaga o erro para quem chamou loadJson
        });

    // Armazena a Promise (não o dado final) no cache.
    // Isso é importante! Se loadJson for chamado várias vezes para o mesmo path
    // antes da primeira requisição terminar, todos esperarão pela mesma Promise.
    jsonCache[path] = dataPromise;

    // Retorna a Promise
    return dataPromise;
}

// Se houver outras funções utilitárias em utils.js, mantenha-as aqui.