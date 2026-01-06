let currentLine = 0;

export function loadDefaultExample(code) {
    document.querySelector("#user_code").value = code;
}

export function readUserCode(code) {
    let codeByLines = code.split("\n");

    /*
    resultCode looks like this
    [
        ["PROG", "START", "1"],
        ["MACRO", "mac", "a"],
        ["INC", "a"]
    ]
    */
    
    let resultCode = [];
    for(let i = 0; i < codeByLines.length; i++) {
        resultCode[i] = codeByLines[i].split(" ");
    }

    return resultCode;
}

export function printNextMacroDefLine(macroName, line) {
    let toLoad = `  <tr>
                        <td class="column_1" id="macDefName_${currentLine}">${macroName}</td>
                        <td class="column_2" id="macDefBody_${currentLine}">${line}</td>
                    </tr>`;
    document.querySelector("#macroDefinitionTable").insertAdjacentHTML('beforeend', toLoad);
    currentLine++;
}