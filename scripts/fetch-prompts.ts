import fs from "fs";
import path from "path";

const README_URL =
  "https://raw.githubusercontent.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts/main/README.md";

interface PromptItem {
  id: number;
  title: string;
  description: string;
  prompt: string;
  images: string[];
  author: string;
  source: string;
  language: string;
}

async function fetchReadme() {
  console.log("Fetching README from GitHub...");
  const response = await fetch(README_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`);
  }
  const text = await response.text();
  return text;
}

function parseAllPrompts(readme: string, limit: number = 100): PromptItem[] {
  console.log("Parsing prompts from README...");
  const prompts: PromptItem[] = [];

  const allPromptsSection = readme.match(
    /## 📋 All Prompts([\s\S]*?)$/
  );
  
  if (!allPromptsSection) {
    console.log("No All Prompts section found");
    return prompts;
  }

  const content = allPromptsSection[1];
  const promptSections = content.split(/^### No\.\s+/m);

  console.log(`Found ${promptSections.length - 1} prompt sections`);

  for (let i = 1; i < promptSections.length && prompts.length < limit; i++) {
    const section = promptSections[i];
    
    const titleMatch = section.match(/^(\d+):\s*([\s\S]*?)$/m);
    const title = titleMatch ? `${titleMatch[1]}: ${titleMatch[2].trim()}` : "";

    const descMatch = section.match(/#### 📖 Description\n+([\s\S]*?)(#### 📝 Prompt|$)/);
    const description = descMatch ? descMatch[1].trim() : "";

    const promptMatch = section.match(/#### 📝 Prompt\n+```[a-z]*\n+([\s\S]*?)```/);
    const prompt = promptMatch ? promptMatch[1].trim() : "";

    const images: string[] = [];
    const imgMatches = section.matchAll(
      /<img src="(https:\/\/cms-assets\.youmind\.com\/[^"]+)"/g
    );
    for (const img of imgMatches) {
      if (img[1]) {
        images.push(img[1]);
      }
    }

    let language = "en";
    if (section.includes("Language-ZH") || section.includes("Languages: zh"))
      language = "zh";
    else if (section.includes("Language-JA") || section.includes("Languages: ja"))
      language = "ja";

    if (!title || images.length === 0) continue;

    prompts.push({
      title,
      description,
      prompt,
      images,
      author: "",
      source: "",
      language,
      id: prompts.length + 1,
    });
  }

  console.log(`Parsed ${prompts.length} prompts`);
  return prompts;
}

async function main() {
  try {
    const readme = await fetchReadme();
    const prompts = parseAllPrompts(readme, 100);

    console.log(`Total prompts: ${prompts.length}`);
    
    const withPrompt = prompts.filter(p => p.prompt && p.prompt.length > 10);
    console.log(`Prompts with full content: ${withPrompt.length}`);

    const outputPath = path.join(
      process.cwd(),
      "src",
      "data",
      "prompts.json"
    );

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(prompts, null, 2));
    console.log(`Saved ${prompts.length} prompts to ${outputPath}`);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
