import fs from 'fs';

import { assistantClient } from "./client.js";
import logger from './logger.js';

const agentDictionary = {};

export default async function getAgentDictionary() {
    if (Object.keys(agentDictionary).length) {
        logger.info('Returning cached dictionary');
        return agentDictionary;
    }
    (await assistantClient.list({ limit: 100 })).data.forEach(a => agentDictionary[a.name] = a);

    return agentDictionary;
}
