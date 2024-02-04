import logger from "./logger.js";
import { assistantClient, LATEST_MODEL } from "./client.js";

export default class Agent {
	constructor(name, instructions, functions, files) {
		this.name = name;
		this.instructions = instructions;
		this.tools = [
			{ type: 'retrieval' },
			...functions.map(f => ({ type: 'function', function: f }))
		];
		this.model = LATEST_MODEL;
		this.file_ids = files.map(f => f.id);
		this.agent = null;
	}

	async createAgent() {
		const { name, instructions, tools, model, file_ids } = this;
		this.agent = await assistantClient.create({ name, instructions, tools, model, file_ids });
		logger.logAgentCreation(this);
	}
}
