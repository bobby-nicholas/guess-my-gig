import fs from "fs/promises"
import kebabCase from "lodash.kebabcase";
import Agent from "./agent";
import functions from "./functions";
import { GAME_PREMISE_FILENAME, PANELIST_INSTRUCTIONS_PATH } from "./prompts";
import fileLoader from "./file-dictionary";
import { filesClient } from "./client";

const instructions = await fs.readFile(PANELIST_INSTRUCTIONS_PATH, 'utf-8');

export default class Panelist extends Agent {
    constructor(name, files) {
        super(name, instructions, functions.panelist, files);
    }
    static async Create(name, profile) {
        const premiseFile = (await fileLoader())[GAME_PREMISE_FILENAME];
        const filename = `panelist_${kebabCase(name)}.prompt`;
        await fs.writeFile(`agents/panelists/${filename}`, profile, 'utf-8');
        const profileFile = await filesClient.create({
            file: fs.createReadStream(`agents/panelists/${filename}`, 'utf-8'),
            purpose: 'assistants',
        });

        const panelist = new Panelist(name, [premiseFile, profileFile]);
        await panelist.createAgent();
        return panelist;
    }
}
