const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const prisma = new PrismaClient();
  
  const email = 'test@example.com';
  const password = '123456';
  
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('User exists, deleting...');
    await prisma.user.delete({ where: { email } });
  }
  
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name: 'Test User', email, password: hashed }
  });
  
  console.log('Created user:', { id: user.id, name: user.name, email: user.email });
  
  const fetched = await prisma.user.findUnique({ where: { email } });
  const valid = await bcrypt.compare(password, fetched.password);
  console.log('Password valid:', valid);
  
  await prisma.$disconnect();
}

main();