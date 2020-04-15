/////////////////////////////////////////////////////////////////////////////////////////////////////
// Лабораторная работа 2 по дисциплине ЛОИС
// Выполнена студентом группы 721701 БГУИР Семенихин Никита Сергеевич
// Файл содержит функции парсинга строки для проверки синтаксиса и проверки формул на равносильность
// 07.04.2020

var _formula1;
var _formula2;
var _truthTable1;
var _truthTable2;
var _atoms1;
var _atoms2;

function check() {
    _formula1 = document.getElementById('formulaInput1').value;
    _formula2 = document.getElementById('formulaInput2').value;
    let tt1Element = document.getElementById('truthTable1');
    let tt2Element = document.getElementById('truthTable2');
    let messageElement = document.getElementById('messageText');

    let message = (isSymbolsValid(_formula1) && isSymbolsValid(_formula2)) ? ((isSyntaxValid(_formula1) && isSyntaxValid(_formula2)) ? '' : "Неверный синтаксис") : "Недопустимые символы";
    messageElement.innerHTML = message;
    if (message) {
        tt1Element.innerHTML = '';
        tt2Element.innerHTML = '';

        return;
    }
    
    messageElement.innerHTML = checkEquivalence(_formula1, _formula2) ? "Формулы равносильны" : "Формулы не равносильны";

    tt1Element.innerHTML = _formula1.italics() + '<br>' + drawTruthTable(_truthTable1, _atoms1);
    tt2Element.innerHTML = _formula2.italics() + '<br>' + drawTruthTable(_truthTable2, _atoms2);
}

function checkEquivalence(formula1, formula2) {    
    _atoms1 = getAtoms(formula1).sort();
    _atoms2 = getAtoms(formula2).sort();

    let unitedAtoms = uniteAtoms(_atoms1, _atoms2);
    _atoms1 = _atoms2 = unitedAtoms;

    formula1 = supplementFormula(formula1, _atoms1, unitedAtoms);
    formula2 = supplementFormula(formula2, _atoms2, unitedAtoms);

    _truthTable1 = buildTruthTable(formula1, _atoms1);
    _truthTable2 = buildTruthTable(formula2, _atoms2);
    
    return areTablesEqual(_truthTable1, _truthTable2);
}

function uniteAtoms(atoms1, atoms2) {
    return [...new Set(atoms1.concat(atoms2))].sort();
}

function supplementFormula(formula, atoms, unitedAtoms) {
    unitedAtoms.forEach(atom => {
        if (atoms.indexOf(atom) === -1) {
            formula = '((' + atom + '|(!' + atom + '))&' + formula + ')';
        }
    });

    return formula;
}

function drawTruthTable(truthTable, atoms) {
    let s = '';
    s += atoms.join(' ') + ' | <i>f</i><br>';

    let rows = Array.from(truthTable.keys());

    rows.forEach(row => s += row.join(' ') + ' | ' + truthTable.get(row) + '<br>');

    return s;
}

function buildTruthTable(formula, atoms) {
    let truthTable = new Map();

    for (let setNumber = 0; setNumber < Math.pow(2, atoms.length); setNumber++) {
        let setNumberBinary = Array.from(setNumber.toString(2));
        if (setNumberBinary.length !== atoms.length) {
            let fill = Array.from('0'.repeat(atoms.length - setNumberBinary.length));
            setNumberBinary.forEach(digit => fill.push(digit));

            setNumberBinary = fill;
        }

        let formulaWithValues = emplaceValues(setNumberBinary, atoms, formula);
        let functionResult = getFunctionResult(formulaWithValues);

        truthTable.set(setNumberBinary, functionResult);
    }

    return truthTable;
}

function getAtoms(formula) {
    return [...new Set(formula.split(/[^A-Z]/).filter(atom => atom !== ''))];
}

function emplaceValues(values, atoms, formula) {
    for (atomIndex = 0; atomIndex < atoms.length; atomIndex++) {
        formula = formula.replace(new RegExp(atoms[atomIndex], 'g'), values[atomIndex]);
    }

    return formula;
}

function getFunctionResult(formulaWithValues) {
    while (formulaWithValues.match(/[!|&~]|->/)) {
        formulaWithValues = formulaWithValues.replace(/\(?!0\)?/g, '1');
        formulaWithValues = formulaWithValues.replace(/\(?!1\)?/g, '0');

        formulaWithValues = formulaWithValues.replace(/\(0\|0\)/g, '0');
        formulaWithValues = formulaWithValues.replace(/\(1\|1\)|\(0\|1\)|\(1\|0\)/g, '1');
        
        formulaWithValues = formulaWithValues.replace(/\(1&1\)/g, '1');
        formulaWithValues = formulaWithValues.replace(/\(1&0\)|\(0&1\)|\(0&0\)/g, '0');

        formulaWithValues = formulaWithValues.replace(/\(1->0\)/g, '0');
        formulaWithValues = formulaWithValues.replace(/\(0->0\)|\(0->1\)|\(1->1\)/g, '1');
        
        formulaWithValues = formulaWithValues.replace(/\(0~0\)|\(1~1\)/g, '1');
        formulaWithValues = formulaWithValues.replace(/\(0~1\)|\(1~0\)/g, '0');
    }

    return formulaWithValues;
}

function areTablesEqual(table1, table2) {
    let values1 = Array.from(table1.values());
    let values2 = Array.from(table2.values());

    return (values1.length === values2.length) && (values1.every((value, index) => value === values2[index]));
}

