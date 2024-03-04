import logger from './logger.js';
import { assistantClient, threadsClient, filesClient, LATEST_MODEL, createPortrait } from './client.js';
import utils from './utils.js';
import events from './events.js';
import files from './file-dictionary.js';
import { toFile } from 'openai';

export default class Agent {
	constructor(name, profile, instructions, functions, files) {
		this.name = name;
		this.profile = profile;
		this.instructions = instructions;
		this.tools = !!functions ? [
			{ type: 'retrieval' },
			...functions.map(f => ({ type: 'function', function: f }))
		] : [];
		this.model = LATEST_MODEL;
		this.file_ids = !!files ? files.map(f => f.id) : [];
		this.agent = null;
		this.thread = null;
		this.isRunning = false;
		this.hasPending = false;
		events.onChatUpdate(this.listen);
	}

	get Name() { return this.name.replace(/^\[[^\]]*\]\s*/, ""); }

	async createAgent() {
		const { name, profile, instructions, tools, model, file_ids } = this;
		this.agent = await assistantClient.create({ name, instructions, tools, model, file_ids });
		await createPortrait(name, profile);
		logger.logAgentCreation(this);
	}

	async destroyAgent() {
		const { id } = this.agent;
		if (!id) {
			logger.error(`Tried to destroy agent but cannot find it's id`);
			return;
		}
		logger.logAgentDestruction(this);
		await assistantClient.del(id);
		this.agent = null;
	}

	async uploadOrReplace(filename, content) {
		if (files[filename]) {
			await assistantClient.files.del(this.agent.id, files[filename].id);
			this.file_ids = this.file_ids.filter(id => id !== files[filename].id);
			await filesClient.del(files[filename].id);
		}
		const upload = await filesClient.create({
			file: toFile(Buffer.from(content), filename),
			purpose: 'assistants',
		});
		files[filename] = upload;
		await assistantClient.files.create(this.agent.id, files[filename].id);
		this.file_ids = [...this.file_ids, files[filename].id];
		this.updateAgent();
	}

	joinConversation(thread) {
		this.thread = thread;
		logger.logConversationJoined(this);
	}

	async listen() {
		const { thread, agent, isRunning } = this;
		if (!thread || !agent) return;
		if (isRunning) {
			this.hasPending = true;
			return;
		}
		this.hasPending = false;
		this.isRunning = true;
		try {
			const run = await threadsClient.runs.create(thread.id, { assistant_id: agent.id });
			let runStatus = await threadsClient.runs.retrieve(thread.id, run.id);
			while (runIsInProgress(runStatus)) {
				if (requiresFunctionResponse(runStatus)) processFunction(thread, run);
				await utils.sleep(2000);
				runStatus = await threadsClient.runs.retrieve(thread.id, run.id);
			}
			if (runFailed(runStatus)) {
				logger.error(`Run ${runStatus.id} failed with status ${runStatus.status}`);
				return;
			}
			if (runComplete(run)) events.chatUpdated(this.agent);
		}
		finally {
			this.isRunning = false;
		}
	}
	
	async updateAgent() {
		this.agent = await assistantClient.retrieve(this.agent.id);
	}
}

function runIsInProgress(run) { return !runComplete(run) && !runFailed(run) && !runCancelled(run); }
function runComplete(run) { return run.status === 'completed'; }
function runFailed(run) { return ['failed', 'expired'].includes(run.status); }
function runCancelled(run) { return ['cancelling', 'cancelled'].includes(run.status); }
function requiresFunctionResponse(run) { return run.status === 'requires_action'; }
async function cancelRun(thread, run) { await threadsClient.runs.cancel(thread.id, run.id); }
async function submitSuccessResponse(thread, run, tool) {
	await threadsClient.runs.submitToolOutputs(thread.id, run.id, {
		tool_outputs: [{ tool_call_id: tool.id, output: JSON.stringify({ success: true }) }]
	});
}
async function submitFailResponse(thread, run, tool) {
	await threadsClient.runs.submitToolOutputs(thread.id, run.id, {
		tool_outputs: [{ tool_call_id: tool.id, output: JSON.stringify({ success: false }) }]
	});
}
async function processFunction(thread, run) {
	const tool = run.required_action?.submit_tool_outputs.tool_calls[0];
	if (!tool) return;
	switch (tool.function.name) {
		case 'skip': return await cancelRun(thread, run);
		case 'ask_question': return await registerQuestion(thread, run, tool);
		case 'answer_question': return await registerAnswer(thread, run, tool);
		case 'sign_in': return await registerContestant(thread, run, tool);
		case 'next_guest': return await requestNextGuest(thread, run);
		case 'dismiss_guest': return await dismissCurrentGuest(thread, run);
		case 'end_game': return await endGame(thread, run);
	}
}
async function registerQuestion(thread, run, tool) {
	const { question } = utils.parseArguments(tool.function.arguments);
	if (question) {
		events.askQuestion(question);
		return await submitSuccessResponse(thread, run, tool);
	}
	return await submitFailResponse(thread, run, tool);
}
async function registerAnswer(thread, run, tool) {
	const { answerIsYes, correctGuess } = utils.parseArguments(tool.function.arguments);
	if (![typeof answerIsYes, typeof correctGuess].includes('undefined')) {
		events.answerQuestion({ answerIsYes, correctGuess });
		return await submitSuccessResponse(thread, run, tool);
	}
	return await submitFailResponse(thread, run, tool);
}
async function registerContestant(thread, run, tool) {
	const { name, job } = utils.parseArguments(tool.function.arguments);
	if (!!name && !!job) {
		events.signIn({ name, job });
		return await cancelRun(thread, run);
	}
	return await submitFailResponse(thread, run, tool);
}
async function requestNextGuest(thread, run) {
	events.requestNextGuest();
	return await submitSuccessResponse(thread, run);
}
async function dismissCurrentGuest(thread, run) {
	events.dismissCurrentGuest();
	return await submitSuccessResponse(thread, run);
}
async function endGame(thread, run) {
	events.gameOver();
	return await cancelRun(thread, run);
}