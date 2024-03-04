import 'dotenv/config';
import fs from 'fs';
//import app from './cli.js';
import { filesClient } from './client.js';
//app.run();


await fs.promises.writeFile(`test.txt`, 'content 1', 'utf-8');


await filesClient.create({
	file: fs.createReadStream(`test.txt`, 'utf-8'),
	purpose: 'assistants',
});

await fs.promises.writeFile(`test.txt`, 'content 2', 'utf-8');

await filesClient.create({
	file: fs.createReadStream(`test.txt`, 'utf-8'),
	purpose: 'assistants',
});