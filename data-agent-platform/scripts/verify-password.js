const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const prisma = new PrismaClient();
  
  const user = await prisma.user.findUnique({ where: { email: 'lin@example.com' } });
  
  if (user && user.password) {
    const result = await bcrypt.compare('123456', user.password);
    console.log('Password verification result:', result);
    
    const result2 = await bcrypt.compare('1234567', user.password);
    console.log('Wrong password result:', result2);
  } else {
    console.log('User not found or no password');
  }
  
  await prisma.$disconnect();
}

main();