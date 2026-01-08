import { handleError, isIntegerString } from "./utils";

export class MacroBase {

    constructor() {
        // current macro is macro that we're defining at the moment
        this.currentMacroName = "";
        this.currentMacroParams = {};
        this.currentMacroBody = [];
        this.definedMacros = [];
        this.possibleDelayedMacroCalls = [];
    }
    
    isValidMacroName(name) {
        // TODO: CHECK IF name ALREADY DECLARED
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

    callMacro(macroName, params, glStorage, directiveHandler, storageStack = []) {
        
        let currentMacro = this.definedMacros.find(el => el.name == macroName);
        let locStorage = this.isParamsValid(params, currentMacro.params, glStorage, storageStack);
        storageStack.push(locStorage);
        let gotError = false;
        let directiveStack = [];

        let currentlySkipping = false;
        let skippingIfBlock = false,
            skippingElseBlock = false;

        if (locStorage == -1) {
            return -1;
        }
        let outputString = "";
        
        currentMacro.body.forEach(line => {
            if (gotError) return;

            if (line[0] == "ELSE") {
                if (!directiveStack.at(-1) || directiveStack.at(-1).name != "IF") {
                    handleError("Некорректная запись директив IF,ELSE,ENDIF");
                    gotError = true;
                    return -1;
                }

                if (directiveStack.at(-1).condition) {
                    currentlySkipping = true;
                    return;
                } else {
                    currentlySkipping = false;
                    return;
                }
            }

            if (line[0] == "ENDIF") {
                currentlySkipping = false;
                directiveStack.pop();
                return;
            }

            if (currentlySkipping) {
                return;
            }

            if (directiveStack.at(-1)) {
                let currentDirective = directiveStack.at(-1);

                if (currentDirective.name == "IF") {
                    if (currentDirective.condition) {

                    }
                }
            }

            if (line[0].toUpperCase() == "IF") {

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

                console.log(directiveStack);

                if (!currentConditionResult) {
                    currentlySkipping = true;
                }

                return;
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
                outputString += localResult + "\n";
            } else {
                if (line[0] && line[1]) {
                    this.addPossibleMacroCall(line[0], line.slice(1), glStorage, directiveHandler, storageStack)
                }
            }
        });

        if (gotError) return 1;

        return outputString;
    }

    checkCondition(condition, glStorage, stackStorage) {
        const operations = [">=", "<=", ">", "<", "!=", "="];
        let firstValue = "", secondValue = "";
        let operation = operations.find(el => condition.includes(el));

        [firstValue, secondValue] = condition.split(operation);
        
        if (glStorage.has(firstValue)) {
            firstValue = glStorage.get(firstValue);
        }
        if (glStorage.has(secondValue)) {
            secondValue = glStorage.get(secondValue);
        }

        for (let i = 0; i < stackStorage.length; i++) {
            let currentStorage = stackStorage[i];

            if (currentStorage.has(firstValue)) {
                firstValue = currentStorage.get(firstValue);
            }
            if (currentStorage.has(secondValue)) {
                secondValue = currentStorage.get(secondValue);
            }
        }

        if (!isIntegerString(firstValue.toString()) || !isIntegerString(secondValue.toString())) {
            console.log(glStorage);
            handleError(`Не все переменные в условии IF были инициализированы, проверьте ${firstValue} ${secondValue}`);
            return -1;
        }

        firstValue = parseInt(firstValue);
        secondValue = parseInt(secondValue);
        
        let result;
        switch(operation) {
            case ">=":
                result = firstValue >= secondValue;
                break;
            case "<=":
                result = firstValue <= secondValue;
                break;
            case ">":
                result = firstValue > secondValue;
                break;
            case "<":
                result = firstValue < secondValue;
                break;
            case "!=":
                result = firstValue == secondValue;
                break;
            case "=":
                result = firstValue != secondValue;
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
                localStorage.set(el, actualParams[el]);
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
                            handleError(`Переменная ${el} не инициализированна`);
                            gotError = true;
                            return;
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
                else if (glStorage.has(paramName)) {
                    localStorage.set(paramName, glStorage.get(paramName));
                } else {
                    handleError(`Переменная ${paramName} не найдена`);
                    return -1;
                }
            }

            index++;
        });

        if (gotError) return -1;

        // compare amount of keys in localStorage (without positionParams) and amount of keys in actualParams (without positionParams)
        if ((actualParams.positionParams.length + Object.keys(actualParams).length-1) != localStorage.size) {
            handleError("Не всем параметрам было передано значение");
            return -1;
        }

        return localStorage;
    }

    addPossibleMacroCall(macroName, macroParams, glStorage, directiveHandler, storageStack) {
        let newValue = new possibleDelayedMacroCall(macroName, macroParams, glStorage, directiveHandler, storageStack);
        this.possibleDelayedMacroCalls.push(newValue);
    }

    checkPossibleMacroCalls() {
        let foundValue = undefined;
        for (let i = 0; i < this.possibleDelayedMacroCalls.length; i++) {
            let currentPossible = this.possibleDelayedMacroCalls[i];
            if (this.definedMacros.some(el => el.name == currentPossible.name)) {
                foundValue = currentPossible;
                break;
            }
        }

        if (foundValue) {
            console.log(foundValue);
            this.possibleDelayedMacroCalls = this.possibleDelayedMacroCalls.filter(el => el.name != foundValue.name);
            let output = this.callMacro(foundValue.name, foundValue.params, foundValue.glStorage, foundValue.directiveHandler, foundValue.storageStack);
            if (output == -1) {
                return -1;
            }
            return output;
        }

        return -1;
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
    constructor(name, params, glStorage, directiveHandler, storageStack) {
        this.name = name;
        this.params = params;
        this.glStorage = glStorage;
        this.directiveHandler = directiveHandler;
        this.storageStack = storageStack;
    }
}