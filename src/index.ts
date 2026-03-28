import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const plugin = {
  id: "markplane-memory",
  name: "Markplane Memory",

  register(api: OpenClawPluginApi) {
    // Inject .context/ files into the system prompt on every turn
    api.on(
      "before_prompt_build",
      async (_event, ctx) => {
        // Resolve workspace directory
        const workspace =
          ctx.workspaceDir ||
          process.env.OPENCLAW_WORKSPACE ||
          path.join(
            process.env.HOME || process.env.USERPROFILE || "",
            ".openclaw",
            "workspace"
          );

        const contextDir = path.join(workspace, ".markplane", ".context");

        // Read plugin config
        const config = api.pluginConfig as {
          contextFiles?: string[];
          contextHeader?: string;
        } | undefined;
        const filesToInject = config?.contextFiles ?? ["summary.md"];
        const header = config?.contextHeader ?? "## Task Memory (Markplane)";

        // Read each configured context file
        const sections: string[] = [];
        for (const fileName of filesToInject) {
          // Sanitize: only allow filenames, no path traversal
          const safeName = path.basename(fileName);
          const filePath = path.join(contextDir, safeName);
          try {
            const content = await fs.readFile(filePath, "utf-8");
            if (content.trim()) {
              sections.push(content.trim());
            }
          } catch {
            // File doesn't exist — .markplane not initialized yet, or
            // the user configured a file that hasn't been generated.
            // Silently skip.
          }
        }

        if (sections.length === 0) {
          return;
        }

        return {
          appendSystemContext: `${header}\n\n${sections.join("\n\n")}`,
        };
      },
      { priority: 5 }
    );
  },
};

export default plugin;
