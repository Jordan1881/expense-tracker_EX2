import { createApp } from "./app.js";
import { seedCategories } from "./services/categories.js";

const port = Number(process.env.PORT ?? 3001);

async function main() {
  await seedCategories();
  const app = createApp();
  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
