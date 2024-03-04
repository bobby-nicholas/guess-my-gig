import fs from "fs"
import kebabCase from "lodash.kebabcase";
import Agent from "./agent.js";
import functions from "./functions.js";
import { GAME_PREMISE_FILENAME, PANELIST_INSTRUCTIONS_PATH, PANELIST_RULES_FILENAME } from "./prompts.js";
import fileLoader from "./file-dictionary.js";
import { filesClient } from "./client.js";

const instructions = await fs.promises.readFile(PANELIST_INSTRUCTIONS_PATH, 'utf-8');

const filename = name => `panelist_${kebabCase(name.replace(/^\[[^\]]*\]\s*/, ""))}.txt`;
const panelistFilePath = name => `agents/panelists/${filename(name)}`;

export default class Panelist extends Agent {
    constructor(name, profile, files) {
        super(name, profile, instructions, functions.panelist, files);
    }
    static async Create(name, profile) {
        const files = await fileLoader();
        const premiseFile = files[GAME_PREMISE_FILENAME];
        const panelistRulesFile = files[PANELIST_RULES_FILENAME];
        const body = `Name: ${name}\n\n${profile}`;
        await fs.promises.writeFile(panelistFilePath(name), body, 'utf-8');
        const profileFile = await filesClient.create({
            file: fs.createReadStream(panelistFilePath(name), 'utf-8'),
            purpose: 'assistants',
        });

        const panelist = new Panelist(`[Panelist] ${name}`, profile, [premiseFile, panelistRulesFile, profileFile]);
        await panelist.createAgent();
        return panelist;
    }
    static async Load(agent) {
        const files = await fileLoader();
        const premiseFile = files[GAME_PREMISE_FILENAME];
        const panelistRulesFile = files[PANELIST_RULES_FILENAME];
        const profileFile = files[filename(agent.name)];
        const profile = await fs.promises.readFile(panelistFilePath(agent.name), 'utf-8');
        const name = agent.name;
        const panelist = new Panelist(name, profile, [premiseFile, panelistRulesFile, profileFile]);
        panelist.agent = agent;
        return panelist;
    }
}
