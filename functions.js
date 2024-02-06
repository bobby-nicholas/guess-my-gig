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

const skip = {
	name: 'skip',
	description: 
		`Invoked when a character doesn't want to add a response to the latest message in the group chat`,
}

const generateCharacter = {
	name: 'generate_character',
	description: 
		`Sets the name and character description for the generated agent`,
	parameters: {
		type: 'object',
		properties: {
			name: {
				type: 'string',
				description: `The name of the character`
			},
			full_description: {
				type: 'string',
				description: `The full character description`
			},
		},
		required: ['name', 'full_description'],
	}
};

export default {
	panelist: [askQuestion, skip],
	guest: [answerQuestion, skip],
	moderator: [skip],
	generator: [generateCharacter],
};