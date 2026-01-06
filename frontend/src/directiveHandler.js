import { handleError, isIntegerString, isValidMetkaName } from "./utils";

export class DirectiveHandler {
    constructor() {
        this.directives = ["VAR", "INC", "ADD"];
    }

    handle(line, globalStorage, locStorage = new Map()) {
        let currentDirective = line[0];

        let result = -1;
        switch(currentDirective) {
            case "VAR":
                result = this.handleVar(line, globalStorage);
                break;
            case "INC":
                result = this.handleInc(line, globalStorage, locStorage);
                break;
            case "ADD":
                result = this.handleAdd(line, globalStorage, locStorage);
                break;
            default:
                break;
        }

        if (result == -1) {
            return -1;
        }

        return result;
    }

    handleVar(line, storage) {
        if (!isValidMetkaName(line[1])) {
            handleError(`Некорректно задано имя метки ${line[1]}`);
            return -1;
        }

        if (!isIntegerString(line[2])) {
            handleError(`Некорректно задано значение переменной ${line[2]}`);
            return -1;
        }

        storage.set(line[1], parseInt(line[2]));
        return "";
    }

    handleInc(line, glStorage, locStorage) {
        
        if (!isValidMetkaName(line[1])) {
            handleError(`Некорректно задано имя переменной ${line[1]}`);
            return -1;
        }

        if (locStorage.has(line[1])) {
            let newValue = locStorage.get(line[1]) + 1;
            locStorage.set(line[1], newValue);
        }
        else if(glStorage.has(line[1])) {
            let currentValue = glStorage.get(line[1]);
            glStorage.set(line[1], currentValue+1);
        }
        else {
            handleError(`Переменная ${line[1]} не была объявлена в текущей области видимости`);
            return -1;
        }

        return "";
    }

    handleAdd(line, glStorage, locStorage) {
        let operands = line.slice(1);
        let resultString = "ADD ";
        operands.forEach(el => {
            if (locStorage.has(el)) {
                resultString += locStorage.get(el) + " ";
            }
            else if (glStorage.has(el)) {
                resultString += glStorage.get(el) + " ";
            }
            else {
                resultString += el + " ";
            }
        });

        return resultString;
    }

    isDirective(name) {
        return this.directives.includes(name);
    }
}