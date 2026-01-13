export class OutputHandler {
    
    
    constructor() {
        this.currentOutputIndex = 0;
        this.outputLines = [];
        this.currentBeginIndex = undefined;
        this.currentMacroName = "";
    }

    reset() {
        this.currentOutputIndex = 0;
        this.outputLines = [];
        this.currentBeginIndex = undefined;
        this.currentMacroName = "";
    }

    getCurrentIndex() {
        return this.currentOutputIndex;
    }

    increaseIndex(increment) {
        this.currentOutputIndex += increment;
    }

    addLines(code) {
        this.outputLines = this.outputLines.concat(code);
    }

    addLinesAtHash(code, hash) {
        let neededLine = this.outputLines.find(line => line.includes(hash));
        let neededIndex = this.outputLines.indexOf(neededLine);
        if (neededIndex == -1) {
            return;
        }
        this.outputLines = this.outputLines.slice(0, neededIndex)
                .concat(code)
                .concat(this.outputLines.slice(neededIndex+1));
    }

    print() {
        let finalCode = document.querySelector("#final_code");
        let outputCode = [];
        this.outputLines.forEach(line => {
            if (line.includes("[MACROHASHCOMING]")) {
                outputCode.push(line.slice(0, -25));
            } else {
                outputCode.push(line);
            }
        });
        finalCode.value = outputCode.join("\n")
    }

    printToConsole() {
        this.outputLines.forEach(line => {
            if (line.includes("[MACROHASHCOMING]")) {
                console.log(line.slice(0, -25));
            } else {
                console.log(line);
            }
        });
    }

    printCurrentLine(line) {
        document.querySelector("#great_line").value = line.join(" ");
    }

    printVariablesTable(storage) {
        document.querySelector("#variablesTable").innerHTML = `<tr>
                            <th class="column_1">Имя</th>
                            <th class="column_2">Значение</th>
                        </tr>`;
                        
        for (const [key, value] of storage) {
            document.querySelector("#variablesTable").insertAdjacentHTML('beforeend', `<tr>
                            <td class="column_1">${key}</td>
                            <td class="column_2">${value}</td>
                        </tr>`);
        }
    }

    loadBeginIndex(index, name) {
        this.currentBeginIndex = index;
        this.currentMacroName = name;
    }

    loadMacroName(index) {
        let dlina = index - this.currentBeginIndex - 1;
        let toLoad = `
        <tr>
                            <td class="column_1">${this.currentMacroName}</td>
                            <td class="column_2_2">${this.currentBeginIndex}</td>
                            <td class="column_3_2">${dlina}</td>
                        </tr>
        `;

        document.querySelector("#macroNameTable").insertAdjacentHTML('beforeend', toLoad);
    }
}