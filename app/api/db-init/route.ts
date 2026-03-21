import { NextRequest, NextResponse } from 'next/server'
import { initMysqlSchema } from '@/lib/mysql'

export async function POST(request: NextRequest) {
  try {
    // Optional safety key to avoid accidental public initialization.
    const expectedKey = process.env.DB_INIT_KEY
    if (expectedKey) {
      const authHeader = request.headers.get('x-db-init-key')
      if (authHeader !== expectedKey) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized db-init request' },
          { status: 401 }
        )
      }
    }

    const result = await initMysqlSchema()
    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      ...result,
    })
  } catch (error: any) {
    console.error('DB init failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Database initialization failed',
        details: error?.message || String(error),
      },
      { status: 500 }
    )
  }
}

