import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const passwordHash = await bcrypt.hash("password123", 10);

  // --- Users ---
  const manager = await prisma.user.upsert({
    where: { email: "manager@test.com" },
    update: {
      is_super_admin: true,
      can_manage_leads: true,
      can_do_analysis: true,
      can_manage_operations: true,
      can_manage_finance: true,
      can_manage_team: true,
      can_manage_onboarding: true,
    },
    create: {
      email: "manager@test.com",
      password_hash: passwordHash,
      first_name: "Marco",
      last_name: "Rossi",
      role: "MANAGER",
      is_super_admin: true,
      can_manage_leads: true,
      can_do_analysis: true,
      can_manage_operations: true,
      can_manage_finance: true,
      can_manage_team: true,
      can_manage_onboarding: true,
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

  // --- Property ---
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

  // --- Checklist template ---
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

  // --- External Contacts ---
  const plumber = await prisma.externalContact.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Luigi Verdi",
      phone: "+39 333 1234567",
      email: "luigi.verdi@example.com",
      company: "Verdi Idraulica Srl",
      category: "PLUMBER",
      notes: "Disponibile dal lunedì al venerdì, 8-18",
    },
  });
  console.log("✅ External contact:", plumber.name);

  const electrician = await prisma.externalContact.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Paolo Neri",
      phone: "+39 340 7654321",
      company: "Neri Impianti Elettrici",
      category: "ELECTRICIAN",
    },
  });
  console.log("✅ External contact:", electrician.name);

  // --- PropertyMasterFile ---
  await prisma.propertyMasterFile.upsert({
    where: { property_id: property1.id },
    update: {},
    create: {
      property_id: property1.id,
      plumber_name: plumber.name,
      plumber_phone: plumber.phone,
      electrician_name: electrician.name,
      electrician_phone: electrician.phone,
      cleaner_notes: "Usare prodotti eco per il bagno",
      cadastral_id: "F205-12345",
      tourism_license: "CIR-MI-001234",
    },
  });
  console.log("✅ MasterFile per:", property1.name);

  // --- PropertyInventoryItem ---
  const inventoryItems = [
    { room: "Cucina", name: "Frigorifero", brand: "Samsung", model: "RB34T", serial_number: "SN-001" },
    { room: "Cucina", name: "Lavastoviglie", brand: "Bosch", model: "SMS46", serial_number: "SN-002" },
    { room: "Bagno", name: "Lavatrice", brand: "LG", model: "F4WV3", serial_number: "SN-003" },
    { room: "Soggiorno", name: "TV 55 pollici", brand: "LG", model: "55UP7500", serial_number: "SN-004" },
  ];

  console.log("✅ Inventory items definiti:", inventoryItems.length);

  // --- SupplyItems + PropertySupplyStock ---
  const supplyItem1 = await prisma.supplyItem.upsert({
    where: { sku: "DET-001" },
    update: {},
    create: {
      name: "Detersivo bagno",
      sku: "DET-001",
      unit: "pz",
    },
  });

  const supplyItem2 = await prisma.supplyItem.upsert({
    where: { sku: "SAP-001" },
    update: {},
    create: {
      name: "Sapone mani",
      sku: "SAP-001",
      unit: "pz",
    },
  });

  // InventoryBalance for supply items
  await prisma.inventoryBalance.upsert({
    where: { supply_item_id: supplyItem1.id },
    update: {},
    create: { supply_item_id: supplyItem1.id, qty_on_hand: 20, reorder_point: 5 },
  });
  await prisma.inventoryBalance.upsert({
    where: { supply_item_id: supplyItem2.id },
    update: {},
    create: { supply_item_id: supplyItem2.id, qty_on_hand: 15, reorder_point: 5 },
  });

  // PropertySupplyStock linked to property
  await prisma.propertySupplyStock.upsert({
    where: { property_id_supply_item_id: { property_id: property1.id, supply_item_id: supplyItem1.id } },
    update: {},
    create: {
      property_id: property1.id,
      supply_item_id: supplyItem1.id,
      qty_current: 3,
      qty_standard: 5,
      low_threshold: 1,
    },
  });
  await prisma.propertySupplyStock.upsert({
    where: { property_id_supply_item_id: { property_id: property1.id, supply_item_id: supplyItem2.id } },
    update: {},
    create: {
      property_id: property1.id,
      supply_item_id: supplyItem2.id,
      qty_current: 2,
      qty_standard: 3,
      low_threshold: 1,
    },
  });
  console.log("✅ PropertySupplyStock collegati");

  // --- DothouseBooking ---
  const checkinDate = new Date();
  checkinDate.setDate(checkinDate.getDate() + 3);
  checkinDate.setHours(0, 0, 0, 0);

  const checkoutDate = new Date(checkinDate);
  checkoutDate.setDate(checkoutDate.getDate() + 5);

  const booking = await prisma.dothouseBooking.upsert({
    where: { external_id: "DOTB-SEED-001" },
    update: {},
    create: {
      property_id: property1.id,
      external_id: "DOTB-SEED-001",
      guest_name: "Mario Bianchi",
      checkin_date: checkinDate,
      checkout_date: checkoutDate,
      guests_count: 2,
      platform: "Airbnb",
      status: "confirmed",
      sync_status: "synced",
      synced_at: new Date(),
    },
  });
  console.log("✅ DothouseBooking:", booking.external_id);

  // --- Tasks (clean up previous seed runs) ---
  await prisma.task.deleteMany({ where: { property_id: property1.id } });
  await prisma.propertyInventoryItem.deleteMany({ where: { property_id: property1.id } });

  // Re-create inventory items after cleanup
  for (const item of inventoryItems) {
    await prisma.propertyInventoryItem.create({
      data: { property_id: property1.id, ...item, condition: "GOOD" },
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Cleaning task (original seed)
  await prisma.task.create({
    data: {
      property_id: property1.id,
      assigned_to: operator1.id,
      scheduled_date: today,
      status: "TODO",
      task_type: "CLEANING",
      assignee_type: "INTERNAL",
    },
  });
  console.log("✅ Task CLEANING creato");

  // Maintenance task assigned to external contact
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  await prisma.task.create({
    data: {
      property_id: property1.id,
      scheduled_date: tomorrow,
      status: "TODO",
      task_type: "MAINTENANCE",
      title: "Riparazione perdita bagno",
      assignee_type: "EXTERNAL",
      external_assignee_id: plumber.id,
      notes: "Perdita sotto il lavandino del bagno principale",
    },
  });
  console.log("✅ Task MAINTENANCE (external) creato");

  // Key handover task assigned internally
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 3);

  await prisma.task.create({
    data: {
      property_id: property1.id,
      assigned_to: operator1.id,
      scheduled_date: dayAfter,
      status: "TODO",
      task_type: "KEY_HANDOVER",
      title: "Consegna chiavi ospite Bianchi",
      assignee_type: "INTERNAL",
      dotthouse_booking_id: booking.id,
      notes: "Check-in ore 15:00",
    },
  });
  console.log("✅ Task KEY_HANDOVER (internal) creato");

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
