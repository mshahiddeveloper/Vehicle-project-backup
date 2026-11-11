const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      phone: true,
      email: true,
      userType: true,
      accountStatus: true,
      customerProfile: { select: { firstName: true, lastName: true } },
      listerProfile: { select: { businessName: true, listerType: true, representativeName: true } },
      driverProfile: { select: { firstName: true, lastName: true, licenceNumber: true } },
      agentProfile: { select: { firstName: true, lastName: true, department: true } }
    }
  });
  console.log('\n--- Users by Role & Profile ---');
  console.table(users.map(u => ({
    id: u.id.slice(0, 8),
    phone: u.phone,
    email: u.email,
    userType: u.userType,
    status: u.accountStatus,
    profileName: (u.customerProfile ? `${u.customerProfile.firstName} ${u.customerProfile.lastName}` : null) || 
                 u.listerProfile?.businessName || 
                 u.listerProfile?.representativeName || 
                 (u.driverProfile ? `${u.driverProfile.firstName} ${u.driverProfile.lastName}` : null) || 
                 (u.agentProfile ? `${u.agentProfile.firstName} ${u.agentProfile.lastName}` : null) || 'N/A'
  })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
