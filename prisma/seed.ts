import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Clean existing database records
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

  // Seed 5 Vehicles
  await prisma.vehicle.createMany({
    data: [
      {
        registrationNumber: "TX-1001",
        name: "Kenworth T680",
        type: "Heavy Truck",
        maxLoadCapacity: 15000,
        odometer: 125000,
        acquisitionCost: 145000,
        status: "AVAILABLE",
      },
      {
        registrationNumber: "TX-1002",
        name: "Ford Transit 350",
        type: "Cargo Van",
        maxLoadCapacity: 3500,
        odometer: 45000,
        acquisitionCost: 48000,
        status: "ON_TRIP",
      },
      {
        registrationNumber: "TX-1003",
        name: "Freightliner Cascadia",
        type: "Heavy Truck",
        maxLoadCapacity: 18000,
        odometer: 285000,
        acquisitionCost: 160000,
        status: "IN_SHOP",
      },
      {
        registrationNumber: "TX-1004",
        name: "Toyota Hilux",
        type: "Pickup Truck",
        maxLoadCapacity: 1200,
        odometer: 82000,
        acquisitionCost: 38000,
        status: "AVAILABLE",
      },
      {
        registrationNumber: "TX-1005",
        name: "Peterbilt 579",
        type: "Heavy Truck",
        maxLoadCapacity: 16500,
        odometer: 410000,
        acquisitionCost: 135000,
        status: "RETIRED",
      },
    ],
  });

  // Seed 5 Drivers
  const driverExpiry1 = new Date();
  driverExpiry1.setFullYear(driverExpiry1.getFullYear() + 2); // Valid (2 years out)

  const driverExpiry2 = new Date();
  driverExpiry2.setFullYear(driverExpiry2.getFullYear() + 1); // Valid (1 year out)

  const driverExpiry3 = new Date();
  driverExpiry3.setFullYear(driverExpiry3.getFullYear() - 1); // Expired (1 year ago)

  const driverExpiry4 = new Date();
  driverExpiry4.setFullYear(driverExpiry4.getFullYear() + 3); // Valid (3 years out)

  const driverExpiry5 = new Date();
  driverExpiry5.setMonth(driverExpiry5.getMonth() - 6); // Expired (6 months ago)

  await prisma.driver.createMany({
    data: [
      {
        name: "Michael Scott",
        licenseNumber: "CDL-876241",
        licenseCategory: "Class A CDL",
        licenseExpiry: driverExpiry1,
        phone: "555-0101",
        safetyScore: 95,
        status: "AVAILABLE",
      },
      {
        name: "Dwight Schrute",
        licenseNumber: "CDL-112233",
        licenseCategory: "Class A CDL",
        licenseExpiry: driverExpiry2,
        phone: "555-0102",
        safetyScore: 98,
        status: "AVAILABLE",
      },
      {
        name: "Jim Halpert",
        licenseNumber: "CDL-998877",
        licenseCategory: "Class B CDL",
        licenseExpiry: driverExpiry3,
        phone: "555-0103",
        safetyScore: 88,
        status: "AVAILABLE",
      },
      {
        name: "Pam Beesly",
        licenseNumber: "CDL-445566",
        licenseCategory: "Class B CDL",
        licenseExpiry: driverExpiry4,
        phone: "555-0104",
        safetyScore: 92,
        status: "ON_TRIP",
      },
      {
        name: "Ryan Howard",
        licenseNumber: "CDL-334455",
        licenseCategory: "Class C CDL",
        licenseExpiry: driverExpiry5,
        phone: "555-0105",
        safetyScore: 60,
        status: "SUSPENDED",
      },
    ],
  });

  console.log("Database seeded successfully with users, vehicles, and drivers.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });