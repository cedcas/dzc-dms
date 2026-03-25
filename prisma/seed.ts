import {
  PrismaClient,
  UserRole,
  ClientStatus,
  DebtAccountStatus,
  OfferDirection,
  OfferStatus,
  ActivityType,
  TaskStatus,
  TaskPriority,
} from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ── Users ──────────────────────────────────────────────────────────────────

  const [adminPw, negotiatorPw, intakePw] = await Promise.all([
    hash("admin1234", 12),
    hash("negotiator1234", 12),
    hash("intake1234", 12),
  ]);

  const admin = await prisma.user.upsert({
    where: { email: "admin@dzc.internal" },
    update: {},
    create: {
      email: "admin@dzc.internal",
      name: "Admin User",
      password: adminPw,
      role: UserRole.ADMIN,
    },
  });

  const negotiator = await prisma.user.upsert({
    where: { email: "negotiator@dzc.internal" },
    update: {},
    create: {
      email: "negotiator@dzc.internal",
      name: "Maria Santos",
      password: negotiatorPw,
      role: UserRole.NEGOTIATOR,
    },
  });

  const intake = await prisma.user.upsert({
    where: { email: "intake@dzc.internal" },
    update: {},
    create: {
      email: "intake@dzc.internal",
      name: "James Rivera",
      password: intakePw,
      role: UserRole.INTAKE,
    },
  });

  // ── Creditors ──────────────────────────────────────────────────────────────

  const chase = await prisma.creditor.upsert({
    where: { id: "creditor-chase" },
    update: {},
    create: {
      id: "creditor-chase",
      name: "Chase Bank",
      phone: "1-800-432-3117",
      website: "chase.com",
    },
  });

  const capitalOne = await prisma.creditor.upsert({
    where: { id: "creditor-capone" },
    update: {},
    create: {
      id: "creditor-capone",
      name: "Capital One",
      phone: "1-800-227-4825",
      website: "capitalone.com",
    },
  });

  const discover = await prisma.creditor.upsert({
    where: { id: "creditor-discover" },
    update: {},
    create: {
      id: "creditor-discover",
      name: "Discover Financial",
      phone: "1-800-347-2683",
      website: "discover.com",
    },
  });

  const synchrony = await prisma.creditor.upsert({
    where: { id: "creditor-synchrony" },
    update: {},
    create: {
      id: "creditor-synchrony",
      name: "Synchrony Bank",
      phone: "1-866-226-5638",
      website: "synchronybank.com",
    },
  });

  // ── Clients ────────────────────────────────────────────────────────────────

  const client1 = await prisma.client.upsert({
    where: { email: "john.doe@example.com" },
    update: {},
    create: {
      email: "john.doe@example.com",
      firstName: "John",
      lastName: "Doe",
      phone: "555-101-0001",
      address: "123 Main St, Dallas, TX 75201",
      status: ClientStatus.ACTIVE,
      programStartDate: new Date("2025-09-01"),
      handlerId: negotiator.id,
    },
  });

  const client2 = await prisma.client.upsert({
    where: { email: "sara.lee@example.com" },
    update: {},
    create: {
      email: "sara.lee@example.com",
      firstName: "Sara",
      lastName: "Lee",
      phone: "555-202-0002",
      address: "456 Oak Ave, Houston, TX 77001",
      status: ClientStatus.ONBOARDING,
      handlerId: intake.id,
    },
  });

  const client3 = await prisma.client.upsert({
    where: { email: "mike.chen@example.com" },
    update: {},
    create: {
      email: "mike.chen@example.com",
      firstName: "Mike",
      lastName: "Chen",
      phone: "555-303-0003",
      address: "789 Elm Blvd, Austin, TX 78701",
      status: ClientStatus.ACTIVE,
      programStartDate: new Date("2025-11-15"),
      handlerId: negotiator.id,
    },
  });

  // ── Debt Accounts ──────────────────────────────────────────────────────────

  // John Doe — 2 accounts
  const jd_chase = await prisma.debtAccount.create({
    data: {
      accountNumber: "****4421",
      originalBalance: 8500.0,
      currentBalance: 9120.5,
      status: DebtAccountStatus.IN_NEGOTIATION,
      openedAt: new Date("2019-03-01"),
      clientId: client1.id,
      creditorId: chase.id,
    },
  });

  const jd_capone = await prisma.debtAccount.create({
    data: {
      accountNumber: "****7782",
      originalBalance: 4200.0,
      currentBalance: 4800.0,
      status: DebtAccountStatus.ACTIVE,
      openedAt: new Date("2020-07-15"),
      clientId: client1.id,
      creditorId: capitalOne.id,
    },
  });

  // Sara Lee — 1 account
  const sl_discover = await prisma.debtAccount.create({
    data: {
      accountNumber: "****3309",
      originalBalance: 6100.0,
      currentBalance: 6100.0,
      status: DebtAccountStatus.ACTIVE,
      openedAt: new Date("2021-01-20"),
      clientId: client2.id,
      creditorId: discover.id,
    },
  });

  // Mike Chen — 2 accounts
  const mc_synchrony = await prisma.debtAccount.create({
    data: {
      accountNumber: "****1155",
      originalBalance: 3200.0,
      currentBalance: 3450.0,
      status: DebtAccountStatus.IN_NEGOTIATION,
      openedAt: new Date("2020-05-10"),
      clientId: client3.id,
      creditorId: synchrony.id,
    },
  });

  const mc_chase = await prisma.debtAccount.create({
    data: {
      accountNumber: "****8863",
      originalBalance: 11000.0,
      currentBalance: 11000.0,
      status: DebtAccountStatus.ACTIVE,
      openedAt: new Date("2018-11-01"),
      clientId: client3.id,
      creditorId: chase.id,
    },
  });

  // ── Negotiation Activities ─────────────────────────────────────────────────

  await prisma.negotiationActivity.createMany({
    data: [
      {
        type: ActivityType.CALL,
        notes:
          "Called Chase collections department. Account confirmed eligible for settlement. Rep said best offer is 60%.",
        occurredAt: new Date("2026-01-10T14:30:00Z"),
        debtAccountId: jd_chase.id,
        authorId: negotiator.id,
      },
      {
        type: ActivityType.OFFER_SENT,
        notes: "Sent written settlement offer of 40% ($3,648.20) via certified mail.",
        occurredAt: new Date("2026-01-15T09:00:00Z"),
        debtAccountId: jd_chase.id,
        authorId: negotiator.id,
      },
      {
        type: ActivityType.CALL,
        notes:
          "Follow-up call on sent offer. Chase rep says offer is under review. Expected response in 10 business days.",
        occurredAt: new Date("2026-01-28T11:00:00Z"),
        debtAccountId: jd_chase.id,
        authorId: negotiator.id,
      },
      {
        type: ActivityType.CALL,
        notes: "Synchrony initial contact. Account is 180 days past due. Rep indicated 50% settlement possible.",
        occurredAt: new Date("2026-02-05T10:15:00Z"),
        debtAccountId: mc_synchrony.id,
        authorId: negotiator.id,
      },
      {
        type: ActivityType.INTERNAL_NOTE,
        notes: "Sara Lee onboarding documents received. Hardship letter drafted. Pending client review.",
        occurredAt: new Date("2026-03-01T08:00:00Z"),
        debtAccountId: sl_discover.id,
        authorId: intake.id,
      },
    ],
  });

  // ── Offers ─────────────────────────────────────────────────────────────────

  await prisma.offer.createMany({
    data: [
      {
        direction: OfferDirection.OUTGOING,
        amount: 3648.2, // ~40% of $9,120.50
        status: OfferStatus.PENDING,
        expiresAt: new Date("2026-03-01"),
        notes: "Initial offer at 40%. Sent certified mail 2026-01-15.",
        debtAccountId: jd_chase.id,
      },
      {
        direction: OfferDirection.INCOMING,
        amount: 5472.3, // 60% counter from Chase
        status: OfferStatus.COUNTERED,
        respondedAt: new Date("2026-02-10"),
        notes: "Chase countered at 60%. Reviewing with client.",
        debtAccountId: jd_chase.id,
      },
      {
        direction: OfferDirection.OUTGOING,
        amount: 1380.0, // ~40% of $3,450
        status: OfferStatus.PENDING,
        expiresAt: new Date("2026-04-01"),
        notes: "First offer to Synchrony at 40%.",
        debtAccountId: mc_synchrony.id,
      },
    ],
  });

  // ── Tasks ──────────────────────────────────────────────────────────────────

  await prisma.task.createMany({
    data: [
      {
        title: "Respond to Chase counter-offer",
        description:
          "Client approved counter at 50%. Draft acceptance letter and send to Chase.",
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        dueDate: new Date("2026-03-28"),
        clientId: client1.id,
        debtAccountId: jd_chase.id,
        assignedToId: negotiator.id,
        createdById: admin.id,
      },
      {
        title: "Complete Sara Lee enrollment packet",
        description:
          "Collect signed hardship letter, budget worksheet, and copy of ID.",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        dueDate: new Date("2026-03-31"),
        clientId: client2.id,
        assignedToId: intake.id,
        createdById: admin.id,
      },
      {
        title: "Follow up on Synchrony offer",
        description: "No response after 30 days. Call collections and ask for status.",
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        dueDate: new Date("2026-04-05"),
        clientId: client3.id,
        debtAccountId: mc_synchrony.id,
        assignedToId: negotiator.id,
        createdById: negotiator.id,
      },
      {
        title: "Enroll Mike Chen Capital One account",
        description:
          "Client has a Chase account not yet in negotiation. Verify balance and add to program.",
        status: TaskStatus.TODO,
        priority: TaskPriority.LOW,
        clientId: client3.id,
        debtAccountId: mc_chase.id,
        assignedToId: intake.id,
        createdById: admin.id,
      },
      {
        title: "Monthly performance review — March 2026",
        description: "Review all active negotiations, settled accounts, and pipeline.",
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        dueDate: new Date("2026-03-31"),
        assignedToId: admin.id,
        createdById: admin.id,
      },
    ],
  });

  console.log(`
Seed complete.

Default credentials:
  admin@dzc.internal      / admin1234        (ADMIN)
  negotiator@dzc.internal / negotiator1234   (NEGOTIATOR)
  intake@dzc.internal     / intake1234       (INTAKE)

Sample data:
  Creditors : 4 (Chase, Capital One, Discover, Synchrony)
  Clients   : 3 (John Doe, Sara Lee, Mike Chen)
  Accounts  : 5 debt accounts
  Offers    : 3 offers
  Activities: 5 negotiation activities
  Tasks     : 5 tasks

Change seed passwords before any production deployment.
`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
