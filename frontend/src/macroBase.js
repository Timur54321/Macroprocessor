import { handleError, isIntegerString } from "./utils";

export class MacroBase {

    constructor() {
        // current macro is macro that we're defining at the moment
        this.currentMacroName = "";
        this.currentMacroParams = {};
        this.currentMacroBody = [];
        this.definedMacros = [];
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

    callMacro(macroName, params, glStorage, directiveHandler) {
        // 1. Define macro name
        // 2. check validness of params
        // 3. call directiveHandler for each line 
        let currentMacro = this.definedMacros.find(el => el.name == macroName);
        let locStorage = this.isParamsValid(params, currentMacro.params, glStorage);
        let gotError = false;
        if (locStorage == -1) {
            return -1;
        }
        let outputString = "";
        
        currentMacro.body.forEach(line => {
            if (gotError) return;
            if (directiveHandler.isDirective(line[0])) {
                let result = directiveHandler.handle(line, glStorage, locStorage);
                if (result == -1) {
                    gotError = true;
                    return -1;
                }

                outputString += result + "\n";
            }
            else if (this.definedMacros.some(el => el.name == line[0])) {
                let localResult = this.callMacro(line[0], line.slice(1), glStorage, directiveHandler);
                if (localResult == -1) {
                    gotError = true;
                    return -1;
                }
                outputString += localResult + "\n";
            }
        });

        if (gotError) return 1;

        return outputString;
    }

    isParamsValid(givenParams, actualParams, glStorage) {
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
        
        let result = givenParams.forEach(el => {
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
                else if (glStorage.has(el)) {
                    localStorage.set(actualParams.positionParams[index], glStorage.get(el));
                } else {
                    handleError(`Переменная ${el} не инициализированна`);
                    gotError = true;
                    return;
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
}

class macroDefinition {
    constructor(name, params, body) {
        this.name = name;
        this.params = params;
        this.body = body;
    }
}