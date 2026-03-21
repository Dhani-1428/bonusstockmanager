import { NextResponse } from 'next/server'
import { pingMysql } from '@/lib/mysql'

export async function GET() {
  try {
    await pingMysql()
    return NextResponse.json({
      success: true,
      message: 'MySQL connection successful',
    })
  } catch (error: any) {
    console.error('MySQL ping failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'MySQL connection failed',
        details: error?.message || String(error),
      },
      { status: 500 }
    )
  }
}

