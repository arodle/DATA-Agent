const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE User ADD COLUMN IF NOT EXISTS password TEXT');
    console.log('Column added or already exists');
  } catch (e) {
    console.log('Column might already exist:', e.message);
  }
  
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  try {
    await prisma.user.create({
      data: {
        name: '林同学',
        email: 'lin@example.com',
        password: hashedPassword,
      },
    });
    console.log('Demo user created: lin@example.com / 123456');
  } catch (e) {
    console.log('User might already exist:', e.message);
  }
  
  await prisma.$disconnect();
}

main();
