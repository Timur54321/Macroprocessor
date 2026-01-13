export function handleError(errMessage) {
    console.log("error");
    try {
        document.querySelector("#errors_block").value = errMessage;
    } catch(err) {
        console.log(errMessage);
    }
}

export function isValidMetkaName(name) {
    const identifierRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/; 

    return identifierRegex.test(name);
}

export function isValidRealMetkaName(name) {
    return name[name.length - 1] == ":" && isValidMetkaName(name.substring(0, name.length-1));
}

export function isValidMacroMetka(name) {
    return name[0] == "%" && isValidMetkaName(name.substring(1));        
}

export function isIntegerString(str) {
    if (typeof str !== 'string') {
        return false;
    }
    
    // Проверяем, что строка не пустая и не состоит только из пробелов
    if (str.trim() === '') {
        return false;
    }
    
    const num = parseInt(str, 10);
    return !isNaN(num) && num.toString() === str.trim();
}

export function generateHash() {
    return Math.random().toString(36).substring(2, 10);
}