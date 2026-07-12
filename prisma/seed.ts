import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

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

  // Seed 5 Vehicles
  const vehicles = await Promise.all([
    prisma.vehicle.create({
      data: {
        registrationNumber: "MH-12-PQ-5678",
        name: "Tata Prima 4038.S",
        type: "Heavy Truck",
        maxLoadCapacity: 15000,
        odometer: 125500,
        acquisitionCost: 3500000,
        status: "AVAILABLE",
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: "DL-1C-AA-1234",
        name: "Tata Ace Gold",
        type: "Mini Truck",
        maxLoadCapacity: 3500,
        odometer: 45320,
        acquisitionCost: 550000,
        status: "ON_TRIP",
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: "KA-03-MM-9012",
        name: "BharatBenz 3523R",
        type: "Heavy Truck",
        maxLoadCapacity: 18000,
        odometer: 285000,
        acquisitionCost: 4200000,
        status: "IN_SHOP",
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: "HR-55-XY-8888",
        name: "Mahindra Bolero Pickup",
        type: "Pickup Truck",
        maxLoadCapacity: 1200,
        odometer: 82150,
        acquisitionCost: 900000,
        status: "AVAILABLE",
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: "GJ-01-AB-9999",
        name: "Ashok Leyland Partner",
        type: "Light Truck",
        maxLoadCapacity: 16500,
        odometer: 410000,
        acquisitionCost: 1400000,
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
        name: "Rajesh Sharma",
        licenseNumber: "MH12 20180012345",
        licenseCategory: "Heavy Motor Vehicle (HMV)",
        licenseExpiry: driverExpiry1,
        phone: "+91 98765 43210",
        safetyScore: 95,
        status: "AVAILABLE",
      },
    }),
    prisma.driver.create({
      data: {
        name: "Harpreet Singh",
        licenseNumber: "DL14 20190054321",
        licenseCategory: "Heavy Motor Vehicle (HMV)",
        licenseExpiry: driverExpiry2,
        phone: "+91 99887 76655",
        safetyScore: 98,
        status: "ON_TRIP",
      },
    }),
    prisma.driver.create({
      data: {
        name: "Vijay Yadav",
        licenseNumber: "KA03 20200098765",
        licenseCategory: "Medium Passenger Vehicle (MPV)",
        licenseExpiry: driverExpiry3,
        phone: "+91 88776 65544",
        safetyScore: 88,
        status: "AVAILABLE",
      },
    }),
    prisma.driver.create({
      data: {
        name: "Amit Patel",
        licenseNumber: "GJ01 20210043210",
        licenseCategory: "Light Motor Vehicle (LMV)",
        licenseExpiry: driverExpiry4,
        phone: "+91 77665 54433",
        safetyScore: 92,
        status: "AVAILABLE",
      },
    }),
    prisma.driver.create({
      data: {
        name: "Suresh Kumar",
        licenseNumber: "HR55 20170022334",
        licenseCategory: "Heavy Motor Vehicle (HMV)",
        licenseExpiry: driverExpiry5,
        phone: "+91 66554 43322",
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

  // Seed Maintenance records
  await prisma.maintenance.createMany({
    data: [
      {
        title: "Annual Safety Check",
        description: "Brake alignment, engine tuning and oil change",
        cost: 3500,
        status: "ACTIVE",
        vehicleId: vehicles[0].id,
      },
      {
        title: "Tire Replacement",
        description: "Replaced front tires",
        cost: 9000,
        status: "CLOSED",
        vehicleId: vehicles[2].id,
        closedAt: new Date(),
      },
    ],
  });

  // Seed FuelLog records
  await prisma.fuelLog.createMany({
    data: [
      {
        liters: 40,
        cost: 480,
        vehicleId: vehicles[0].id,
      },
      {
        liters: 30,
        cost: 360,
        vehicleId: vehicles[1].id,
      },
      {
        liters: 120,
        cost: 1440,
        vehicleId: vehicles[4].id,
      },
    ],
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