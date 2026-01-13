import { generateHash, handleError, isIntegerString, isValidMacroMetka, isValidRealMetkaName } from "./utils.js";

export class MacroBase {

    constructor() {
        // current macro is macro that we're defining at the moment
        this.currentMacroName = "";
        this.currentMacroParams = {};
        this.currentMacroBody = [];
        this.definedMacros = [];
        this.possibleDelayedMacroCalls = [];
        this.usedMacros = [];
    }

    reset() {
        this.currentMacroName = "";
        this.currentMacroParams = {};
        this.currentMacroBody = [];
        this.definedMacros = [];
        this.possibleDelayedMacroCalls = [];
        this.usedMacros = [];
    }
    
    isValidMacroName(name) {
        const identifierRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/; 

        return identifierRegex.test(name);
    }

    /*
    a b c=1 d=1
    */
    prepareParams(params) {
        let preparedParams = {
            positionParams: []
        };
        let uniqueParams = [];
        let positionParams = true;                  //flag
        
        for (let i = 0; i < params.length; i++) {
            if (params[i].includes("=")) {
                positionParams = false;
            }

            // POSITION PARAMS DEFINITION
            if (positionParams) {
                if (!this.isValidParamValue(params[i])) {
                    handleError("param value gone wrong ");
                    return -1;
                }

                if (uniqueParams.includes(params[i])) {
                    handleError("several params with the exactly the same name");
                    return -1;
                }

                preparedParams.positionParams.push(params[i]);
            }

            // KEY PARAMS DEFINITION
            else {
                if (!params[i].includes("=")) {
                    handleError("Expected key param but got whatever");
                    return -1;
                }

                let [paramName, paramValue] = params[i].split("=");
                if (!this.isValidParamValue(paramName)) {
                    handleError("param value is really mad wrong");
                    return -1;
                }

                if (uniqueParams.includes(paramName)) {
                    handleError("several params with the exactly actually the same name fr");
                    return -1;
                }

                preparedParams[paramName] = paramValue ? paramValue : undefined;
            }

        }

        return preparedParams;
    }

    isValidParamValue(param) {
        const identifierRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/; 

        return identifierRegex.test(param);
    }

    saveLocalNameAndParams(name, params) {
        this.currentMacroName = name;
        this.currentMacroParams = params;
    }

    pushLineToMacroDef(line) {
        this.currentMacroBody.push(line);
    }

    addMacro() {
        this.definedMacros.push(new macroDefinition(this.currentMacroName, this.currentMacroParams, this.currentMacroBody));
        this.currentMacroBody = [];
    }

    getMyMacros() {
        return this.definedMacros;
    }

    hasThisMacro(macroName) {
        return this.definedMacros.some(el => el.name == macroName);
    }

    checkForRepeat(code) {
        let used = [];

        for (let i = 0; i < code.length; i++) {
            let line = code[i].filter(el => el != "");
            if (isValidMacroMetka(line[0])) {
                if (used.includes(line[0])) {
                    handleError(`Повторное использование макрометки. Проверьте ${line[0]}`);
                    return -1;
                }
                used.push(line[0]);
            }
        }
    }

