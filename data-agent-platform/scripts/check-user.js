const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  const users = await prisma.user.findMany();
  console.log('Users:', users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    hasPassword: !!u.password,
    passwordLength: u.password ? u.password.length : 0
  })));
  
  await prisma.$disconnect();
}

main();