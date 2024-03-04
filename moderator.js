import fs from 'fs'
import kebabCase from 'lodash.kebabcase';
import Agent from './agent.js';
import functions from './functions.js';
import fileLoader from './file-dictionary.js';
import { filesClient } from "./client.js";
import events from './events.js';
import { 
    GAME_PREMISE_FILENAME,
    MODERATOR_INSTRUCTIONS_PATH,
    MODERATOR_RULES_FILENAME,
} from './prompts.js';

const instructions = await fs.promises.readFile(MODERATOR_INSTRUCTIONS_PATH, 'utf-8');

const filename = name => `moderator_${kebabCase(name.replace(/^\[[^\]]*\]\s*/, ""))}.txt`;
const moderatorFilePath = name => `agents/moderators/${filename(name)}`;

export default class Moderator extends Agent {
    constructor(name, profile, files) {
        super(name, profile, instructions, functions.moderator, files);
        events.onSignIn(this.readSecret);
    }
    async readSecret({ name, job }) {
        await this.uploadOrReplace('secret-gig.txt', `Name: ${name}   Gig: ${job}`)
    }
    static async Create(name, profile) {
        const files = await fileLoader();
        const premiseFile = files[GAME_PREMISE_FILENAME];
        const moderatorRulesFile = files[MODERATOR_RULES_FILENAME];
        const body = `Name: ${name}\n\n${profile}`;
        await fs.promises.writeFile(moderatorFilePath(name), body, 'utf-8');
        const profileFile = await filesClient.create({
            file: fs.createReadStream(moderatorFilePath(name), 'utf-8'),
            purpose: 'assistants',
        });

        const moderator = new Moderator(`[Moderator] ${name}`, profile, [premiseFile, moderatorRulesFile, profileFile]);
        await moderator.createAgent();
        return moderator;
    }
    static async Load(agent) {
        const files = await fileLoader();
        const premiseFile = files[GAME_PREMISE_FILENAME];
        const moderatorRulesFile = files[MODERATOR_RULES_FILENAME];
        const profileFile = files[filename(agent.name)];
        const profile = await fs.promises.readFile(moderatorFilePath(agent.name), 'utf-8');
        const name = agent.name;
        const moderator = new Moderator(name, profile, [premiseFile, moderatorRulesFile, profileFile]);
        moderator.agent = agent;
        return moderator;
    }
}
