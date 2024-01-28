const askQuestion = {
	name: 'ask_question',
	description: `Registers the yes/no question to be asked of the contestant`,
	parameters: {
		type: 'object',
		properties: {
			question: {
				type: 'string',
				description:
				`The exact yes/no question to be asked of the contestant, absent of any  
				exposition that might have been added by the panelist in their response`,
			},
		},
		required: ['question'],
	}
};

const answerQuestion = {
	name: 'answer_question',
	description: 
		`Registers if the answer to a given yes/no question for the contestant is true or false, 
		and whether the answer correctly guesses the contestant's job or profession`,
	parameters: {
		type: 'object',
		properties: {
			answerIsYes: {
				type: 'boolean',
				description: `This will be true if the answer to the question is 'Yes' and false if the answer is 'No'`
			},
			correctGuess: {
				type: 'boolean',
				description: `This will be true if the question correctly guesses the contestant's job or profession and false otherwise`
			},
		},
		required: ['answerIsYes', 'correctGuess'],
	}
};

const characterName = {
	name: 'character_name',
	description: 
		`Sets the name of the created character`,
	parameters: {
		type: 'object',
		properties: {
			name: {
				type: 'string',
				description: `The name of the character, extracted from the created character description`
			}
		},
		required: ['name'],
	}
};

export default {
	panelist: [askQuestion],
	contestant: [answerQuestion],
	moderator: [],
	generator: [characterName],
};