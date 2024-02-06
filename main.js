import 'dotenv/config';
import { Argument, program } from 'commander';
import logger from './logger.js';
import CharacterGenerator from './generator.js';
import { threadsClient } from './client.js';
import Panelist from './panelist.js';
import Moderator from './moderator.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));

program
    .name('Guess My Gig! CLI')
    .description('Manage and run instances of the Guess My Gig! game')

program.command('generate')
    .description(`Generate one or more characters for use in future runs of GMG. Valid character types are 'moderator', 'panelist', or 'guest'`)
    .addArgument(new Argument('<character_type>', 'Character type to generate').choices(['moderator', 'panelist', 'guest']))
    .addArgument(new Argument('[repeat]', 'Number of characters to generate').default(1))
    .action(generate);

program.parse();


const createMessage = type => ({ role: 'user', content: `Create a ${type}, as per your instructions.` });

async function generate(type, quantity) {
    const generator = await CharacterGenerator.Create();
    const thread = await threadsClient.create();
    for (let i = 0; i < quantity; i++) await makeCharacter(generator, thread, type);
}

async function makeCharacter(generator, thread, type) {
    const message = await threadsClient.messages.create(thread.id, createMessage(type));

    const run = await threadsClient.runs.create(thread.id, { assistant_id: generator.agent.id });
    let runStatus = await threadsClient.runs.retrieve(thread.id, run.id);
    while (runStatus.status !== 'completed') {
        if (runStatus.status === 'requires_action') {
            logger.warning('waiting for tool output');
            const { tool_calls } = runStatus.required_action?.submit_tool_outputs ?? [];

            const tool = tool_calls.find(t => t.function.name === 'generate_character');

            if (tool) {
                logger.obj(tool);
                const { name, full_description } = JSON.parse(tool.function.arguments);
                switch (type) {
                    case 'panelist': 
                        await Panelist.Create(name, full_description);
                        break;
                    case 'moderator': 
                        await Moderator.Create(name, full_description);
                        break;
                }
                await threadsClient.runs.submitToolOutputs(thread.id, run.id, {
                    tool_outputs: [{ tool_call_id: tool.id, output: JSON.stringify({ success: true }) }]
                });
            }
        }

        logger.info('Not yet complete. Waiting 1 second');
        await sleep(1000);
        runStatus = await threadsClient.runs.retrieve(thread.id, run.id);
    }
    logger.success(`${type} created`);
}