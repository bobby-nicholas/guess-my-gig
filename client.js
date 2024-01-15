import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: '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',
});

export const client = openai.beta.assistants;

export const LATEST_MODEL = 'gpt-4-1106-preview';