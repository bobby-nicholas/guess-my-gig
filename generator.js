import fs from "fs/promises";
import upperFirst from 'lodash.upperfirst';
import { threadsClient } from './client.js';
import Agent from "./agent.js";
import functions from "./functions.js";
import agentLoader from "./agent-dictionary.js";
import fileLoader from "./file-dictionary.js";
import logger from "./logger.js";
import agents from "./agents.js";
import { 
    CHARACTER_GENERATION_RULES_FILENAME,
    GENERATOR_INSTRUCTIONS_PATH,
    GAME_PREMISE_FILENAME,
} from "./prompts.js";

const AGENT_NAME = 'Guess My Gig Character Generator';
const instructions = await fs.readFile(GENERATOR_INSTRUCTIONS_PATH, 'utf-8');

const createMessage = type => ({ role: 'user', content: `Create a ${type}, as per your instructions.` });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const parseArguments = args => {
    try { return JSON.parse(args); }
    catch  { return {}; }
};

export default class CharacterGenerator extends Agent{
    constructor(files) {
        super(AGENT_NAME, 'GMG-1000: The character creating robot', instructions, functions.generator, files);
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
    static async Generate(type, quantity) {
        const generator = await CharacterGenerator.Create();
        const thread = await threadsClient.create();
        for (let i = 0; i < quantity; i++) await makeCharacter(generator.agent.id, thread, type);
    }
}

async function makeCharacter(generatorId, thread, characterType) {
    const type = upperFirst(characterType);
    const message = await threadsClient.messages.create(thread.id, createMessage(type));

    const run = await threadsClient.runs.create(thread.id, { assistant_id: generatorId });
    let runStatus = await threadsClient.runs.retrieve(thread.id, run.id);
    while (runStatus.status !== 'completed') {
        if (runStatus.status === 'requires_action') {
            logger.warning('waiting for function results');
            const { tool_calls } = runStatus.required_action?.submit_tool_outputs ?? [];
            const tool = tool_calls.find(t => t.function.name === 'generate_character');
            if (tool) {
                const { name, full_description } = parseArguments(tool.function.arguments);
                if (!!name && !!full_description) {
                    await agents[type].Create(name, full_description);
                    logger.success('agent created successfully from function call');
                    await threadsClient.runs.submitToolOutputs(thread.id, run.id, {
                        tool_outputs: [{ tool_call_id: tool.id, output: JSON.stringify({ success: true }) }]
                    });
                }
                else {
                    logger.warning('failed to parse function arguments:', tool.function.arguments);
                    await threadsClient.runs.submitToolOutputs(thread.id, run.id, {
                        tool_outputs: [{ tool_call_id: tool.id, output: JSON.stringify({ success: false }) }]
                    });
                }
            }
        }

        logger.info('Not yet complete. Waiting 5 second');
        await sleep(5000);
        runStatus = await threadsClient.runs.retrieve(thread.id, run.id);
    }
    logger.success(`${type} created`);
    const messages = (await threadsClient.messages.list(thread.id)).data.map(m => m.content[0].text.value);
    logger.title('Thread Log');
    messages.forEach(m => logger.info(m));
}
