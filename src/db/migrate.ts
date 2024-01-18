import postgres from 'postgres'
import chalk from 'chalk'
import { env } from '../env'

import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'

const connection = postgres(env.DATABASE_URL, { max: 1 })
const db = drizzle(connection)

await migrate(db, { migrationsFolder: 'drizzle' })

console.log(chalk.greenBright('Migrations applied successfully!'))

await connection.end()

process.exit()
