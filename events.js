import EventEmitter from 'events';

const events = new EventEmitter();

export default {
	onChatUpdate(handler) { events.on('chat-updated', handler); },
	onSignIn(handler) { events.on('signed-in', handler); },
	onNextGuest(handler) { events.on('next-guest', handler); },
	onDismissGuest(handler) { events.on('dismiss-guest', handler); },
	onAskQuestion(handler) { events.on('question-asked', handler); },
	onAnswerQuestion(handler) { events.on('answer-received', handler); },
	onGameOver(handler) { events.on('game-over', handler); },

	gameStart() { events.emit('chat-updated'); },
	chatUpdated(agent) { events.emit('chat-updated', agent); },
	signIn({ name, job }) { events.emit('signed-in', { name, job }); },
	requestNextGuest() { events.emit('next-guest'); },
	dismissCurrentGuest() { events.emit('dismiss-guest'); },
	askQuestion(question) { events.emit('question-asked', question); },
	answerQuestion({ answerIsYes, correctGuess }) { events.emit('answer-received', { answerIsYes, correctGuess })},
	gameOver() { events.emit('game-over'); },
};