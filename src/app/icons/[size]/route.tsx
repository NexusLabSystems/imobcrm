import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size: sizeStr } = await params
  const size = Math.min(Math.max(parseInt(sizeStr) || 192, 32), 512)
  const fontSize = Math.round(size * 0.45)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1B3A5C',
          borderRadius: `${Math.round(size * 0.18)}px`,
          color: '#ffffff',
          fontSize,
          fontWeight: 700,
          fontFamily: 'sans-serif',
          letterSpacing: '-0.02em',
        }}
      >
        I
      </div>
    ),
    { width: size, height: size }
  )
}
