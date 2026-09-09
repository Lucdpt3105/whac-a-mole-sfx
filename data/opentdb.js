/* Local Vietnamese question dataset adapter for the game's question format. */
(function () {
    const DATASET_URL = "./data/dataset_trac_nghiem.csv";
    const POINTS_BY_DIFFICULTY = { easy: 20, medium: 35, hard: 50 };
    const DIFFICULTY_NAMES = { "Dễ": "easy", "Trung bình": "medium", "Khó": "hard" };

    function shuffle(items) {
        const shuffled = [...items];
        for (let index = shuffled.length - 1; index > 0; index -= 1) {
            const randomIndex = Math.floor(Math.random() * (index + 1));
            [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
        }
        return shuffled;
    }

    function parseCSV(text) {
        const rows = [];
        let row = [];
        let value = "";
        let quoted = false;

        for (let index = 0; index < text.length; index += 1) {
            const character = text[index];
            const nextCharacter = text[index + 1];
            if (character === '"' && quoted && nextCharacter === '"') {
                value += '"';
                index += 1;
            } else if (character === '"') {
                quoted = !quoted;
            } else if (character === "," && !quoted) {
                row.push(value);
                value = "";
            } else if ((character === "\n" || character === "\r") && !quoted) {
                if (character === "\r" && nextCharacter === "\n") index += 1;
                row.push(value);
                if (row.some((cell) => cell.trim())) rows.push(row);
                row = [];
                value = "";
            } else {
                value += character;
            }
        }

        if (value || row.length) {
            row.push(value);
            if (row.some((cell) => cell.trim())) rows.push(row);
        }
        return rows;
    }

    function toGameQuestion(row, questionIndex) {
        const choices = [row[5], row[6], row[7], row[8]]
            .map((text, index) => ({ text: text.trim(), key: String.fromCharCode(65 + index) }))
            .filter((choice) => choice.text);
        const answers = shuffle(choices).map((choice, answerIndex) => ({ ...choice, id: `answer-${answerIndex}` }));
        const correctAnswer = answers.find((answer) => answer.key === row[9].trim().toUpperCase());
        if (!row[4]?.trim() || !correctAnswer || answers.length < 2) return null;

        return {
            id: `local-${questionIndex}`,
            question: row[4].trim(),
            choices: answers.map(({ id, text }) => ({ id, text })),
            correctAnswer: correctAnswer.id,
            difficulty: DIFFICULTY_NAMES[row[3].trim()] || "medium",
            points: POINTS_BY_DIFFICULTY[DIFFICULTY_NAMES[row[3].trim()]] || POINTS_BY_DIFFICULTY.medium,
        };
    }

    async function load() {
        const response = await fetch(DATASET_URL);
        if (!response.ok) throw new Error("Could not load the local question dataset.");
        const rows = parseCSV(await response.text());
        return rows.slice(1).map(toGameQuestion).filter(Boolean);
    }

    window.OpenTdbQuestions = { load };
}());
