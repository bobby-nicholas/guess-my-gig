import fs from "fs"
import kebabCase from "lodash.kebabcase";
import Agent from "./agent.js";
import functions from "./functions.js";
import fileLoader from './file-dictionary.js';
import { filesClient } from "./client.js";
import { 
    GAME_PREMISE_FILENAME,
    MODERATOR_INSTRUCTIONS_PATH,
    MODERATOR_RULES_FILENAME,
} from "./prompts.js";

const instructions = await fs.promises.readFile(MODERATOR_INSTRUCTIONS_PATH, 'utf-8');

export default class Moderator extends Agent {
    constructor(name, files) {
        super(name, instructions, functions.moderator, files);
    }
    static async Create(name, profile) {
        const files = await fileLoader();
        const premiseFile = files[GAME_PREMISE_FILENAME];
        const moderatorRulesFile = files[MODERATOR_RULES_FILENAME];
        const filename = `moderator_${kebabCase(name)}.txt`;
        await fs.promises.writeFile(`agents/moderators/${filename}`, profile, 'utf-8');
        const profileFile = await filesClient.create({
            file: fs.createReadStream(`agents/moderators/${filename}`, 'utf-8'),
            purpose: 'assistants',
        });

        const moderator = new Moderator(name, [premiseFile, moderatorRulesFile, profileFile]);
        await moderator.createAgent();
        return moderator;
    }
}
