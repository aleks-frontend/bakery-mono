import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { auth } from "../src/lib/auth.js";
import { isoWeekLabel } from "../src/lib/cycleDates.js";

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

const articles: { id: string; name: string; price: number; available: boolean }[] = [
  { id: "beli_hleb_500g", name: "Beli hleb - Fehér kenyér - 500g", price: 200, available: true },
  { id: "beli_hleb_1000g", name: "Beli hleb - Fehér kenyér - 1000g", price: 400, available: true },
  { id: "beli_hleb_1500g", name: "Beli hleb - Fehér kenyér - 1500g", price: 600, available: true },
  { id: "seljacki_hleb_500g", name: "Seljački hleb - Paraszt kenyét - 500g", price: 200, available: true },
  { id: "seljacki_hleb_1000g", name: "Seljački hleb - Paraszt kenyét -1000g", price: 400, available: true },
  { id: "seljacki_hleb_1500g", name: "Seljački hleb - Paraszt kenyét -1500g", price: 600, available: true },
  { id: "razani_hleb", name: "Hleb sa ražanim brašnom - Rozsos kenyér - 1000g", price: 400, available: true },
  {
    id: "integralni_razani_hleb",
    name: "Integralni hleb od ražanog brašna - TK rozskenyét - 800g",
    price: 350,
    available: true,
  },
  { id: "crni_hleb_500g", name: "Crni hleb - Bánkúti fekete kenyér - 500g", price: 230, available: true },
  { id: "crni_hleb_1000g", name: "Crni hleb - Bánkúti fekete kenyér - 1000g", price: 450, available: true },
  { id: "hrono_hleb", name: "Hrono hleb - Chrono kenyér - 800g", price: 350, available: true },
  { id: "spelta_hleb_500g", name: "Hleb od spelte - Tönköly kenyér - 500g", price: 230, available: true },
  { id: "spelta_hleb_1000g", name: "Hleb od spelte - Tönköly kenyér - 1000g", price: 450, available: true },
  {
    id: "hleb_sa_semenkama",
    name: "Hleb sa više vrsta semenki - Sokmagvas kenyér - 800g",
    price: 370,
    available: true,
  },
  { id: "hleb_sa_lanom_500g", name: "Hleb sa lanom - Lenmagos kenyér - 500g", price: 200, available: true },
  { id: "hleb_sa_lanom_1000g", name: "Hleb sa lanom - Lenmagos kenyér - 1000g", price: 400, available: true },
  { id: "sendvic_hleb", name: "Hleb za sendviče - Szendvics kenyér - 800g", price: 370, available: true },
  {
    id: "100%_einkorn_hleb",
    name: "Hleb od jednozrnke 100% - 100% alakor kenyér 450g",
    price: 250,
    available: true,
  },
  { id: "focaccia_300g", name: "Focaccia - ~300g", price: 250, available: true },
  { id: "focaccia_800g", name: "Focaccia - ~800g", price: 650, available: true },
  { id: "focaccia_1600g", name: "Focaccia - ~1600g", price: 1200, available: true },
  {
    id: "focaccia_slanina_800g",
    name: "Focaccia - slanina - szalonnás ~800g",
    price: 650,
    available: true,
  },
  {
    id: "focaccia_slanina_1600g",
    name: "Focaccia - slanina - szalonnás ~1600g",
    price: 1200,
    available: true,
  },
  { id: "fugazetta_800g", name: "Fugazetta ~800g", price: 650, available: true },
  { id: "fugazetta_1600g", name: "Fugazetta ~1600g", price: 1200, available: true },
  {
    id: "focaccia_zatar_800g",
    name: "Focaccia sa Za'atar začinom - Za'atar-os focaccia ~750g",
    price: 350,
    available: true,
  },
  { id: "testo_1000g", name: "Pizza testo - Pizza tészta- 1000g", price: 300, available: true },
  { id: "babka", name: "Babka sa čokoladom - Csokis babka - 600g", price: 750, available: true },
  { id: "puz", name: "Puž - Csiga - 75g", price: 90, available: true },
  { id: "tigrasti_hleb", name: "Tigrasti hleb - Tigris kenyér - 1000g", price: 450, available: false },
  { id: "heljda_hleb", name: "Hleb sa heljdom - Hajdinás kenyét - 1000g", price: 450, available: false },
  { id: "pan_cubano", name: "Pan Cubano - 800g", price: 370, available: false },
  { id: "polubeli_hleb", name: "Polubeli hleb - Félfehér kenyér - 1000g", price: 400, available: false },
  {
    id: "hleb_jabuka_ovsene",
    name: "Hleb sa jabukom i ovsenim pahuljicama - Almás-zabkásás kenyér - 1000g",
    price: 450,
    available: false,
  },
  {
    id: "kukuruzni_hleb",
    name: "Hleb sa kukuruznim brašnom - Kukoricás kenyér - 800g",
    price: 350,
    available: false,
  },
  {
    id: "durum_hleb",
    name: "Hleb sa durum pšenicom - Durumbúzás kenyér - 1000g",
    price: 400,
    available: false,
  },
  {
    id: "einkorn_hleb",
    name: "Hleb sa brašnom od jednozrnke - Alakoros kenyér - 900g",
    price: 400,
    available: false,
  },
  {
    id: "bankuti_beli_hleb",
    name: "Bankuti beli hleb - Bánkúti világos kenyér - 900g",
    price: 400,
    available: false,
  },
  { id: "krompir_hleb", name: "Hleb sa krompirom - Krumplis kenyér - 1000g", price: 400, available: false },
  {
    id: "bankuti_cipovka",
    name: 'Cipovka "bankuti" - Bánkúti cipó - 900g',
    price: 400,
    available: false,
  },
  { id: "7zitarica_hleb", name: "Hleb sa 7 žitarica - 7 gabonás kenyér - 900g", price: 400, available: false },
  {
    id: "sremus_hleb",
    name: "Hleb sa sremušem - Medvehagymás kenyér - 900g",
    price: 400,
    available: false,
  },
  {
    id: "int_bankuti_brasno",
    name: 'Integralno brašno "bánkúti" - Bánkúti teljes kiőrlésű liszt - 1000g',
    price: 180,
    available: true,
  },
  {
    id: "int_bankuti__meko_brasno",
    name: "Integralno meko brašno \"bánkúti\" - Bánkúti tk. selymes liszt - 1000g",
    price: 200,
    available: false,
  },
  {
    id: "int_spleta_brasno",
    name: "Integralno brašno od spelte - Teljes kiőrlésű tönkölyliszt - 1000g",
    price: 250,
    available: true,
  },
  {
    id: "int_spleta_meko_brano",
    name: "Intergralno meko brašno od splete - Tk. selymes tönkölyliszt - 1000g",
    price: 300,
    available: true,
  },
];

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.repeatingOrderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.repeatingOrder.deleteMany();
  await prisma.cycle.deleteMany();
  await prisma.article.deleteMany();

  await prisma.article.createMany({ data: articles });

  const now = new Date();
  const opensAt = new Date(now);
  opensAt.setDate(now.getDate() - 2);
  const closesAt = new Date(now);
  closesAt.setDate(now.getDate() + 1);
  const deliveryDate = new Date(now);
  deliveryDate.setDate(now.getDate() + 3);

  const cycle = await prisma.cycle.create({
    data: {
      label: isoWeekLabel(now),
      status: "OPEN",
      orderWindowOpensAt: opensAt,
      orderWindowClosesAt: closesAt,
      deliveryDate,
    },
  });

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

  console.log(`Seeded ${articles.length} articles, 1 open cycle (${cycle.label}), and 3 orders.`);

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
