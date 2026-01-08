import { handleError, isIntegerString, isValidMetkaName } from "./utils";

export class DirectiveHandler {
    constructor() {
        this.directives = ["VAR", "INC", "ADD"];
    }

    handle(line, globalStorage, storageStack = []) {
        let currentDirective = line[0];

        let result = -1;
        switch(currentDirective) {
            case "VAR":
                result = this.handleVar(line, globalStorage, storageStack[storageStack.length - 1]);
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

        return result;
    }

    handleVar(line, storage, localStorage) {
        let ourStorage = localStorage ? localStorage : storage;
        if (!isValidMetkaName(line[1])) {
            handleError(`Некорректно задано имя метки ${line[1]}`);
            return -1;
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
        console.log(storageStack);
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
}