import { extractIntentFromPrompt } from './src/services/ai-generation.service';
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  console.log("Testing intent parser...");
  const prompt = "maths ka paper generate karo jismein: 5 mcq ho 1 marks ke aur ek diagram ka question ho 10 marks ka";
  const result = await extractIntentFromPrompt(prompt, 'Science');
  console.log("Result:", JSON.stringify(result, null, 2));
}

test().catch(console.error);
