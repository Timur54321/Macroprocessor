import { printNextMacroDefLine } from "./filesManager.js";
import { generateHash, handleError, isValidRealMetkaName } from "./utils.js";

export class RowHandler {
    
    handle(line, macroBase, inMacroDef, directiveHandler, globalStorage, mode = "") {
        if (directiveHandler.isDirective(line[0]) && !inMacroDef) {
            return directiveHandler.handle(line, globalStorage);
        }

        if (isValidRealMetkaName(line[0]) && !inMacroDef) {
            if (!directiveHandler.isAssemblyDirective(line[1])) {
                handleError(`Метка должна находиться перед директивой ассемблера. Проверьте ${line.join(" ")}`);
                return -1;
            }
            
            return directiveHandler.handle(line, globalStorage);
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
            if (mode != "cli")
            {
                printNextMacroDefLine(macroName, line.slice(2).join(" "));
            }
            return "MACRO STARTED";
        }

        if (line[0] == "MEND") {
            if (line[1]) {
                handleError("incorrect write " + line);
                return -1;
            }

            macroBase.addMacro();
            let output = macroBase.checkPossibleMacroCalls();
            if (output == -1) {
                return -1;
            }

            if (!output) {
                return {
                    message: "MACRO ENDED",
                    output: -1
                }
            }

            return {
                message: "MACRO ENDED",
                output: output
            };
        }

        if (inMacroDef) {
            if (mode != "cli") {
                printNextMacroDefLine("", line.join(" "));
            }
            macroBase.pushLineToMacroDef(line);
            return;
        }

        if (line[0].toUpperCase() == "END") {
            let myMacros = macroBase.getMyMacros();
            return "";
        }

        if (macroBase.hasThisMacro(line[0])) {
            let superStorage = [];
            
            let outputCode = macroBase.callMacro(line[0], line.slice(1), globalStorage, directiveHandler, superStorage);
            return outputCode;
        }

        if (line[0]) {
            let uniqueMacroHash = generateHash();
            macroBase.addPossibleMacroCall(line[0], line.slice(1), globalStorage, directiveHandler, [], uniqueMacroHash);
            return line.join(" ") + " [MACROHASHCOMING]" + uniqueMacroHash;
        }

        return line.join(" ");
    }
}