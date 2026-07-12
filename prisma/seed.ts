import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Clean existing database records
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

  // Seed 5 Vehicles
  const vehicles = await Promise.all([
    prisma.vehicle.create({
      data: {
        registrationNumber: "TX-1001",
        name: "Kenworth T680",
        type: "Heavy Truck",
        maxLoadCapacity: 15000,
        odometer: 125500,
        acquisitionCost: 145000,
        status: "AVAILABLE",
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: "TX-1002",
        name: "Ford Transit 350",
        type: "Cargo Van",
        maxLoadCapacity: 3500,
        odometer: 45320,
        acquisitionCost: 48000,
        status: "ON_TRIP",
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: "TX-1003",
        name: "Freightliner Cascadia",
        type: "Heavy Truck",
        maxLoadCapacity: 18000,
        odometer: 285000,
        acquisitionCost: 160000,
        status: "IN_SHOP",
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: "TX-1004",
        name: "Toyota Hilux",
        type: "Pickup Truck",
        maxLoadCapacity: 1200,
        odometer: 82150,
        acquisitionCost: 38000,
        status: "AVAILABLE",
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: "TX-1005",
        name: "Peterbilt 579",
        type: "Heavy Truck",
        maxLoadCapacity: 16500,
        odometer: 410000,
        acquisitionCost: 135000,
        status: "AVAILABLE",
      },
    }),
  ]);

  // Seed 5 Drivers
  const driverExpiry1 = new Date();
  driverExpiry1.setFullYear(driverExpiry1.getFullYear() + 2);

  const driverExpiry2 = new Date();
  driverExpiry2.setFullYear(driverExpiry2.getFullYear() + 1);

  const driverExpiry3 = new Date();
  driverExpiry3.setFullYear(driverExpiry3.getFullYear() - 1); // Expired

  const driverExpiry4 = new Date();
  driverExpiry4.setFullYear(driverExpiry4.getFullYear() + 3);

  const driverExpiry5 = new Date();
  driverExpiry5.setMonth(driverExpiry5.getMonth() - 6); // Expired

  const drivers = await Promise.all([
    prisma.driver.create({
      data: {
        name: "Michael Scott",
        licenseNumber: "CDL-876241",
        licenseCategory: "Class A CDL",
        licenseExpiry: driverExpiry1,
        phone: "555-0101",
        safetyScore: 95,
        status: "AVAILABLE",
      },
    }),
    prisma.driver.create({
      data: {
        name: "Dwight Schrute",
        licenseNumber: "CDL-112233",
        licenseCategory: "Class A CDL",
        licenseExpiry: driverExpiry2,
        phone: "555-0102",
        safetyScore: 98,
        status: "ON_TRIP",
      },
    }),
    prisma.driver.create({
      data: {
        name: "Jim Halpert",
        licenseNumber: "CDL-998877",
        licenseCategory: "Class B CDL",
        licenseExpiry: driverExpiry3,
        phone: "555-0103",
        safetyScore: 88,
        status: "AVAILABLE",
      },
    }),
    prisma.driver.create({
      data: {
        name: "Pam Beesly",
        licenseNumber: "CDL-445566",
        licenseCategory: "Class B CDL",
        licenseExpiry: driverExpiry4,
        phone: "555-0104",
        safetyScore: 92,
        status: "AVAILABLE",
      },
    }),
    prisma.driver.create({
      data: {
        name: "Ryan Howard",
        licenseNumber: "CDL-334455",
        licenseCategory: "Class C CDL",
        licenseExpiry: driverExpiry5,
        phone: "555-0105",
        safetyScore: 60,
        status: "SUSPENDED",
      },
    }),
  ]);

  // Seed 6 Trips across all statuses
  // Trip 1 – COMPLETED (Mumbai → Pune)
  await prisma.trip.create({
    data: {
      source: "Mumbai",
      destination: "Pune",
      cargoWeight: 8500,
      plannedDistance: 150,
      actualDistance: 155,
      fuelUsed: 38,
      revenue: 24000,
      startOdometer: 124900,
      endOdometer: 125055,
      status: "COMPLETED",
      vehicleId: vehicles[0].id,
      driverId: drivers[0].id,
    },
  });

  // Trip 2 – COMPLETED (Delhi → Jaipur)
  await prisma.trip.create({
    data: {
      source: "Delhi",
      destination: "Jaipur",
      cargoWeight: 3200,
      plannedDistance: 280,
      actualDistance: 275,
      fuelUsed: 52,
      revenue: 18500,
      startOdometer: 44820,
      endOdometer: 45095,
      status: "COMPLETED",
      vehicleId: vehicles[3].id,
      driverId: drivers[3].id,
    },
  });

  // Trip 3 – DISPATCHED (Chennai → Bangalore)
  await prisma.trip.create({
    data: {
      source: "Chennai",
      destination: "Bangalore",
      cargoWeight: 2800,
      plannedDistance: 350,
      startOdometer: 45100,
      status: "DISPATCHED",
      vehicleId: vehicles[1].id,
      driverId: drivers[1].id,
    },
  });

  // Trip 4 – DRAFT (Hyderabad → Nagpur)
  await prisma.trip.create({
    data: {
      source: "Hyderabad",
      destination: "Nagpur",
      cargoWeight: 12000,
      plannedDistance: 500,
      status: "DRAFT",
      vehicleId: vehicles[4].id,
      driverId: drivers[0].id,
    },
  });

  // Trip 5 – CANCELLED (Ahmedabad → Surat)
  await prisma.trip.create({
    data: {
      source: "Ahmedabad",
      destination: "Surat",
      cargoWeight: 900,
      plannedDistance: 265,
      status: "CANCELLED",
      vehicleId: vehicles[3].id,
      driverId: drivers[2].id,
    },
  });

  // Trip 6 – COMPLETED (Kolkata → Bhubaneswar)
  await prisma.trip.create({
    data: {
      source: "Kolkata",
      destination: "Bhubaneswar",
      cargoWeight: 14200,
      plannedDistance: 440,
      actualDistance: 450,
      fuelUsed: 95,
      revenue: 38000,
      startOdometer: 409500,
      endOdometer: 409950,
      status: "COMPLETED",
      vehicleId: vehicles[4].id,
      driverId: drivers[3].id,
    },
  });

  console.log("✅ Database seeded with users, vehicles, drivers, and 6 trips.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });