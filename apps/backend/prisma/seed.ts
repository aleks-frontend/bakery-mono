import "dotenv/config";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import type { CycleStatus, OrderStatus } from "../src/generated/prisma/enums.js";
import { auth } from "../src/lib/auth.js";
import { suggestCycleStart } from "../src/lib/cycleDates.js";
import { articles } from "../src/lib/articlesCatalog.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface RealOrdersData {
  cycles: { key: string; label: string; deliveryDate: string; status: CycleStatus }[];
  orders: {
    cycleKey: string;
    recipient: string;
    phone: string;
    email: string | null;
    location: string;
    totalPrice: number;
    status: OrderStatus;
    remark: string | null;
    archived: boolean;
    createdAt: string;
    items: { articleId: string; quantity: number; unitPrice: number }[];
  }[];
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function seedAdminAccount() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set to seed the admin account.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin account already exists for ${email}, skipping.`);
    return;
  }

  const ctx = await auth.$context;
  const hashedPassword = await ctx.password.hash(password);
  const user = await ctx.internalAdapter.createUser({
    email,
    name: "Admin",
    emailVerified: true,
  });
  await ctx.internalAdapter.linkAccount({
    userId: user.id,
    providerId: "credential",
    accountId: user.id,
    password: hashedPassword,
  });

  console.log(`Seeded admin account for ${email}.`);
}

async function seedRealOrders(realOrdersPath: string) {
  const data: RealOrdersData = JSON.parse(readFileSync(realOrdersPath, "utf-8"));

  const cycleIdByKey = new Map<string, string>();
  const cycleRows = data.cycles.map((c) => {
    const id = randomUUID();
    cycleIdByKey.set(c.key, id);
    return { id, label: c.label, status: c.status, deliveryDate: new Date(c.deliveryDate) };
  });
  await prisma.cycle.createMany({ data: cycleRows });

  const orderRows = data.orders.map((o) => {
    const cycleId = cycleIdByKey.get(o.cycleKey);
    if (!cycleId) throw new Error(`No cycle found for key ${o.cycleKey}`);
    const createdAt = new Date(o.createdAt);
    return {
      id: randomUUID(),
      recipient: o.recipient,
      phone: o.phone,
      email: o.email,
      location: o.location,
      totalPrice: o.totalPrice,
      status: o.status,
      remark: o.remark,
      archived: o.archived,
      cycleId,
      createdAt,
      updatedAt: createdAt,
    };
  });
  await prisma.order.createMany({ data: orderRows });

  const itemRows = data.orders.flatMap((o, i) =>
    o.items.map((item) => ({
      id: randomUUID(),
      orderId: orderRows[i].id,
      articleId: item.articleId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
  );
  await prisma.orderItem.createMany({ data: itemRows });

  const { label, deliveryDate } = suggestCycleStart();
  const openCycle = await prisma.cycle.create({
    data: { label, status: "OPEN", deliveryDate },
  });

  console.log(
    `Seeded ${articles.length} articles, ${cycleRows.length} historical cycles ` +
      `(${orderRows.length} orders, ${itemRows.length} items), and 1 fresh open cycle (${openCycle.label}).`,
  );
}

async function seedDemoOrders() {
  const { label, deliveryDate } = suggestCycleStart();
  const cycle = await prisma.cycle.create({ data: { label, status: "OPEN", deliveryDate } });

  await prisma.order.create({
    data: {
      recipient: "Ana Petrović",
      phone: "0601234567",
      location: "Subotica",
      totalPrice: 200 * 2 + 90 * 3,
      status: "NOT_RECEIVED",
      cycleId: cycle.id,
      items: {
        create: [
          { articleId: "beli_hleb_500g", quantity: 2, unitPrice: 200 },
          { articleId: "puz", quantity: 3, unitPrice: 90 },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      recipient: "Marko Nikolić",
      phone: "0659876543",
      location: "Hajdukovo",
      totalPrice: 230,
      status: "IN_PROGRESS",
      cycleId: cycle.id,
      items: { create: [{ articleId: "crni_hleb_500g", quantity: 1, unitPrice: 230 }] },
    },
  });

  await prisma.order.create({
    data: {
      recipient: "Jelena Kovač",
      phone: "0631112233",
      location: "Subotica",
      totalPrice: 400 + 230,
      status: "DELIVERED",
      cycleId: cycle.id,
      items: {
        create: [
          { articleId: "seljacki_hleb_1000g", quantity: 1, unitPrice: 400 },
          { articleId: "spelta_hleb_500g", quantity: 1, unitPrice: 230 },
        ],
      },
    },
  });

  console.log(`Seeded ${articles.length} articles, 1 open cycle (${cycle.label}), and 3 demo orders.`);
}

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.repeatingOrderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.repeatingOrder.deleteMany();
  await prisma.cycle.deleteMany();
  await prisma.article.deleteMany();

  await prisma.article.createMany({ data: articles });

  const realOrdersPath = path.join(__dirname, "seed-data", "real-orders.json");
  if (existsSync(realOrdersPath)) {
    await seedRealOrders(realOrdersPath);
  } else {
    await seedDemoOrders();
  }

  await seedAdminAccount();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
