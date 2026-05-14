import { db } from "./src/db";
import { products } from "./src/db/schema";
import { sql } from "drizzle-orm";

async function run() {
  const allProds = await db.select().from(products);
  console.log(allProds.map(p => ({ id: p.id, title: p.title, validation_profile: p.validation_profile })));
  process.exit(0);
}
run();
