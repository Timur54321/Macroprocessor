import { printNextMacroDefLine } from "./filesManager";
import { handleError } from "./utils";

export class RowHandler {
    
    handle(line, macroBase, inMacroDef, directiveHandler, globalStorage) {
        if (directiveHandler.isDirective(line[0]) && !inMacroDef) {
            directiveHandler.handle(line, globalStorage);
        }
        
        if (line[1] == "MACRO") {
            if (inMacroDef) {
                handleError("Macro definition found inside macro");
                return -1;
            }

            let macroName = macroBase.isValidMacroName(line[0]);
            if (!macroName) {
                handleError("incorrect macro name");
                return -1;
            }
            else {
                macroName = line[0];
            }

            let params = macroBase.prepareParams(line.slice(2));
            if (params == -1) {
                return -1;
            }

            macroBase.saveLocalNameAndParams(macroName, params);
            printNextMacroDefLine(macroName, line.slice(2).join(" "));
            return "MACRO STARTED";
        }

        if (line[0] == "MEND") {
            if (line[1]) {
                handleError("incorrect write " + line);
                return -1;
            }

            macroBase.addMacro();
            return "MACRO ENDED";
        }

        if (inMacroDef) {
            printNextMacroDefLine("", line.join(" "));
            macroBase.pushLineToMacroDef(line);
            return 1;
        }

        if (line[0].toUpperCase() == "END") {
            let myMacros = macroBase.getMyMacros();
            console.log(globalStorage);
            return 1;
        }

        if (macroBase.hasThisMacro(line[0])) {
            let outputCode = macroBase.callMacro(line[0], line.slice(1), globalStorage, directiveHandler);
            console.log(outputCode);
        }
    }
}