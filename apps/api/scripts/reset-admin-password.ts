import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const hash = await bcrypt.hash('admin123', 10);
    await prisma.user.update({
        where: { email: 'admin@netflop.local' },
        data: { passwordHash: hash }
    });
    console.log('✅ Admin password reset to: admin123');
}

main()
    .catch((e) => {
        console.error('❌ Failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
