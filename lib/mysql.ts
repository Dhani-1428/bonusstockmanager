import fs from 'node:fs'
import path from 'node:path'
import mysql from 'mysql2/promise'

let pool: mysql.Pool | null = null

function getSslCa(): string | undefined {
  // Prefer inline cert from env var for cloud deployments.
  if (process.env.MYSQL_SSL_CA_CONTENT) {
    return process.env.MYSQL_SSL_CA_CONTENT
  }

  // Fallback to local file path (ex: ./global-bundle.pem)
  const sslPath = process.env.MYSQL_SSL_CA_PATH
  if (!sslPath) return undefined

  const resolvedPath = path.isAbsolute(sslPath)
    ? sslPath
    : path.join(process.cwd(), sslPath)

  if (!fs.existsSync(resolvedPath)) return undefined
  return fs.readFileSync(resolvedPath, 'utf8')
}

export function getMysqlPool() {
  if (pool) return pool

  const host =
    process.env.MYSQL_HOST ||
    'bonusstockmanager.ctu4682g825l.eu-north-1.rds.amazonaws.com'
  const port = Number(process.env.MYSQL_PORT || 3306)
  const user = process.env.MYSQL_USER || 'admin'
  const password = process.env.MYSQL_PASSWORD
  const database = process.env.MYSQL_DATABASE

  if (!password) {
    throw new Error('MYSQL_PASSWORD is missing')
  }

  const ca = getSslCa()

  pool = mysql.createPool({
    host,
    port,
    user,
    password,
    ...(database ? { database } : {}),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: ca
      ? {
          ca,
          minVersion: 'TLSv1.2',
          rejectUnauthorized: true,
        }
      : undefined,
  })

  return pool
}

export async function pingMysql() {
  const db = getMysqlPool()
  const [rows] = await db.query('SELECT 1 AS ok')
  return rows
}

