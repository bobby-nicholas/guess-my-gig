import fs from 'fs';
import { filesClient } from './client.js';
import logger from './logger.js';

const fileDictionary = {};

export default async function getFileDictionary() {
    if (Object.keys(fileDictionary).length) {
        logger.info('Returning cached file dictionary');
        return fileDictionary;
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
            fileDictionary[filename] = upload;
        }
        else fileDictionary[filename] = existingUpload;
    }

    return fileDictionary;
}
