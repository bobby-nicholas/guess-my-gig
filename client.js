import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.GMG_OPENAI_API_KEY,
});

export const { files: filesClient } = openai;
export const { assistants: assistantClient } = openai.beta;
export const { threads: threadsClient } = openai.beta;

export const LATEST_MODEL = 'gpt-4-1106-preview';
