export class MacroConfig {
    defaultExample = 
`mac MACRO
VAR a 3
MEND

mac

ADD a a
`;

    constructor() {
        this.currentUserCode = [];              // formatted current user code
        this.counter = 0;                       // index of line that we're stopped at
        this.insideMacroDefinition = false;     // true when defining macro
        this.globalStorage = new Map();
    }

    reset() {
        this.currentUserCode = [];
        this.counter = 0;
        this.insideMacroDefinition = false;
        this.globalStorage = new Map();
    }
}