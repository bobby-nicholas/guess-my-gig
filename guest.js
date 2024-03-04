import fs from "fs"
import kebabCase from "lodash.kebabcase";
import Agent from "./agent.js";
import functions from "./functions.js";
import fileLoader from './file-dictionary.js';
import { filesClient } from "./client.js";
import { 
    GAME_PREMISE_FILENAME,
    GUEST_INSTRUCTIONS_PATH,
    GUEST_RULES_FILENAME,
} from "./prompts.js";

const instructions = await fs.promises.readFile(GUEST_INSTRUCTIONS_PATH, 'utf-8');

const filename = name => `panelist_${kebabCase(name.replace(/^\[[^\]]*\]\s*/, ""))}.txt`;
const guestFilePath = name => `agents/guests/${filename(name)}`;

export default class Guest extends Agent {
    constructor(name, profile, files) {
        super(name, profile, instructions, functions.guest, files);
    }
    static async Create(name, profile) {
        const files = await fileLoader();
        const premiseFile = files[GAME_PREMISE_FILENAME];
        const guestRulesFile = files[GUEST_RULES_FILENAME];
        const filename = `guest_${kebabCase(name)}.txt`;
        const body = `Name: ${name}\n\n${profile}`;
        await fs.promises.writeFile(guestFilePath(name), body, 'utf-8');
        const profileFile = await filesClient.create({
            file: fs.createReadStream(guestFilePath(name), 'utf-8'),
            purpose: 'assistants',
        });

        const guest = new Guest(`[Guest] ${name}`, profile, [premiseFile, guestRulesFile, profileFile]);
        await guest.createAgent();
        return guest;
    }
    static async Load(agent) {
        const files = await fileLoader();
        const premiseFile = files[GAME_PREMISE_FILENAME];
        const guestRulesFile = files[GUEST_RULES_FILENAME];
        const profileFile = files[filename(agent.name)];
        const profile = await fs.promises.readFile(guestFilePath(agent.name), 'utf-8');
        const name = agent.name;
        const guest = new Guest(name, profile, [premiseFile, guestRulesFile, profileFile]);
        guest.agent = agent;
        return guest;
    }
}

