import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Clean existing database records
  await prisma.maintenance.deleteMany({});
  await prisma.fuelLog.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.trip.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.driver.deleteMany({});

  // Seed Admin User
  const password = await bcrypt.hash("admin123", 10);
  await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@test.com",
      password,
      role: "ADMIN",
    },
  });

  // Demo RBAC users
  const mkHash = (p: string) => bcrypt.hash(p, 10);
  await Promise.all([
    prisma.user.create({ data: { name: "Raven K.", email: "raven@transitops.in", password: await mkHash("fleet123"), role: "FLEET_MANAGER" } }),
    prisma.user.create({ data: { name: "Alex T.",  email: "alex@transitops.in",  password: await mkHash("disp123"),  role: "DISPATCHER" } }),
    prisma.user.create({ data: { name: "Priya M.", email: "priya@transitops.in", password: await mkHash("safe123"),  role: "SAFETY_OFFICER" } }),
    prisma.user.create({ data: { name: "John F.",  email: "john@transitops.in",  password: await mkHash("fin123"),   role: "FINANCE" } }),
  ]);

  // Seed exactly 1 Sample Vehicle
  const vehicle = await prisma.vehicle.create({
    data: {
      registrationNumber: "MH-12-PQ-5678",
      name: "Tata Prima 4038.S",
      type: "Heavy Truck",
      maxLoadCapacity: 15000,
      odometer: 125500,
      acquisitionCost: 3500000,
      status: "AVAILABLE",
    },
  });

  // Seed exactly 1 Sample Driver
  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + 2);
  const driver = await prisma.driver.create({
    data: {
      name: "Rajesh Sharma",
      licenseNumber: "MH12 20180012345",
      licenseCategory: "Heavy Motor Vehicle (HMV)",
      licenseExpiry: expiry,
      phone: "+91 98765 43210",
      safetyScore: 95,
      status: "AVAILABLE",
    },
  });

  // Seed exactly 1 Sample Trip (COMPLETED)
  const tripDate = new Date();
  await prisma.trip.create({
    data: {
      source: "Mumbai",
      destination: "Pune",
      cargoWeight: 8500,
      plannedDistance: 150,
      actualDistance: 155,
      fuelUsed: 38,
      revenue: 24000,
      startOdometer: 125345,
      endOdometer: 125500,
      status: "COMPLETED",
      vehicleId: vehicle.id,
      driverId: driver.id,
      createdAt: tripDate,
    },
  });

  // Seed exactly 1 Sample Maintenance record
  await prisma.maintenance.create({
    data: {
      title: "Annual Safety Check",
      description: "Brake alignment, engine tuning and oil change",
      cost: 3500,
      status: "CLOSED",
      vehicleId: vehicle.id,
      closedAt: new Date(),
    },
  });

  // Seed exactly 1 Sample FuelLog record (₹ 95 per liter)
  await prisma.fuelLog.create({
    data: {
      liters: 38,
      cost: 3610,
      vehicleId: vehicle.id,
    },
  });

  // Seed exactly 1 Sample Expense record (Tolls on the trip route)
  await prisma.expense.create({
    data: {
      type: "TOLL",
      amount: 750,
      description: "Toll plaza charges",
      date: tripDate,
      vehicleId: vehicle.id,
    },
  });

  console.log("✅ Database seeded with users, vehicles, drivers, trips, maintenance, and fuel logs.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });