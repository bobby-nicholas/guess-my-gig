import fs from 'fs/promises';
import sampleSize from 'lodash.samplesize';
import agentLoader from './agent-dictionary.js';
import logger from './logger.js';
import events from './events.js';
import Guest from './guest.js';
import Moderator from './moderator.js';
import { threadsClient } from './client.js';
import Panelist from './panelist.js';

export default class Game {
	static async New() {
		let questionNumber = 0;
		let noAnswers = 0;
		let yesAnswers = 0;
		let guestName = '';
		let currentGuest = null;
		let gameThread = null;
		let messageLog = [];
		const logScore = () => logger.info(`${yesAnswers} Yes answer${yesAnswers > 1 ? 's': ''} and ${noAnswers} No answer${noAnswers > 1 ? 's': ''}`);

		const agents = await agentLoader();
		const moderatorAgents = Object.keys(agents).filter(name => /^\[Moderator\] /.test(name));
		const panelistAgents = Object.keys(agents).filter(name => /^\[Panelist\] /.test(name));
		const guestAgents = Object.keys(agents).filter(name => /^\[Guest\] /.test(name));

		if (moderatorAgents.length === 0) logger.error(`No moderators found but 1 moderator is required to play the game. Generate a moderator using the 'generate moderator' command`);
		if (panelistAgents.length < 4) logger.error(`${panelistAgents.length} panelists found but 4 panelists are required to play the game. Generate a panelist using the 'generate panelist' command`);
		if (guestAgents.length < 3) logger.error(`${guestAgents.length} guests found but 3 guests are required to play the game. Generate a guest using the 'generate guest' command`);
		if (moderatorAgents.length === 0 || panelistAgents.length < 4 || guestAgents.length < 3) return;

		const moderatorSelection = sampleSize(moderatorAgents, 1);
		const panelistSelection = sampleSize(panelistAgents, 4);
		const guestSelection = sampleSize(guestAgents, 3);
		
		events.onChatUpdate(async() => {
			if (!gameThread) return logger.error(`ERROR! A chat update event occurred but the thread id is unknown`)
			const updatedLog = await retrieveMessageLog();
			for (let i = messageLog.length; i < updatedLog.length; i++) logger.info(updatedLog[i]);
			messageLog = updatedLog;
		});

		events.onAskQuestion((question) => logger.info(`Question asked: "${question}"`));

		events.onAnswerQuestion(({ answerIsYes, correctGuess }) => {
			questionNumber++;
			if (answerIsYes) {
				yesAnswers++
				logger.success(`Answered 'Yes'`);
			}
			else {
				noAnswers++;
				logger.error(`Answered 'No'`);
			}
			if (correctGuess) logger.success(`Guess is correct!!`);
			logScore();
		});

		events.onNextGuest(async() => {
			guestName = guestSelection.pop();
			if (!guestName)  {
				return logger.error('ERROR! Moderator attempted to get next guest when there are no guests left.');
			}
			currentGuest = await Guest.Load(agents[guestName]);
			currentGuest.joinConversation(gameThread);
		});

		events.onDismissGuest(async() => {
			if (!currentGuest) {
				return logger.error('ERROR! Moderator attempted to dismiss guest when no current guest exists.');
			}
			currentGuest.destroyAgent();
			currentGuest = null;
		});

		events.onGameOver(async() => {
			for (const guest in guestSelection) guest.destroyAgent();
			currentGuest = null;
			moderatorSelection = null;
			for (const panelist in panelistSelection) panelist = null;
			await fs.writeFile(`transcripts/Game-${stamp()}.txt`, messageLog.join('\n'), 'utf-8');
			process.exit();
		});

		const moderator = await Moderator.Load(agents[moderatorSelection]);
		const panelists = [];
		for (panelist in panelistSelection) panelists.push(await Panelist.Load(agents[panelist]));

		gameThread = (await threadsClient.create()).id;

		moderator.joinConversation(gameThread);
		panelists.forEach(p => p.joinConversation(gameThread));

		const startMessage = await threadsClient.messages.create(thread.id, createMessage(
			`[Producer Bob Bobington] Hi ${moderator.Name}! We're almost ready to start. The panelists tonight 
			are ${formatNames(panelists.map(p => p.Name))}. Have a good show! You're on in 5, 4, 3, 2, 1...`
		));

		events.gameStart();
	}
}

function stamp() { return new Date().toLocaleString().replaceAll(/[/:\s]/gi, '.').replaceAll(',',''); }
async function retrieveMessageLog(threadId) {
	return (await threadsClient.messages.list(threadId)).data.map(m => m.content[0].text.value);
}
function formatNames(names) {
    if(names.length === 0) return '';
    if(names.length === 1) return names[0];     
    const last = names.pop();
    return `${names.join(', ')}, and ${last}`;
}