import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcrypt'
import { config } from 'dotenv'
import dotenvExpand from 'dotenv-expand'

const myEnv = config()
dotenvExpand.expand(myEnv)

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined in .env file')
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({
    adapter,
    log: ['query', 'info', 'warn', 'error'],
})

async function main() {
    // Create some roles

    const userRole = await prisma.role.upsert({
        where: { name: 'user' },
        update: {},
        create: {
            name: 'user',
        },
    })

    const adminRole = await prisma.role.upsert({
        where: { name: 'admin' },
        update: {},
        create: {
            name: 'admin',
        },
    })

    // Create default admin account from env variables
    const adminUsername = process.env.ADMIN_USERNAME
    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD

    if (adminUsername && adminEmail && adminPassword) {
        const existingAdmin = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: adminEmail },
                    { username: adminUsername },
                ],
            },
        })

        const hashedPassword = await bcrypt.hash(adminPassword, 10)

        if (!existingAdmin) {
            await prisma.user.create({
                data: {
                    username: adminUsername,
                    email: adminEmail,
                    emailVerified: true,
                    roleId: adminRole.id,
                    authentication: {
                        create: {
                            password: hashedPassword,
                        },
                    },
                },
            })

            console.log('[Seed] Admin account created')
        } else {
            await prisma.user.update({
                where: { id: existingAdmin.id },
                data: {
                    username: adminUsername,
                    email: adminEmail,
                    emailVerified: true,
                    roleId: adminRole.id,
                    authentication: {
                        upsert: {
                            create: { password: hashedPassword },
                            update: { password: hashedPassword },
                        },
                    },
                },
            })

            console.log('[Seed] Admin account updated')
        }
    } else {
        console.warn('[Seed] ADMIN_USERNAME, ADMIN_EMAIL or ADMIN_PASSWORD not set in .env — skipping admin creation')
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