    callMacro(macroName, params, glStorage, directiveHandler, storageStack = []) {

        let usedMacro = this.usedMacros.find(el => el.name == macroName);
        let usedRealMetkas = [];
        let metkaIndex;
        if (usedMacro) {
            usedMacro.usageCounter++;
            metkaIndex = usedMacro.usageCounter;
        }
        else {
            this.usedMacros.push({
                name: macroName,
                usageCounter: 0 // zero-based index gng
            });

            metkaIndex = 0;
        }
        
        let currentMacro = this.definedMacros.find(el => el.name == macroName);
        let locStorage = this.isParamsValid(params, currentMacro.params, glStorage, storageStack);
        storageStack.push(locStorage);
        let gotError = false;
        let directiveStack = [];

        // for if/while directives
        let skipIfCounter = 0, skipWhileCounter = 0;
        let currentlySkipping = false;

        // for aif/ago
        let lookingForMetka = undefined;
        let previousValue = undefined;
        let relativeNamespace = 0;

        // check macro metkas do not repeat
        let repeatCheck = this.checkForRepeat(currentMacro.body);
        if (repeatCheck == -1) {
            return -1;
        }

        if (locStorage == -1) {
            return -1;
        }
        let outputString = "";
        
        for (let i = 0; i < currentMacro.body.length; i++) {
            let line = currentMacro.body[i].filter(el => el != "").map(el => el.replace(/\t/g, ''));
            if (line.length == 0) continue;

            if (gotError) continue;

            /////////////////////////////////////////////////////////////////////////////////////////////
            // handle ago directive
            /////////////////////////////////////////////////////////////////////////////////////////////
            if (line[0] == "AGO") {
                if (currentlySkipping) continue;
                if(!isValidMacroMetka(line[1])) {
                    handleError(`Некорректно задана макрометка ${line[1]}`);
                    return -1;
                }

                lookingForMetka = line[1];
                continue;
            }

            if (line[0] == "AIF") {
                if (!line[1] || !line[2] || line[3]) {
                    handleError(`Некорректная запись директивы AIF ${line}`);
                    return -1;
                }

                let currentConditionResult = this.checkCondition(line[1], glStorage, storageStack);
                if (currentConditionResult) {
                    if (!isValidMacroMetka(line[2])) {
                        handleError(`Некоректно записана макрометка ${line[2]}. Макрометка должна начинаться с % и иметь корректный синтакс`);
                        return -1;
                    }
                    lookingForMetka = line[2];
                    continue;
                }

                continue;
            }

            if (isValidMacroMetka(line[0])) {
                if (line[0] == lookingForMetka && relativeNamespace == 0) {
                    lookingForMetka = false;
                }

                if (!directiveHandler.isAssemblyDirective(line[1])) {
                    handleError(`Макрометка должна находиться перед директивой ассемблера. Проверьте ${line}`);
                    return -1;
                }

                line = line.slice(1);
            }

            if (isValidRealMetkaName(line[0])) {
                if (usedRealMetkas.includes(line[0])) {
                    handleError(`Повторное использование метки ${line[0]}`);
                    return -1;
                } else {
                    usedRealMetkas.push(line[0]);
                }
                
                if (!directiveHandler.isAssemblyDirective(line[1])) {
                    handleError(`Метка должна находиться перед директивой ассемблера. Проверьте ${line.join(" ")}`);
                    return -1;
                }
                
                if (currentlySkipping || lookingForMetka) continue;

                let result = directiveHandler.handle(line, glStorage, storageStack, macroName, metkaIndex);
                outputString += result + "\n";
                continue;
            }

            /////////////////////////////////////////////////////////////////////////////////////////////
            // handle while directive
            /////////////////////////////////////////////////////////////////////////////////////////////
            if (line[0] == "WHILE") {
                
                if (lookingForMetka) {
                    if (!previousValue) {
                        relativeNamespace++;
                        previousValue = "WHILE";
                        continue;
                    }
                }

                if(currentlySkipping) {
                    skipWhileCounter++;
                    continue;
                }

                if (!line[1] || line[2]) {
                    handleError(`Некорректная запись директивы WHILE ${line}`);
                    return -1;
                }

                let currentConditionResult = this.checkCondition(line[1], glStorage, storageStack);
                if (currentConditionResult == -1) return -1;

                directiveStack.push({
                    name: "WHILE",
                    conditionLine: line[1],
                    condition: currentConditionResult,
                    index: i,
                    times: 0
                });

                if (!currentConditionResult) {
                    currentlySkipping = true;
                }

                continue;
            }

            /////////////////////////////////////////////////////////////////////////////////////////////
            // handle endw directive
            /////////////////////////////////////////////////////////////////////////////////////////////
            if (line[0] == "ENDW") {
                if (lookingForMetka) {
                    if (previousValue == "WHILE" && relativeNamespace != 0) {
                        previousValue = undefined;
                        relativeNamespace--;
                        continue;
                    }

                    if (relativeNamespace == 0 && !previousValue) {
                        directiveStack.pop();
                        continue;
                    }
                    continue;
                }
                
                if (currentlySkipping && skipWhileCounter != 0) {
                    skipWhileCounter--;
                    continue;
                }

                if (currentlySkipping) {
                    currentlySkipping = false;
                    directiveStack.pop();
                    continue;
                }

                let directiveInfo = directiveStack.at(-1);
                let repeatCondition = this.checkCondition(directiveInfo.conditionLine, glStorage, storageStack);
                if (repeatCondition == -1) return -1;

                if (repeatCondition) {
                    if (directiveInfo.times > 100) {
                        handleError(`Вероятно произошло зацикливание. Было выполнено 10000 итераций. Проверьте ${directiveInfo.conditionLine}`);
                        return -1;
                    }
                    directiveStack.at(-1).times = directiveInfo.times+1;
                    i = directiveInfo.index;
                    continue;
                } else {
                    directiveStack.pop();
                    continue;
                }
            }

            /////////////////////////////////////////////////////////////////////////////////////////////
            // handle else directive
            /////////////////////////////////////////////////////////////////////////////////////////////
            if (line[0] == "ELSE" && skipIfCounter == 0) {

                if (lookingForMetka) {
                    if (relativeNamespace != 0) continue;
                    else {
                        relativeNamespace++;
                        previousValue = "ELSE";
                        continue;
                    }
                }

                if (!directiveStack.at(-1) || directiveStack.at(-1).name != "IF") {
                    handleError("Некорректная запись директив IF,ELSE,ENDIF");
                    gotError = true;
                    return -1;
                }

                if (directiveStack.at(-1).condition) {
                    currentlySkipping = true;
                    continue;
                } else {
                    currentlySkipping = false;
                    continue;
                }
            }

            /////////////////////////////////////////////////////////////////////////////////////////////
            // handle endif directive
            /////////////////////////////////////////////////////////////////////////////////////////////
            if (line[0] == "ENDIF") {
                if (lookingForMetka) {
                    if (previousValue == "IF" && relativeNamespace != 0) {
                        previousValue = undefined;
                        relativeNamespace--;
                        continue;
                    }

                    if (relativeNamespace == 0 && (!previousValue || previousValue == "ELSE")) {
                        directiveStack.pop();
                        continue;
                    }
                }

                if (currentlySkipping && skipIfCounter != 0) {
                    skipIfCounter--;
                    continue;
                }

                currentlySkipping = false;
                directiveStack.pop();
                continue;
            }

            /////////////////////////////////////////////////////////////////////////////////////////////
            // handle if directive
            /////////////////////////////////////////////////////////////////////////////////////////////
            if (line[0]?.toUpperCase() == "IF") {
                if (lookingForMetka) {
                    if (!previousValue) {
                        previousValue = "IF";
                        relativeNamespace++;
                        continue;
                    }
                }

                if (currentlySkipping) {
                    skipIfCounter++;
                    continue;
                }

                if (!line[1] || line[2]) {
                    handleError(`Некорректно задано условие для IF`);
                    gotError = true;
                    return -1;
                }

                let currentConditionResult = this.checkCondition(line[1], glStorage, storageStack);
                if (currentConditionResult == -1) {
                    gotError = true;
                    return -1;
                }
                directiveStack.push({
                    name: "IF",
                    condition: currentConditionResult
                });

                if (!currentConditionResult) {
                    currentlySkipping = true;
                }

                continue;
            }

            if (currentlySkipping || lookingForMetka) {
                continue;
            }

            if (directiveHandler.isDirective(line[0])) {
                let result = directiveHandler.handle(line, glStorage, storageStack);
                if (result == -1) {
                    gotError = true;
                    return -1;
                }

                outputString += result + "\n";
            }
            else if (this.definedMacros.some(el => el.name == line[0])) {
                let localResult = this.callMacro(line[0], line.slice(1), glStorage, directiveHandler, [...storageStack]);
                if (localResult == -1) {
                    gotError = true;
                    return -1;
                }

                outputString += localResult;
            } else {
                if (line[0] && line[1]) {
                    let uniqueMacroHash = generateHash();
                    this.addPossibleMacroCall(line[0], line.slice(1), glStorage, directiveHandler, storageStack, uniqueMacroHash);
                    outputString += line.join(" ") + " [MACROHASHCOMING]" + uniqueMacroHash + "\n";
                }
            }
        }

        if (lookingForMetka) {
            handleError(`Макрометка не определена либо находится вне зоны видимости ${lookingForMetka}`);
            return -1;
        }

        if (directiveStack.length != 0) {
            let lastOne = directiveStack.at(-1);
            handleError(`Некорректное использование директивы ${lastOne?.name}`);
            return -1;
        }

        if (gotError) return -1;
        return outputString;
    }

