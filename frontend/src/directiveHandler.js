import { handleError, isIntegerString, isValidMetkaName, isValidRealMetkaName } from "./utils.js";

export class DirectiveHandler {
    constructor() {
        this.directives = ["VAR", "INC", "ADD"];
        this.assemblyDirectives = ["ADD", "JMP"];
    }

    handle(line, globalStorage, storageStack = [], macrosName = undefined, index = undefined) {
        let metkaName = "";
        let currentDirective = line[0];
        if (this.isDirective(line[1])) {
            currentDirective = line[1];
            if (macrosName) {
                metkaName = `${line[0].substring(0, line[0].length - 1)}_${macrosName}_${index}: `;
            }
            else {
                metkaName = line[0] + " ";
            }
            line = line.slice(1);
        }


        let result = -1;
        switch(currentDirective) {
            case "VAR":
                result = this.handleVar(line, globalStorage, storageStack);
                break;
            case "INC":
                result = this.handleInc(line, globalStorage, storageStack);
                break;
            case "ADD":
                result = this.handleAdd(line, globalStorage, storageStack);
                break;
            default:
                break;
        }

        if (result == -1) {
            return -1;
        }
        
        return metkaName + result;
    }

    handleVar(line, storage, storageStack) {
        let possibleValue;
        if (!line[2]) {
            ourStorage.set(line[1], line[1]);
            return "";
        }

        if (!isValidMetkaName(line[1])) {
            handleError(`Некорректно задано имя переменной ${line[1]}`);
            return -1;
        }

        if (storageStack.length > 0) {
            for (let i = 0; i < storageStack.length; i++) {
                let currentStorage = storageStack[i];
                if (currentStorage.has(line[1])) {
                    handleError(`Невозможно инициализировать переменную ${line[1]} так как она уже объявлена в текущей области видимости`);
                    return -1;
                }

                if (currentStorage.has(line[2])) {
                    possibleValue = currentStorage.get(line[2]);
                }
            }
        }

        if (storage.has(line[1])) {
            handleError(`Невозможно инициализировать переменную ${line[1]} так как она уже объявлена в текущей области видимости`);
            return -1;
        }

        if (storage.has(line[2])) {
            possibleValue = storage.get(line[2]);
        }

        let ourStorage = storage;

        if (possibleValue != undefined) {
            ourStorage.set(line[1], possibleValue);
            return "";
        }

        if (!isIntegerString(line[2])) {
            handleError(`Некорректно задано значение переменной ${line[2]}`);
            return -1;
        }

        ourStorage.set(line[1], parseInt(line[2]));
        return "";
    }

    handleInc(line, glStorage, storageStack) {
        let valueWasSetForLocalStorage = false;

        if (!isValidMetkaName(line[1])) {
            handleError(`Некорректно задано имя переменной ${line[1]}`);
            return -1;
        }

        if (storageStack.length > 0) {
            for (let i = storageStack.length-1; i >= 0; i--) {
                let currentStorage = storageStack[i];
                if (currentStorage.has(line[1])) {
                    let newValue = currentStorage.get(line[1]) + 1;
                    storageStack[i].set(line[1], newValue);
                    valueWasSetForLocalStorage = true;
                    break;
                }
            }
        }

        if (!valueWasSetForLocalStorage)
        {
            if(glStorage.has(line[1])) {
                let currentValue = glStorage.get(line[1]);
                glStorage.set(line[1], currentValue+1);
            }
            else {
                handleError(`Переменная ${line[1]} не была объявлена в текущей области видимости`);
                return -1;
            }
        }

        return "";
    }

    handleAdd(line, glStorage, storageStack) {
        let operands = line.slice(1);
        let valueWasSetForLocalStorage = false;
        let resultString = "ADD ";
        operands.forEach(el => {
            valueWasSetForLocalStorage = false;
            if (storageStack.length > 0) {

                for (let i = storageStack.length - 1; i >= 0; i--) {
                    let currentStorage = storageStack[i];
                    
                    if (currentStorage.has(el)) {
                        resultString += currentStorage.get(el) + " ";
                        valueWasSetForLocalStorage = true;
                        break;
                    }
                }
            }
            
            if (!valueWasSetForLocalStorage) {
                if (glStorage.has(el)) {
                    resultString += glStorage.get(el) + " ";
                }
                else {
                    resultString += el + " ";
                }
            }
        });

        return resultString;
    }

    isDirective(name) {
        return this.directives.includes(name);
    }

    isAssemblyDirective(name) {
        return this.assemblyDirectives.includes(name);
    }
}