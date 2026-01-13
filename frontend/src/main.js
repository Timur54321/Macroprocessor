import './style.css';
import './app.css';
import { MacroConfig } from './header';
import { MacroBase } from './macroBase';
import { clearTables, loadDefaultExample, readModifiedCode, readTextFile, readUserCode } from './filesManager';
import { RowHandler } from './rowHandler';
import { DirectiveHandler } from './directiveHandler';
import { OutputHandler } from './outputHandler';

const config = new MacroConfig();
const macroBase = new MacroBase();
const rowHandler = new RowHandler();
const directiveHandler = new DirectiveHandler();
const outputHandler = new OutputHandler();

loadDefaultExample(config.defaultExample);
document.querySelector("#file_input_button").addEventListener("click", function() {
    document.querySelector("#file_input").click();
});

const resetValues = function() {
    config.reset();
    macroBase.reset();
    outputHandler.reset();
    clearTables();
}

document.querySelector("#file_input").addEventListener("change", async function(event) {
    let result = await readTextFile(event);
    loadDefaultExample(result);
    resetValues();
});

document.querySelector("#cancel").addEventListener("click", resetValues);

const executeEverything = function() {
    let codeLimit = 10000;
    let currentLine = 0;
    let result = executeLine();
    while (result != "FINISH" && result != -1) {
        result = executeLine();
        if (result == -1) {
            break;
        }
        currentLine++;
        if (currentLine > codeLimit) {
            break;
        }
    }
}
document.querySelector("#fullCycle").addEventListener("click", executeEverything);

const executeLine = function() {
    if (config.counter == 0) {
        let result = readModifiedCode();
        config.currentUserCode = readUserCode(result);
    }

    if (config.counter >= config.currentUserCode.length) {
        return "FINISH";
    }

    let currentLine = config.currentUserCode[config.counter];
    
    
    let handleResult = rowHandler.handle(
        currentLine, 
        macroBase, 
        config.insideMacroDefinition, 
        directiveHandler,
        config.globalStorage
    );

    outputHandler.printVariablesTable(config.globalStorage);
    outputHandler.printCurrentLine(currentLine);
    if (handleResult == -1) {
        console.log("Gone wrong");
        return -1;
    }

    else if (handleResult == "MACRO STARTED") {
        config.insideMacroDefinition = true;
        outputHandler.loadBeginIndex(config.counter, currentLine[0]);
    }

    else if (handleResult?.message == "MACRO ENDED") {
        config.insideMacroDefinition = false;

        if (handleResult.output != -1) {
            handleResult.output.forEach(el => {
                let codeBreakDown = el.body.split("\n").filter(el => el != "");
                outputHandler.addLinesAtHash(codeBreakDown, el.hash);
            });
            // let codeBreakDown = handleResult.output.body.split("\n").filter(el => el != "");
            // outputHandler.increaseIndex(codeBreakDown.length);
            // outputHandler.addLinesAtIndex(codeBreakDown, handleResult.output.index);
            outputHandler.print();
        }

        outputHandler.loadMacroName(config.counter);
    }

    else if (handleResult && handleResult != "") {
        let codeBreakDown = handleResult.split("\n").filter(el => el != "");
        outputHandler.increaseIndex(codeBreakDown.length);
        outputHandler.addLines(codeBreakDown);
        outputHandler.print();
    }
    
    config.counter++;
}

document.querySelector("#step").addEventListener("click", executeLine);
document.querySelector("#cancel").addEventListener("click", () => {config.currentUserCode = readUserCode(document.querySelector("#user_code").value)});