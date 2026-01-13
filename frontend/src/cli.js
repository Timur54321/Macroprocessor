import fs from 'fs';

// menu.js
import readline from 'readline';
import { MacroConfig } from './header.js';
import { readUserCode } from './filesManager.js';
import { RowHandler } from './rowHandler.js';
import { MacroBase } from './macroBase.js';
import { DirectiveHandler } from './directiveHandler.js';
import { OutputHandler } from './outputHandler.js';

const config = new MacroConfig();
const rowHandler = new RowHandler();
const macroBase = new MacroBase();
const directiveHandler = new DirectiveHandler();
const outputHandler = new OutputHandler();

// Создаем интерфейс для чтения ввода
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const args = process.argv;
const inputFileIndex = args.indexOf('-input_file');

if (inputFileIndex === -1) {
    console.log('Не указан входной файл');
    process.exit(1);
}

const inputFilePath = args[inputFileIndex + 1];
const code = readInputFile(inputFilePath);

if (code == -1) {
    console.log(`Файл ${inputFilePath} не существует`);
    process.exit(1);
}

function readInputFile(inputFilePath) {
    if (!fs.existsSync(inputFilePath)) {
        return -1;
    }
    return fs.readFileSync(inputFilePath, 'utf8').replace(/\r/g, '');
}

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

const executeLine = function() {
    if (config.counter >= config.currentUserCode.length) {
        console.log('finish');
        return "FINISH";
    }

    let currentLine = config.currentUserCode[config.counter];

    let handleResult = rowHandler.handle(
        currentLine, 
        macroBase, 
        config.insideMacroDefinition, 
        directiveHandler,
        config.globalStorage,
        "cli"
    );
    
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
            
        }

        // outputHandler.loadMacroName(config.counter);
    }

    else if (handleResult && handleResult != "") {
        let codeBreakDown = handleResult.split("\n").filter(el => el != "");
        outputHandler.increaseIndex(codeBreakDown.length);
        outputHandler.addLines(codeBreakDown);
    }
    
    config.counter++;
}

// Функции для пунктов меню
function showProducts() {
    console.log('\n=== Список продуктов ===');
    console.log('1. Яблоки - 100 руб');
    console.log('2. Бананы - 80 руб');
    console.log('3. Апельсины - 120 руб');
    console.log('Нажмите Enter для возврата в меню...');
}

function showCart() {
    executeEverything();
    console.log('\n=== Проход был выполнен ===');
    console.log('Нажмите Enter для возврата в меню...');
}

function showSettings() {
    console.log('\n=== Исходный код ===');
    console.log(code);
    console.log('Нажмите Enter для возврата в меню...');
}

function printAssembly() {
    console.log('\n=== Исходный код ===');
    outputHandler.printToConsole();
    console.log('Нажмите Enter для возврата в меню...');
}

function exitApp() {
    console.log('\nДо свидания!');
    rl.close();
    process.exit(0);
}

// Главное меню
function showMainMenu() {
    config.currentUserCode = readUserCode(code);
    console.log('\n========== ГЛАВНОЕ МЕНЮ ==========');
    console.log('1. Выполнить один шаг');
    console.log('2. Выполнить полный проход');
    console.log('3. Вывод исходного кода');
    console.log('4. Вывод ассемблерного кода');
    console.log('5. Вывод таблицы глобальных переменных');
    console.log('6. Вывод ТМО');
    console.log('7. Загрузить ассемблерный код в файл');
    console.log('8. Начать заново');
    console.log('9. Вывод таблицы имен макросов')
    console.log('0. Выход');
    console.log('==================================');
    
    rl.question('Выберите пункт меню (0-9): ', (answer) => {
        handleMenuChoice(answer);
    });
}

// Обработчик выбора
function handleMenuChoice(choice) {
    switch(choice) {
        case '1':
            showProducts();
            waitForEnter(showMainMenu);
            break;
        case '2':
            showCart();
            waitForEnter(showMainMenu);
            break;
        case '3':
            showSettings();
            waitForEnter(showMainMenu);
            break;
        case '4':
            printAssembly();
            waitForEnter(showMainMenu);
            break;
        case '0':
            exitApp();
            break;
        default:
            console.log('\n❌ Неверный выбор. Пожалуйста, введите число от 0 до 3');
            showMainMenu();
    }
}

// Функция ожидания нажатия Enter
function waitForEnter(callback) {
    rl.question('', () => {
        callback();
    });
}

// Запуск приложения
console.log('Добро пожаловать в наше приложение!');
showMainMenu();