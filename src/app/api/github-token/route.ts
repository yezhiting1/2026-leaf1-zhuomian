import { NextResponse } from 'next/server'

export async function GET() {
    const token = process.env.GITHUB_TOKEN
    if (!token) {
        return NextResponse.json(
            { error: 'GITHUB_TOKEN not set' },
            { status: 401 }
        )
    }
    return NextResponse.json({ token })
}
