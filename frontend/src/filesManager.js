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

export async function readTextFile(event) {
    const file = event.target.files[0];
    
    if (!file || !file.type.match('text.*')) {
        throw new Error('Пожалуйста, выберите текстовый файл');
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            // Убираем все \r из текста
            let content = e.target.result;
            
            // Заменяем \r\n на \n (Windows формат)
            content = content.replace(/\r\n/g, '\n');
            
            // На всякий случай заменяем одиночные \r на \n (старый Mac формат)
            content = content.replace(/\r/g, '\n');
            
            resolve(content);
        };
        reader.onerror = (e) => reject(new Error('Ошибка при чтении файла'));
        
        reader.readAsText(file);
    });
};

export function readModifiedCode() {
    return document.querySelector("#user_code").value;
}

export function clearTables() {
    document.querySelector("#macroDefinitionTable").innerHTML = `<tr>
                            <th class="column_1">Имя макроса</th>
                            <th class="column_2">Тело макроса</th>
                        </tr>`;
    document.querySelector("#macroNameTable").innerHTML = `<tr>
                            <th class="column_1">Имя</th>
                            <th class="column_2_2">Начало</th>
                            <th class="column_3_2">Длина</th>
                        </tr>`;
    document.querySelector("#variablesTable").innerHTML = `<tr>
                            <th class="column_1">Имя</th>
                            <th class="column_2">Значение</th>
                        </tr>`;
    document.querySelector("#final_code").value = "";
    document.querySelector("#great_line").vaule = "";
}