    checkCondition(condition, glStorage, stackStorage) {
        const operations = [">=", "<=", ">", "<", "!=", "="];
        let firstValue = "", secondValue = "";
        let operation = operations.find(el => condition.includes(el));

        [firstValue, secondValue] = condition.split(operation);
        let firstOperValue = firstValue, secondOperValue = secondValue;
        
        if (glStorage.has(firstValue)) {
            firstOperValue = glStorage.get(firstValue);
        }
        if (glStorage.has(secondValue)) {
            secondOperValue = glStorage.get(secondValue);
        }

        for (let i = 0; i < stackStorage.length; i++) {
            let currentStorage = stackStorage[i];

            if (currentStorage.has(firstValue)) {
                firstOperValue = currentStorage.get(firstValue);
            }
            if (currentStorage.has(secondValue)) {
                secondOperValue = currentStorage.get(secondValue);
            }
        }

        if (!isIntegerString(firstOperValue.toString()) || !isIntegerString(secondOperValue.toString())) {
            handleError(`Не все переменные в условии IF были инициализированы или их нельзя преобразовать в целочисленное значение, проверьте ${firstOperValue} ${secondOperValue}`);
            return -1;
        }
        
        let result;
        switch(operation) {
            case ">=":
                result = firstOperValue >= secondOperValue;
                break;
            case "<=":
                result = firstOperValue <= secondOperValue;
                break;
            case ">":
                result = firstOperValue > secondOperValue;
                break;
            case "<":
                result = firstOperValue < secondOperValue;
                break;
            case "!=":
                result = firstOperValue != secondOperValue;
                break;
            case "=":
                result = firstOperValue == secondOperValue;
                break;
            default:
                break;
        }

        return result;
    }

