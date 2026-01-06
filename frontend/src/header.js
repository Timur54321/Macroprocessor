export class MacroConfig {
    stepButton = document.querySelector("#step");
    cancelButton = document.querySelector("#cancel");
    defaultExample = 
`
PROG START 1

VAR a 0
INC a
END

ADD U I O P I O a  O ERWOI  IEJ

mac MACRO a b= c=3
INC a
INC b
ADD a b
MEND

mac2 MACRO e h
INC e
INC h
ADD e h
mac 2 b=4 c=5
MEND

mac2 4 5

END`;

    constructor() {
        this.currentUserCode = [];              // formatted current user code
        this.counter = 0;                       // index of line that we're stopped at
        this.insideMacroDefinition = false;     // true when defining macro
        this.globalStorage = new Map();
    }
}