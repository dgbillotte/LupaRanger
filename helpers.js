export function stringToHTML(innerHTML) {
    const tmp = document.createElement('div');
    tmp.innerHTML = innerHTML;
    return tmp.firstChild;
}