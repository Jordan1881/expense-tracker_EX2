import { createApp } from "./app.js";
import { ensureSeedCategories } from "./seedCategories.js";

const port = Number(process.env.PORT ?? 3001);

async function main() {
  await ensureSeedCategories();
  const app = createApp();
  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
