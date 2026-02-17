import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const passwordHash = await bcrypt.hash("password123", 10);

  const manager = await prisma.user.upsert({
    where: { email: "manager@test.com" },
    update: {},
    create: {
      email: "manager@test.com",
      password_hash: passwordHash,
      first_name: "Marco",
      last_name: "Rossi",
      role: "MANAGER",
    },
  });
  console.log("✅ Manager:", manager.email);

  const operator1 = await prisma.user.upsert({
    where: { email: "operator1@test.com" },
    update: {},
    create: {
      email: "operator1@test.com",
      password_hash: passwordHash,
      first_name: "Anna",
      last_name: "Bianchi",
      role: "OPERATOR",
    },
  });
  console.log("✅ Operatrice:", operator1.email);

  const property1 = await prisma.property.upsert({
    where: { code: "APP001" },
    update: {},
    create: {
      name: "Appartamento Centro",
      code: "APP001",
      address: "Via Roma 15, Milano",
      property_type: "APPARTAMENTO",
    },
  });
  console.log("✅ Immobile:", property1.name);

  await prisma.checklistTemplate.upsert({
    where: { property_id: property1.id },
    update: {},
    create: {
      property_id: property1.id,
      items: [
        { area: "Bagno", description: "Pulire sanitari", photo_required: true },
        { area: "Cucina", description: "Pulire piano cottura", photo_required: true },
        { area: "Camera", description: "Cambiare lenzuola", photo_required: false },
      ],
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.cleaningTask.create({
    data: {
      property_id: property1.id,
      assigned_to: operator1.id,
      scheduled_date: today,
      status: "TODO",
    },
  });

  console.log("\n🎉 Seed completato!");
  console.log("\nCredenziali:");
  console.log("Manager: manager@test.com / password123");
  console.log("Operatrice: operator1@test.com / password123");
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
