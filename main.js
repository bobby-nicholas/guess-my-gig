import 'dotenv/config';
import { Argument, program } from 'commander';
import logger from './logger.js';
import CharacterGenerator from './generator.js';
import { assistantClient } from './client.js';

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


const createMessage = type => ({ role: 'user', content: `Create a ${type}, as per your instructions` });

async function generate(type, quantity) {
    const generator = await CharacterGenerator.Create();
    const thread = await assistantClient.threads.create();
    switch (type) {
        case 'panelist': 
        case 'moderator':
        case 'guest':
        default:
            break;
    }
}

async function makePanelist(generator, thread) {
    const message = await assistantClient.threads.messages.create(thread.id, createMessage('panelist'));

    let run = await assistantClient.runs.create(thread.id, { assistant_id: generator.id });

    while (run.status !== 'completed') {
        if (run.status === 'requires_action' && run.required_action.type === 'submit_tool_outputs') {
            logger.warning('waiting for tool output');
            logger.obj(run);
        }
        logger.info('not yet complete. waiting 500 ms');
        await sleep(500);
    }
}