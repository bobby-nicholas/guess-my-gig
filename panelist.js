import fs from "fs"
import kebabCase from "lodash.kebabcase";
import Agent from "./agent.js";
import functions from "./functions.js";
import { GAME_PREMISE_FILENAME, PANELIST_INSTRUCTIONS_PATH } from "./prompts.js";
import fileLoader from "./file-dictionary.js";
import { filesClient } from "./client.js";

const instructions = await fs.promises.readFile(PANELIST_INSTRUCTIONS_PATH, 'utf-8');

export default class Panelist extends Agent {
    constructor(name, files) {
        super(name, instructions, functions.panelist, files);
    }
    static async Create(name, profile) {
        const premiseFile = (await fileLoader())[GAME_PREMISE_FILENAME];
        const filename = `panelist_${kebabCase(name)}.txt`;
        await fs.promises.writeFile(`agents/panelists/${filename}`, profile, 'utf-8');
        const profileFile = await filesClient.create({
            file: fs.createReadStream(`agents/panelists/${filename}`, 'utf-8'),
            purpose: 'assistants',
        });

        const panelist = new Panelist(name, [premiseFile, profileFile]);
        await panelist.createAgent();
        return panelist;
    }
}
