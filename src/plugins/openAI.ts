import OpenAI from "openai";

const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.github.ai/inference";
const modelName = "openai/gpt-4o-mini";

export async function main() {

  const client = new OpenAI({ baseURL: endpoint, apiKey: token });

  const stream = await client.chat.completions.create({
    messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Give me 5 good reasons why I should exercise every day." },
      ],
      model: modelName,
      stream: true,
      stream_options: {include_usage: true}
    });

    var usage = null;
    for await (const part of stream) {
      process.stdout.write(part.choices[0]?.delta?.content || '');
	  if (part.usage){
		usage = part.usage;
      }
    }
    process.stdout.write('\n');
    
    if (usage) {
	  process.stdout.write(`Prompt tokens: ${usage.prompt_tokens}\n`);
	  process.stdout.write(`Completion tokens: ${usage.completion_tokens}\n`);
	  process.stdout.write(`Total tokens: ${usage.total_tokens}\n`);
    }
}

main().catch((err) => {
  console.error("The sample encountered an error:", err);
});