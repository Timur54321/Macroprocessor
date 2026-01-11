export class MacroConfig {
    stepButton = document.querySelector("#step");
    cancelButton = document.querySelector("#cancel");
    defaultExample = 
`
PROG START 1

VAR a 4

what MACRO c

WHILE c<4
AGO %T4
INC c
ENDW

%T4
ADD 123 123

MEND
what 3

realmac MACRO b c=0
ADD 123123 123123
IF b<8
    WHILE c<5
        ADD c 1
        INC c
    ENDW
ELSE
    ADD b c
    INC b
    INC c
    ADD b c
ENDIF
ADD 123123 123123
MEND

realmac 4

mac MACRO b
IF b<2
IF b>=3
ADD 123 123
ELSE
ADD 56 56 b b b b b
ENDIF
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