function isSymbolsValid(formula) {
    return formula.match(/^([A-Z()|&!~10]|->)*$/g);
}

function isSyntaxValid(formula) {
    return formula.match(/^[A-Z01]$/) ||
        (!formula.match(/\)\(/) &&
        !formula.match(/[A-Z01]([^|&~]|(?!->))[A-Z01]/) &&
        !formula.match(/[^(]![A-Z01]/) && !formula.match(/![A-Z01][^)]/) &&
        !formula.match(/\([A-Z01]\)/) &&
        isBracesPaired(formula) &&
        isBinaryOperationsBraced(formula));
}

function isBinaryOperationsBraced(formula) {
    let formulaCopy = formula;

    while (formulaCopy.match(/([|&~]|->)/g) || !formulaCopy.match(/^[A()]+$/g)) {
        let prevCopy = formulaCopy;

        formulaCopy = formulaCopy.replace(/\(![A-Z01]\)/g, 'A');
        formulaCopy = formulaCopy.replace(/\([A-Z01]([|&~]|->)[A-Z01]\)/g, 'A');

        if (formulaCopy === prevCopy) {
            return false;
        }
    }

    return formulaCopy === 'A';
}

function isBracesPaired(formula) {
    let countOfOpenBraces = formula.split('(').length - 1;
    let countOfCloseBraces = formula.split(')').length - 1;
    
    return countOfOpenBraces == countOfCloseBraces;
}

///////////

class Question {
    constructor(formula1, formula2, answer) {
        this.formula1 = formula1;
        this.formula2 = formula2;
        this.answer = answer;
    }
}

var atomsForTest1 = [ 'U', 'R', 'K', 'G' ];
var atomsForTest2 = [ 'G', 'U', 'D', 'R' ];

var currentQuestion;
var countOfQuestions = 5;
var currentQuestionIndex = 0;
var correctAnswers = 0;
var testSection;
var resultSection = document.getElementById('resultSection');

function startTest() {
    testSection = document.getElementById('testSection');
    let startButton = document.getElementById('startButton');

    testSection.style.display = 'flex';
    startButton.style.display = 'none';

    currentQuestion = generateQuestion();

    renderQuestion();
    refreshAnswers();
}

function next() {
    let currentAnswerElement = document.getElementById(currentQuestion.answer.toString());
    let isCorrectAnswered = currentAnswerElement.checked;

    if (isCorrectAnswered) {
        correctAnswers++;
    }

    ++currentQuestionIndex;
    if (currentQuestionIndex === countOfQuestions) {
        document.getElementById('score').innerHTML = 'Оценка: ' + correctAnswers * 2;

        testSection.style.display = 'none';
        resultSection.style.display = 'flex';
        return;
    }

    currentQuestion = generateQuestion();

    renderQuestion();
    refreshAnswers();
}

function generateQuestion() {
    let countOfArgs1 = getRandomInt(2);
    let countOfGroups1 = getRandomInt(2);
    let countOfArgs2 = getRandomInt(2);
    let countOfGroups2 = getRandomInt(2);

    let formula1 = generateFormula(countOfGroups1, countOfArgs1);
    let formula2 = generateFormula(countOfGroups2, countOfArgs2);
    let answer = checkEquivalence(formula1, formula2);

    return new Question(formula1, formula2, answer);
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max)) + 1;
}

function generateFormula(countOfGroups, countOfArgs) {
    let formula = '';
    let atoms = (Math.random() >= 0.5) ? atomsForTest1 : atomsForTest2;

    for (i = 0; i < countOfGroups; i++) {
        let countOfArgsInParticualarGroup = countOfArgs - getRandomInt(countOfArgs) + 2;
        let group = '';

        if (countOfGroups !== 1 && i < countOfGroups - 1) {
            formula += '(';
        }

        let willRepeat = false;

        for (j = 0; j < countOfArgsInParticualarGroup; j++) {
            let currAtom = atoms[j];

            if (willRepeat) {
                currAtom = atoms[j - 1];
            }
            if (countOfArgsInParticualarGroup !== 1 && j < countOfArgsInParticualarGroup - 1) {
                group += '(';
            }

            let isNegative = (Math.random() >= 0.5);
            willRepeat = isNegative;
            group += (isNegative ? '(!' : '') + currAtom + (isNegative ? ')' : '');
            if (j < countOfArgsInParticualarGroup - 1) {
                let random  = Math.random();
                group += ((random >= 0.3) ? '|' : (random >= 0.2 ? '&' : (random >= 0.1 ? '~' : '->')));
            }
        }

        for (j = 0; j < countOfArgsInParticualarGroup - 1; j++) {
            if (countOfArgsInParticualarGroup !== 1) {
                group += ')';
            }
        }

        formula += group;

        if (i < countOfGroups - 1) {
            let random  = Math.random();
            formula += ((random >= 0.3) ? '|' : (random >= 0.2 ? '&' : (random >= 0.1 ? '~' : '->')));
        }
    }

    for (j = 0; j < countOfGroups - 1; j++) {
        if (countOfGroups !== 1) {
            formula += ')';
        }
    }

    return formula;
}

function renderQuestion() {
    document.getElementById('formula').innerHTML = currentQuestion.formula1 + '<br>' + currentQuestion.formula2;
}

function refreshAnswers() {
    document.getElementById(currentQuestion.answer.toString()).checked = false;
    document.getElementById((!currentQuestion.answer).toString()).checked = false;
}