import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
});

export const client = openai.beta.assistants;

export const LATEST_MODEL = 'gpt-4-1106-preview';
