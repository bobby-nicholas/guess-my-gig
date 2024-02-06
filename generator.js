import fs from "fs/promises";
import Agent from "./agent.js";
import functions from "./functions.js";
import agentLoader from "./agent-dictionary.js";
import fileLoader from "./file-dictionary.js";
import { 
    CHARACTER_GENERATION_RULES_FILENAME,
    GENERATOR_INSTRUCTIONS_PATH,
    GAME_PREMISE_FILENAME,
} from "./prompts.js";
import logger from "./logger.js";

const instructions = await fs.readFile(GENERATOR_INSTRUCTIONS_PATH, 'utf-8');
const AGENT_NAME = 'Guess My Gig Character Generator';

export default class CharacterGenerator extends Agent{
    constructor(files) {
        super(AGENT_NAME, instructions, functions.generator, files);
    }
    static async Create() {
        const existingGenerator = (await agentLoader())[AGENT_NAME];
        if (existingGenerator) {
            logger.info('existing generator found');
            logger.obj(existingGenerator);
            const generator = new CharacterGenerator(existingGenerator.file_ids.map(id => ({ id })));
            generator.agent = existingGenerator;
            return generator;
        }
        const files = await fileLoader();
        const premiseFile = files[GAME_PREMISE_FILENAME];
        const generatorRulesFile = files[CHARACTER_GENERATION_RULES_FILENAME];
        const generator = new CharacterGenerator([premiseFile, generatorRulesFile]);
        await generator.createAgent();
        return generator;
    }
}