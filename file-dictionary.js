import 'dotenv/config';
import fs from 'fs';

import { filesClient } from "./client.js";
import logger from './logger.js';

const fileIdDictionary = {};

export default async function getFileDictionary() {
    if (Object.keys(fileIdDictionary).length) {
        logger.info('Returning cached dictionary');
        return fileIdDictionary;
    }

    const localFiles = await fs.promises.readdir('knowledge');
    logger.info('Local files loaded');
    logger.obj(localFiles);

    const uploadedFiles = (await filesClient.list()).data;
    logger.info('Remote files loaded');
    logger.obj(uploadedFiles);

    for (const filename of localFiles) {
        const existingUpload = uploadedFiles.find(f => f.filename === filename);
        if (!existingUpload) {
            const upload = await filesClient.create({
                file: fs.createReadStream(`knowledge/${filename}`, 'utf-8'),
                purpose: 'assistants',
            });
            fileIdDictionary[filename] = upload;
        }
        else fileIdDictionary[filename] = existingUpload;
    }

    return fileIdDictionary;
}
