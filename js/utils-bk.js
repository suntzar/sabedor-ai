export async function loadJson(path) {
    let json;
    json = await fetch(path);
    json = await json.json();
    return json;
}