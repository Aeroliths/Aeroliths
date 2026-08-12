// Creates a MediaAsset row for every sprite already sitting in uploads/.
//
// Duplicate files get a single entry, and the lithos or elements that pointed
// at the duplicate are repointed to the canonical file. The two files are
// byte-identical, so nothing changes visually, but the library ends up
// consistent and the leftover copies become deletable.
//
// Safe to re-run: files that are already registered are skipped.
import { readdir, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, extname } from 'node:path'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { config } from 'dotenv'
import dotenvExpand from 'dotenv-expand'

const myEnv = config()
dotenvExpand.expand(myEnv)

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined in .env file')
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter })

const CATEGORIES = ['lithos', 'elements'] as const

const EXTENSION_TO_MIME: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
}

const backfillCategory = async (category: string) => {
    const directory = join(process.cwd(), 'uploads', category)

    if (!existsSync(directory)) {
        console.log(`Skipping ${category}, no such directory`)
        return
    }

    const files = await readdir(directory)
    let created = 0
    let skipped = 0
    let repointed = 0

    for (const filename of files) {
        const mimeType = EXTENSION_TO_MIME[extname(filename).toLowerCase()]
        if (!mimeType) {
            console.log(`Skipping ${category}/${filename}, unsupported extension`)
            continue
        }

        const data = await readFile(join(directory, filename))
        const hash = createHash('sha256').update(data).digest('hex')
        const path = `/app/uploads/${category}/${filename}`

        const existing = await prisma.mediaAsset.findUnique({ where: { path } })
        if (existing) {
            skipped++
            continue
        }

        // A duplicate of a file already registered under this category: the
        // library keeps one entry per distinct content, so this file is left
        // on disk without an entry of its own. Anything still pointing at it
        // moves to the canonical file, which holds the exact same bytes.
        const sameContent = await prisma.mediaAsset.findUnique({
            where: { category_hash: { category, hash } },
        })
        if (sameContent) {
            const [lithosMoved, elementsMoved] = await Promise.all([
                prisma.lithos.updateMany({
                    where: { sprite: path },
                    data: { sprite: sameContent.path },
                }),
                prisma.elements.updateMany({
                    where: { sprite: path },
                    data: { sprite: sameContent.path },
                }),
            ])

            const moved = lithosMoved.count + elementsMoved.count
            repointed += moved

            console.log(
                `Skipping ${category}/${filename}, same content as ${sameContent.path}` +
                (moved > 0 ? ` (${moved} row(s) repointed)` : ''),
            )
            skipped++
            continue
        }

        await prisma.mediaAsset.create({
            data: {
                category,
                path,
                label: filename,
                hash,
                mimeType,
                size: data.length,
            },
        })
        created++
    }

    console.log(`${category}: ${created} created, ${skipped} skipped, ${repointed} repointed`)
}

const main = async () => {
    for (const category of CATEGORIES) {
        await backfillCategory(category)
    }
}

main()
    .catch((error) => {
        console.error('Backfill failed:', error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
