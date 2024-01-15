import logger from "./logger";
import { client, LATEST_MODEL } from "./client";

export default class Agent {
	constructor(name, instructions, functions) {
		this.name = name;
		this.instructions = instructions;
		this.tools = functions.map(f => ({ type: 'function', function: f }));
		this.model = LATEST_MODEL;

		this.agent = null;
		this.initialized = false;

		this.create();
	}
	async create() {
		const { name, instructions, tools, model } = this;
		this.agent = await client.create({ name, instructions, tools, model });
		this.initialized = true;
		logger.logAgentCreation(this);
	}
}