/*
Upon loading this script will search for a <script> tag with the id:main-script.
If it finds one, it will copy all of the javascript into a <pre> tag with
class 'code'. It will do some simple preprocessing of the script to find
marked lines and for those lines: apply different coloring and add an event
handler that will copy the line to the clipboard when clicked.

Currently, show.css provides styling that works with this
*/

document.addEventListener('DOMContentLoaded', function() {
    const source = document.getElementById('main-script');
    const codeDisplay = document.querySelector('pre.code');
    const classes = new Map();
    codeDisplay.innerHTML = source.text
    .split('\n').slice(1)
    .map(function(line) {
            let classAttr = '';    
            let matches = line.match(/\/\/~(\S+)($|\s)/);
            if(matches) {
                const klass = matches[1];
                classes.set(klass, 1);
                classAttr = ` class="${klass}" `;
                line = line.slice(0,matches.index);
            }
            return `<code ${classAttr}">${line}\n</code>`;
        }).reduce((block, line) => block + line, '');

    let classesStr = Array.from(classes.keys()).map((klass) => 'code.'+klass).join(',');
    for(codeNode of codeDisplay.querySelectorAll(classesStr)) {
        codeNode.addEventListener('click', function(click) {
            navigator.clipboard.writeText(click.target.innerText.trim());
        });
    }    
});