    isParamsValid(givenParams, actualParams, glStorage, storageStack) {
        let positionParams = true;
        let index = 0;
        let gotError = false;
        let localStorage = new Map();
        
        // load params that are set by default from actual params
        let actualKeyParams = Object.keys(actualParams).filter(el => el != "positionParams");
        actualKeyParams.forEach(el => {
            if (actualParams[el]) {
                localStorage.set(el, parseInt(actualParams[el]));
            }
        });
        
        givenParams.forEach(el => {
            if (gotError) return;

            if (el.includes("=")) {
                positionParams = false;
            }

            if (positionParams) {
                if (index+1 > actualParams.positionParams.length) {
                    handleError(`Ожидалось ${actualParams.positionParams.length} позиционных параметров.`);
                    gotError = true;
                }
                if (isIntegerString(el)) {
                    localStorage.set(actualParams.positionParams[index], parseInt(el));
                }
                else {
                    let foundValue = false;
                    if (storageStack.length > 0) {
                        for (let i = storageStack.length - 1; i >= 0; i--) {
                            let currentStorage = storageStack[i];
                            if (currentStorage.has(el)) {
                                localStorage.set(actualParams.positionParams[index], currentStorage.get(el));
                                foundValue = true;
                                break;
                            }
                        }
                    }

                    if (!foundValue) {
                        if (glStorage.has(el)) {
                            localStorage.set(actualParams.positionParams[index], glStorage.get(el));
                        } else {
                            localStorage.set(actualParams.positionParams[index], el);
                        }
                    }
                }             
            }
            else {
                let [paramName, value] = el.split("=");
                if (!Object.hasOwn(actualParams, paramName)) {
                    handleError(`Некорректно заданный параметр ${paramName}`);
                    return -1;
                }

                if (isIntegerString(value)) {
                    localStorage.set(paramName, parseInt(value));
                }
                else {
                    let foundValue = false;
                    if (storageStack.length > 0) {
                        for (let i = storageStack.length - 1; i >= 0; i--) {
                            let currentStorage = storageStack[i];
                            if (currentStorage.has(value)) {
                                localStorage.set(paramName, currentStorage.get(value));
                                foundValue = true;
                                break;
                            }
                        }
                    }

                    if (!foundValue) {
                        if (glStorage.has(value)) {
                            localStorage.set(paramName, glStorage.get(value));
                        }
                        else {
                            handleError(`Переменная ${value} не найдена`);
                            return -1;
                        }
                    }
                }
                // else if (glStorage.has(paramName)) {
                //     localStorage.set(paramName, glStorage.get(paramName));
                // } else {
                //     handleError(`Переменная ${paramName} не найдена`);
                //     return -1;
                // }
            }

            index++;
        });

        if (gotError) return -1;

        // compare amount of keys in localStorage (without positionParams) and amount of keys in actualParams (without positionParams)
        if ((actualParams.positionParams.length + Object.keys(actualParams).length-1) != localStorage.size) {
            handleError(`Не всем параметрам было передано значение. Проверьте ${givenParams}`);
            return -1;
        }

        return localStorage;
    }

