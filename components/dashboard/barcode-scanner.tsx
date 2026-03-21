"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from "@zxing/library"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Barcode, Camera, Search, X, RotateCcw, Maximize2 } from "lucide-react"
import { toast } from "sonner"

// Detect if device is mobile
const isMobile = () => {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth <= 768)
}

interface BarcodeScannerProps {
  onScan: (code: string) => void
  buttonText?: string
  buttonVariant?: "default" | "outline" | "ghost"
}

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>
}

export function BarcodeScanner({
  onScan,
  buttonText = "Scan Barcode",
  buttonVariant = "outline",
}: BarcodeScannerProps) {
  const [open, setOpen] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [hasCamera, setHasCamera] = useState(false)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [buffer, setBuffer] = useState("")
  const bufferTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hasHandledScanRef = useRef(false)

  // Check for camera availability
  useEffect(() => {
    const checkCamera = async () => {
      // On some mobile browsers (notably iOS Safari), enumerateDevices may return
      // an empty list until camera permission is granted. If getUserMedia exists,
      // we treat the camera as "available" and let startCamera() handle errors.
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCamera(false)
        return
      }

      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const hasVideoInput = devices.some(device => device.kind === 'videoinput')
        setHasCamera(hasVideoInput || isMobile())
      } catch {
        setHasCamera(true)
      }
    }
    checkCamera()
  }, [])

  // Handle fullscreen on mobile
  useEffect(() => {
    if (isFullscreen && containerRef.current && isMobile()) {
      const element = containerRef.current
      if (element.requestFullscreen) {
        element.requestFullscreen().catch(() => {
          // Fullscreen not supported or denied
          setIsFullscreen(false)
        })
      } else if ((element as any).webkitRequestFullscreen) {
        (element as any).webkitRequestFullscreen()
      } else if ((element as any).mozRequestFullScreen) {
        (element as any).mozRequestFullScreen()
      }
    }
  }, [isFullscreen])

  // Handle barcode scanner input (most scanners act like keyboards)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore typing only in this dialog's manual input.
      // POS page keeps its own barcode input focused, and external scanners
      // send keystrokes to the focused field — we still want to capture those.
      if (document.activeElement === inputRef.current) return

      if (bufferTimeoutRef.current) {
        clearTimeout(bufferTimeoutRef.current)
      }

      if (e.key === "Enter" && buffer.length > 0) {
        const cleaned = buffer.trim().replace(/\s+/g, '')
        if (cleaned.length > 5) {
          onScan(cleaned)
          toast.success(`Scanned: ${cleaned}`)
        }
        setBuffer("")
        return
      }

      if (e.key.length === 1) {
        setBuffer((prev) => prev + e.key)
      }

      bufferTimeoutRef.current = setTimeout(() => {
        setBuffer("")
      }, 100)
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => {
      window.removeEventListener("keydown", handleKeyPress)
      if (bufferTimeoutRef.current) {
        clearTimeout(bufferTimeoutRef.current)
      }
    }
  }, [buffer, onScan])

  const startCamera = async () => {
    try {
      setCameraError(null)
      setIsScanning(true) // Set scanning state early to show loading
      hasHandledScanRef.current = false
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser')
      }
      
      // Wait a bit to ensure video element is rendered
      await new Promise(resolve => setTimeout(resolve, 100))
      
      if (!videoRef.current) {
        throw new Error('Video element not available')
      }
      
      const hints = new Map()
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.ITF,
        BarcodeFormat.QR_CODE,
      ])
      hints.set(DecodeHintType.TRY_HARDER, true)

      const codeReader = new BrowserMultiFormatReader(hints)
      codeReaderRef.current = codeReader
      
      // Simplified video constraints for better compatibility
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        } as MediaTrackConstraints,
      }
      
      console.log('Requesting camera access...')
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      console.log('Camera access granted')
      
      streamRef.current = stream
      
      if (!videoRef.current) {
        stream.getTracks().forEach(track => track.stop())
        throw new Error('Video element disappeared')
      }
      
      videoRef.current.srcObject = stream
      // iOS Safari is picky: ensure these are set before play()
      videoRef.current.muted = true
      ;(videoRef.current as any).playsInline = true
      await videoRef.current.play().catch(err => {
        console.error('Error playing video:', err)
        throw err
      })
      
      // On mobile, enter fullscreen for better scanning experience
      if (isMobile()) {
        setTimeout(() => {
          // Avoid attempting fullscreen on iOS Safari (not supported for arbitrary elements)
          const isIOS = /iPad|iPhone|iPod/i.test(navigator.userAgent)
          if (!isIOS) setIsFullscreen(true)
        }, 300)
      }
      
      // Wait for video to be ready, then start scanning
      const startScanning = () => {
        if (!videoRef.current || !codeReaderRef.current) {
          console.error('Video or codeReader not available for scanning')
          return
        }

        const handleDetectedCode = (rawCode: string) => {
          if (hasHandledScanRef.current) return
          const code = rawCode?.trim().replace(/\s+/g, '') || ''
          if (!code) return
          hasHandledScanRef.current = true
          console.log('Barcode detected:', code)
          if (navigator.vibrate) navigator.vibrate(100)
          onScan(code)
          stopCamera()
          setOpen(false)
          toast.success(`Scanned: ${code}`)
        }
        
        // Some mobile browsers report readyState but videoWidth/videoHeight are still 0.
        // ZXing needs real dimensions to decode correctly.
        const tryStart = (attempt: number) => {
          if (!videoRef.current || !codeReaderRef.current) return
          const { videoWidth, videoHeight } = videoRef.current
          if (videoWidth > 0 && videoHeight > 0) {
            console.log('Starting barcode scanning...')
            toast.message('Scanning barcode...')
            
            // Use decodeFromVideoDevice which continuously scans
            try {
              codeReaderRef.current.decodeFromVideoDevice(
                null,
                videoRef.current,
                (result, error) => {
                  if (result) {
                    handleDetectedCode(result.getText())
                  }
                  // NotFoundException is expected when no barcode is in view
                  if (error && error.name !== 'NotFoundException') {
                    console.debug('Barcode scan error:', error.name)
                  }
                }
              )
            } catch (scanError) {
              console.error('Error starting barcode scanner:', scanError)
              toast.error('Error starting barcode scanner')
            }

            // Fallback for supported browsers/devices: native BarcodeDetector
            // helps when ZXing has trouble decoding on certain mobile cameras.
            const win = window as any
            if (typeof win.BarcodeDetector !== 'undefined' && videoRef.current) {
              try {
                const detector: BarcodeDetectorLike = new win.BarcodeDetector({
                  formats: [
                    'ean_13',
                    'ean_8',
                    'upc_a',
                    'upc_e',
                    'code_128',
                    'code_39',
                    'itf',
                    'qr_code',
                  ],
                })

                if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)
                scanIntervalRef.current = setInterval(async () => {
                  if (!videoRef.current || hasHandledScanRef.current) return
                  try {
                    const detections = await detector.detect(videoRef.current)
                    const first = detections?.[0]?.rawValue
                    if (first) handleDetectedCode(first)
                  } catch {
                    // Ignore detector frame errors and continue scanning.
                  }
                }, 350)
              } catch {
                // Ignore BarcodeDetector setup failures.
              }
            }
            return
          }

          if (attempt >= 10) {
            console.warn('Video dimensions not available for scanning', { videoWidth, videoHeight })
            toast.error('Camera not ready for scanning yet. Please try again.')
            return
          }

          setTimeout(() => tryStart(attempt + 1), 200)
        }
        
        tryStart(0)
      }
      
      // Wait for video metadata to load
      if (videoRef.current.readyState >= 2) {
        // Video already loaded
        startScanning()
      } else {
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded')
          startScanning()
        }
        
        // Fallback timeout
        setTimeout(() => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            startScanning()
          }
        }, 1000)
      }
    } catch (error: any) {
      console.error('Camera access error:', error)
      setCameraError(error.message || 'Could not access camera')
      setIsScanning(false)
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        toast.error('Camera permission denied. Please allow camera access in your browser settings and try again.')
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        toast.error('No camera found on this device.')
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        toast.error('Camera is already in use by another application. Please close it and try again.')
      } else {
        toast.error(`Could not access camera: ${error.message || 'Unknown error'}`)
      }
    }
  }

  const switchCamera = async () => {
    const newFacingMode = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(newFacingMode)
    
    // Restart camera with new facing mode
    if (isScanning) {
      stopCamera()
      // Small delay to ensure cleanup
      setTimeout(() => {
        startCamera()
      }, 100)
    }
  }

  const stopCamera = useCallback(() => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset()
      codeReaderRef.current = null
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
    setIsFullscreen(false)
    setCameraError(null)
    
    // Exit fullscreen if active
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    } else if ((document as any).webkitFullscreenElement) {
      (document as any).webkitExitFullscreen()
    } else if ((document as any).mozFullScreenElement) {
      (document as any).mozCancelFullScreen()
    }
  }, [])

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualCode.trim()) {
      onScan(manualCode.trim())
      setManualCode("")
      setOpen(false)
      toast.success(`Code entered: ${manualCode}`)
    }
  }

  useEffect(() => {
    if (!open) {
      stopCamera()
    }
  }, [open, stopCamera])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={buttonVariant} 
          size={buttonText ? "default" : "icon"}
          className={!buttonText ? "h-10 w-10" : ""}
        >
          {buttonText ? (
            <>
              <Barcode className="h-4 w-4 mr-2" />
              {buttonText}
            </>
          ) : (
            <Camera className="h-5 w-5" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className={`max-w-md ${isMobile() && isScanning ? 'p-0 max-w-full h-full max-h-full' : ''}`}>
        <DialogHeader className={isMobile() && isScanning ? 'hidden' : ''}>
          <DialogTitle className="flex items-center gap-2">
            <Barcode className="h-5 w-5" />
            Scan Barcode / IMEI
          </DialogTitle>
        </DialogHeader>

        <div ref={containerRef} className={`space-y-4 ${isMobile() && isScanning ? 'h-full' : ''}`}>
          {hasCamera && (
            <Card className={isMobile() && isScanning ? 'border-0 shadow-none h-full flex flex-col' : ''}>
              <CardContent className={`pt-4 ${isMobile() && isScanning ? 'flex-1 flex flex-col p-0' : ''}`}>
                {isScanning ? (
                  <div className={`relative ${isMobile() && isScanning ? 'h-full flex flex-col' : ''}`}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full rounded-lg aspect-video bg-muted ${isMobile() && isScanning ? 'h-full object-cover rounded-none' : ''}`}
                      style={isMobile() && isScanning ? { 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      } : {}}
                    />
                    <div className={`absolute inset-0 flex items-center justify-center ${isMobile() && isScanning ? 'pointer-events-none' : ''}`}>
                      <div className={`border-2 border-primary rounded-lg ${isMobile() && isScanning ? 'w-80 h-48' : 'w-64 h-16'}`} />
                    </div>
                    
                    {/* Control buttons */}
                    <div className={`absolute ${isMobile() && isScanning ? 'bottom-4 left-0 right-0 flex justify-center gap-4' : 'top-2 right-2'}`}>
                      {isMobile() && (
                        <Button
                          variant="secondary"
                          size="lg"
                          className="rounded-full h-14 w-14 shadow-lg"
                          onClick={switchCamera}
                        >
                          <RotateCcw className="h-5 w-5" />
                        </Button>
                      )}
                      <Button
                        variant={isMobile() ? "secondary" : "destructive"}
                        size={isMobile() ? "lg" : "sm"}
                        className={`${isMobile() ? 'rounded-full h-14 w-14 shadow-lg' : ''}`}
                        onClick={stopCamera}
                      >
                        <X className={`${isMobile() ? 'h-6 w-6' : 'h-4 w-4'}`} />
                      </Button>
                    </div>
                    
                    {!isMobile() && (
                      <p className="text-center text-sm text-muted-foreground mt-2">
                        Position barcode within the frame
                      </p>
                    )}
                    
                    {isMobile() && (
                      <div className="absolute bottom-20 left-0 right-0 text-center">
                        <p className="text-white text-sm font-medium bg-black/50 px-4 py-2 rounded-full inline-block">
                          Position barcode within the frame
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {cameraError && (
                      <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                        <p className="font-medium">Camera Error:</p>
                        <p className="mt-1">{cameraError}</p>
                        <Button 
                          onClick={() => {
                            setCameraError(null)
                            startCamera()
                          }} 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                        >
                          Try Again
                        </Button>
                      </div>
                    )}
                    <Button 
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        console.log('Start camera button clicked')
                        startCamera()
                      }} 
                      className="w-full" 
                      variant="outline" 
                      size="lg"
                      disabled={!hasCamera}
                      type="button"
                    >
                      <Camera className="h-5 w-5 mr-2" />
                      {hasCamera ? 'Start Camera Scan' : 'Camera Not Available'}
                    </Button>
                    {!hasCamera && (
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        No camera detected on this device
                      </p>
                    )}
                    {hasCamera && isMobile() && (
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        Tap to scan barcodes with your camera
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or enter manually
              </span>
            </div>
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manual-code">Barcode / IMEI / SKU</Label>
              <Input
                ref={inputRef}
                id="manual-code"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Enter code manually..."
                autoComplete="off"
              />
            </div>
            <Button type="submit" className="w-full">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>

          <div className="text-xs text-muted-foreground text-center space-y-1">
            {isMobile() ? (
              <>
                <p>📱 Tap "Start Camera Scan" to use your phone's camera</p>
                <p>Allow camera access when prompted</p>
                <p>Position the barcode within the frame</p>
              </>
            ) : (
              <>
                <p>Tip: Connect a USB barcode scanner for faster input.</p>
                <p>Most scanners work automatically when this dialog is open.</p>
                <p>Or use the camera to scan barcodes directly.</p>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
