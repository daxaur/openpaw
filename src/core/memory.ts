import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

const MEMORY_DIR = path.join(os.homedir(), ".claude", "memory");

const INITIAL_MEMORY = `# Memory

## User
- Name: (will be filled in as we learn)

## Preferences
- (Claude will add preferences as they come up)

## Active Projects
- (Claude will track projects mentioned in conversation)
`;

export function memoryExists(): boolean {
	return fs.existsSync(path.join(MEMORY_DIR, "MEMORY.md"));
}

export function setupMemory(userName?: string): void {
	if (!fs.existsSync(MEMORY_DIR)) {
		fs.mkdirSync(MEMORY_DIR, { recursive: true });
	}

	const memoryPath = path.join(MEMORY_DIR, "MEMORY.md");
	if (!fs.existsSync(memoryPath)) {
		let content = INITIAL_MEMORY;
		if (userName) {
			content = content.replace(
				"(will be filled in as we learn)",
				userName,
			);
		}
		fs.writeFileSync(memoryPath, content, "utf-8");
	}

	// Create empty topic files if they don't exist
	const topicFiles = ["people.md", "preferences.md", "projects.md", "journal.md"];
	for (const file of topicFiles) {
		const filePath = path.join(MEMORY_DIR, file);
		if (!fs.existsSync(filePath)) {
			const title = file.replace(".md", "");
			fs.writeFileSync(
				filePath,
				`# ${title.charAt(0).toUpperCase() + title.slice(1)}\n`,
				"utf-8",
			);
		}
	}
}