    addPossibleMacroCall(macroName, macroParams, glStorage, directiveHandler, storageStack, macroHash) {
        let newStorageStack = storageStack.map(el => structuredClone(el));
        let newValue = new possibleDelayedMacroCall(macroName, macroParams, glStorage, directiveHandler, newStorageStack, macroHash);
        this.possibleDelayedMacroCalls.push(newValue);
    }

    checkPossibleMacroCalls() {
        let foundValue = [];
        let toReturn = [];
        for (let i = 0; i < this.possibleDelayedMacroCalls.length; i++) {
            let currentPossible = this.possibleDelayedMacroCalls[i];
            if (this.definedMacros.some(el => el.name == currentPossible.name)) {
                foundValue.push(currentPossible);
            }
        }

        if (foundValue.length != 0) {
            foundValue.forEach(el => {
                let output = this.callMacro(el.name, el.params, el.glStorage, el.directiveHandler, el.storageStack);
                if (output == -1) {
                    return -1;
                }

                toReturn.push(
                    {
                        hash: el.macroHash, // to change to hash
                        body: output
                    }
                );

            });
            this.possibleDelayedMacroCalls = this.possibleDelayedMacroCalls.filter(el => el.name != foundValue[0].name);

            return toReturn;
        }

        return;
    }
}

class macroDefinition {
    constructor(name, params, body) {
        this.name = name;
        this.params = params;
        this.body = body;
    }
}

class possibleDelayedMacroCall {
    constructor(name, params, glStorage, directiveHandler, storageStack, macroHash) {
        this.name = name;
        this.params = params;
        this.glStorage = glStorage;
        this.directiveHandler = directiveHandler;
        this.storageStack = storageStack;
        this.macroHash = macroHash;
    }
}