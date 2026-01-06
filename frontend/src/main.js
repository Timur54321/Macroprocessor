import './style.css';
import './app.css';
import { MacroConfig } from './header';
import { MacroBase } from './macroBase';
import { loadDefaultExample, readUserCode } from './filesManager';
import { RowHandler } from './rowHandler';
import { DirectiveHandler } from './directiveHandler';

const config = new MacroConfig();
const macroBase = new MacroBase();
const rowHandler = new RowHandler();
const directiveHandler = new DirectiveHandler();

loadDefaultExample(config.defaultExample);
config.currentUserCode = readUserCode(config.defaultExample);

const executeLine = function() {
    let currentLine = config.currentUserCode[config.counter];
    console.log("about to handle: ", currentLine);
    let handleResult = rowHandler.handle(
        currentLine, 
        macroBase, 
        config.insideMacroDefinition, 
        directiveHandler,
        config.globalStorage
    );
    
    if (handleResult == -1) {
        console.log("Gone wrong");
    }

    if (handleResult == "MACRO STARTED") {
        config.insideMacroDefinition = true;
    }

    if (handleResult == "MACRO ENDED") {
        config.insideMacroDefinition = false;
    }

    config.counter++;
}

config.stepButton.addEventListener("click", executeLine);
config.cancelButton.addEventListener("click", () => {config.currentUserCode = readUserCode(document.querySelector("#user_code").value)});