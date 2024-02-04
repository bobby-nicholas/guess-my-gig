import chalk from "chalk";

const log = console.log;

const info = (...msg) => log(chalk.green(...msg));
const obj = msg => log(chalk.blue(JSON.stringify(msg, null, 2)));
const warning = (...msg) => log(chalk.yellow(...msg));
const error = (...msg) => log(chalk.red(...msg));

export default {
	logAgentCreation(agent) {
		info(`Agent '${agent.name}' created`);
		obj(agent);
	},
	info,
	obj,
	warning,
	error,
}