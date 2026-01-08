export class MacroConfig {
    stepButton = document.querySelector("#step");
    cancelButton = document.querySelector("#cancel");
    defaultExample = 
`
PROG START 1

VAR a 4

mac MACRO b
IF b<2
ADD 4 5
ELSE
ADD 8 9
ENDIF
MEND

mac 1

END`;

    constructor() {
        this.currentUserCode = [];              // formatted current user code
        this.counter = 0;                       // index of line that we're stopped at
        this.insideMacroDefinition = false;     // true when defining macro
        this.globalStorage = new Map();
    }
}