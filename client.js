import fs from "fs";
import OpenAI from "openai";
import axios from "axios";
import kebabCase from "lodash.kebabcase";

const openai = new OpenAI({
  apiKey: process.env.GMG_OPENAI_API_KEY,
});

export const { files: filesClient } = openai;
export const { assistants: assistantClient } = openai.beta;
export const { threads: threadsClient } = openai.beta;
export const LATEST_MODEL = 'gpt-4-1106-preview';

const DALLE_3_MODEL = 'dall-e-3';

export async function createPortrait(name, profile) {
  const image = await openai.images.generate({
    model: DALLE_3_MODEL,
    quality: 'hd',
    size: '1024x1792',
    style: 'natural',
    prompt: `A full body portrait on a plain background of the person described here:\n\n${profile}`,
  });
  const { url } = image.data[0];
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const filename = `portrait_${kebabCase(name)}.png`;
  await fs.promises.writeFile(`portraits/${filename}`, response.data);
}