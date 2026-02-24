'use client'

import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/button'
import { Download, ExternalLink } from 'lucide-react'
import type { Event } from '@/lib/types/database.types'

interface EventQRCodeProps {
  event: Event
}

export default function EventQRCode({ event }: EventQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Use the actual origin so the URL is always correct in any environment
  // (localhost in dev, the Vercel domain in production)
  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || ''
  const checkInUrl = `${baseUrl}/checkin/${event.qr_token}`

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        checkInUrl,
        {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error('QR Code generation error:', error)
        }
      )
    }
  }, [checkInUrl])

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const url = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `${event.title.replace(/\s+/g, '-')}-QR.png`
    link.href = url
    link.click()
  }

  const handleOpenLink = () => {
    window.open(checkInUrl, '_blank')
  }

  return (
    <div className="flex flex-col items-center space-y-4 p-4">
      <canvas ref={canvasRef} className="border rounded-lg shadow-sm" />
      
      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600">Check-in URL:</p>
        <code className="text-xs bg-gray-100 px-3 py-2 rounded block break-all">
          {checkInUrl}
        </code>
      </div>

      <div className="flex gap-2 w-full">
        <Button onClick={handleDownload} variant="outline" className="flex-1">
          <Download className="h-4 w-4 mr-2" />
          Download QR
        </Button>
        <Button onClick={handleOpenLink} variant="outline" className="flex-1">
          <ExternalLink className="h-4 w-4 mr-2" />
          Open Link
        </Button>
      </div>

      <div className="text-xs text-gray-500 text-center">
        Display this QR code at the event venue for members to check in
      </div>
    </div>
  )
}
