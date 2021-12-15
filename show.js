document.addEventListener('DOMContentLoaded', function() {
    const source = document.getElementById('main-script');
    const codeDisplay = document.querySelector('pre.code');
    codeDisplay.innerHTML = source.text
        .split('\n').slice(1)
        .map((line) => `<code>${line}\n</code>`)
        .reduce((block, line) => block + line, "");
});
