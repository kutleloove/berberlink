
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = process.argv[2];
    if (!email) {
        console.error('Please provide an email address: node set-admin.js <email>');
        process.exit(1);
    }

    try {
        const user = await prisma.user.update({
            where: { email },
            data: { role: 'ADMIN' },
        });
        console.log(`User ${user.email} is now an ADMIN.`);
    } catch (e) {
        console.error('Error updating user:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
