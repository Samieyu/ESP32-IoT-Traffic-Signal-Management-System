import { PrismaClient, Role, AccountStatus, IntersectionStatus, ConnectionStatus, SignalColor, OperatingMode, ConfigurationStatus, DeliveryStatus, IncidentType, SeverityLevel, IncidentStatus, ProblemCategory, ProblemStatus, NotificationDeliveryStatus, EmergencyDirection, EmergencyMovement, EmergencyStatus, NotificationCategory, NotificationSeverity } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Prisma Database Seed for PostgreSQL...');

  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 10);
  const officerPasswordHash = await bcrypt.hash('OfficerPassword123!', 10);

  // Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@traffic.wcu.edu.et' },
    update: {},
    create: {
      email: 'admin@traffic.wcu.edu.et',
      username: 'admin',
      passwordHash: adminPasswordHash,
      fullName: 'Mesay Aschalew (Administrator)',
      phoneNumber: '+251911002233',
      role: Role.ADMIN,
      status: AccountStatus.ACTIVE,
    },
  });

  // Traffic Police Officers
  const officer1 = await prisma.user.upsert({
    where: { email: 'officer.mesay@traffic.wcu.edu.et' },
    update: {},
    create: {
      email: 'officer.mesay@traffic.wcu.edu.et',
      username: 'officer_mesay',
      passwordHash: officerPasswordHash,
      fullName: 'Officer Mesay Haile',
      phoneNumber: '+251911223344',
      role: Role.TRAFFIC_POLICE,
      status: AccountStatus.ACTIVE,
    },
  });

  const officer2 = await prisma.user.upsert({
    where: { email: 'officer.abebe@traffic.wcu.edu.et' },
    update: {},
    create: {
      email: 'officer.abebe@traffic.wcu.edu.et',
      username: 'officer_abebe',
      passwordHash: officerPasswordHash,
      fullName: 'Officer Abebe Kebede',
      phoneNumber: '+251912334455',
      role: Role.TRAFFIC_POLICE,
      status: AccountStatus.ACTIVE,
    },
  });

  // Inactive officer for policy test
  await prisma.user.upsert({
    where: { email: 'officer.inactive@traffic.wcu.edu.et' },
    update: {},
    create: {
      email: 'officer.inactive@traffic.wcu.edu.et',
      username: 'officer_inactive',
      passwordHash: officerPasswordHash,
      fullName: 'Officer Inactive (Policy Test)',
      phoneNumber: '+251913445566',
      role: Role.TRAFFIC_POLICE,
      status: AccountStatus.INACTIVE,
    },
  });

  // Intersections
  const int1 = await prisma.intersection.upsert({
    where: { code: 'INT-WCU-001' },
    update: {},
    create: {
      code: 'INT-WCU-001',
      name: 'Wachemo University Main Gate Crossroads',
      description: 'Major intersection connecting Wachemo University main gate with Hosanna arterial highway.',
      region: 'Central Ethiopia',
      city: 'Hosanna',
      latitude: 8.020015,
      longitude: 37.850024,
      approachesCount: 4,
      status: IntersectionStatus.ACTIVE,
    },
  });

  const int2 = await prisma.intersection.upsert({
    where: { code: 'INT-HOS-002' },
    update: {},
    create: {
      code: 'INT-HOS-002',
      name: 'Hosanna Central Commercial Square',
      description: 'High-density commercial roundabout intersection in downtown Hosanna.',
      region: 'Central Ethiopia',
      city: 'Hosanna',
      latitude: 8.015042,
      longitude: 37.855011,
      approachesCount: 4,
      status: IntersectionStatus.ACTIVE,
    },
  });

  const int3 = await prisma.intersection.upsert({
    where: { code: 'INT-HOS-003' },
    update: {},
    create: {
      code: 'INT-HOS-003',
      name: 'Hosanna Intercity Bus Terminal Junction',
      description: 'Junction connecting regional bus terminals to southern transit corridors.',
      region: 'Central Ethiopia',
      city: 'Hosanna',
      latitude: 8.012011,
      longitude: 37.860045,
      approachesCount: 4,
      status: IntersectionStatus.INACTIVE,
    },
  });

  // Assignments
  await prisma.intersectionAssignment.createMany({
    data: [
      {
        userId: officer1.id,
        intersectionId: int1.id,
        status: AccountStatus.ACTIVE,
        assignedBy: 'System Administrator',
      },
      {
        userId: officer1.id,
        intersectionId: int2.id,
        status: AccountStatus.ACTIVE,
        assignedBy: 'System Administrator',
      },
      {
        userId: officer2.id,
        intersectionId: int2.id,
        status: AccountStatus.ACTIVE,
        assignedBy: 'System Administrator',
      },
    ],
    skipDuplicates: true,
  });

  // Controllers
  await prisma.trafficController.upsert({
    where: { deviceId: 'ESP32-WCU-001' },
    update: {},
    create: {
      deviceId: 'ESP32-WCU-001',
      intersectionId: int1.id,
      firmwareVersion: '1.2.0-wcu',
      hardwareType: 'ESP32-WROOM-32',
      connectionStatus: ConnectionStatus.ONLINE,
      lastHeartbeatAt: new Date(),
      lastStatusAt: new Date(),
      ipAddress: '192.168.1.150',
      macAddress: '24:6F:28:B2:A1:10',
    },
  });

  await prisma.trafficController.upsert({
    where: { deviceId: 'ESP32-HOS-002' },
    update: {},
    create: {
      deviceId: 'ESP32-HOS-002',
      intersectionId: int2.id,
      firmwareVersion: '1.2.0-wcu',
      hardwareType: 'ESP32-WROOM-32',
      connectionStatus: ConnectionStatus.ONLINE,
      lastHeartbeatAt: new Date(),
      lastStatusAt: new Date(),
      ipAddress: '192.168.1.151',
      macAddress: '24:6F:28:B2:A1:12',
    },
  });

  await prisma.trafficController.upsert({
    where: { deviceId: 'ESP32-HOS-003' },
    update: {},
    create: {
      deviceId: 'ESP32-HOS-003',
      intersectionId: int3.id,
      firmwareVersion: '1.1.0-wcu',
      hardwareType: 'ESP32-WROOM-32',
      connectionStatus: ConnectionStatus.OFFLINE,
      lastHeartbeatAt: new Date(Date.now() - 3600000 * 4),
      lastStatusAt: new Date(Date.now() - 3600000 * 4),
      ipAddress: '192.168.1.152',
      macAddress: '24:6F:28:B2:A1:14',
    },
  });

  // Configuration
  const cfg1 = await prisma.signalConfiguration.create({
    data: {
      intersectionId: int1.id,
      version: 1,
      northSouthGreenDuration: 35,
      eastWestGreenDuration: 30,
      yellowDuration: 4,
      allRedClearanceDuration: 2,
      maxEmergencyPriorityDuration: 60,
      lcdEnabled: true,
      lcdDisplayMode: 'COUNTDOWN_AND_PHASE',
      lcdCustomMessage: 'Wachemo Univ Safe Crossing',
      countdownDisplayEnabled: true,
      status: ConfigurationStatus.ACTIVE,
      createdById: admin.id,
    },
  });

  await prisma.configurationDelivery.create({
    data: {
      configurationId: cfg1.id,
      deviceId: 'ESP32-WCU-001',
      deliveryStatus: DeliveryStatus.ACKNOWLEDGED,
      acknowledgmentPayload: JSON.stringify({ status: 'SUCCESS', version: 1 }),
      sentAt: new Date(),
      acknowledgedAt: new Date(),
    },
  });

  console.log('✅ PostgreSQL database seeded successfully with Admin, Officers, and Intersections!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
