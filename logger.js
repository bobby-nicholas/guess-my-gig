import chalk from "chalk";

const log = console.log;

const info = (...msg) => log(chalk.blue(...msg));
const obj = msg => log(chalk.cyan(JSON.stringify(msg, null, 2)));
const warning = (...msg) => log(chalk.yellow(...msg));
const error = (...msg) => log(chalk.red(...msg));
const success = (...msg) => log(chalk.green(...msg));
const title = (...msg) => log(chalk.underline.bold(...msg));

export default {
	logAgentCreation(agent) {
		title(`Agent '${agent.name}' created`);
		obj(agent);
	},
	logConversationJoined(agent) {
		title(`Agent ${agent.name} joined conversation thread ${agent.thread.id}`);
	},
	logAgentDestruction(agent) {
		title(`Agent ${agent.name} is being deleted!`);
	},
	info,
	obj,
	warning,
	error,
	success,
	title,
}