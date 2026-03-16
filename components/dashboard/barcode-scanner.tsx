"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { BrowserMultiFormatReader } from "@zxing/library"
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

  // Check for camera availability
  useEffect(() => {
    const checkCamera = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          // Try to enumerate devices to check if camera exists
          const devices = await navigator.mediaDevices.enumerateDevices()
          const hasVideoInput = devices.some(device => device.kind === 'videoinput')
          setHasCamera(hasVideoInput)
        } catch {
          // If enumeration fails, assume camera might be available
          setHasCamera(true)
        }
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
      // Ignore if input is focused
      if (document.activeElement?.tagName === "INPUT") return

      if (bufferTimeoutRef.current) {
        clearTimeout(bufferTimeoutRef.current)
      }

      if (e.key === "Enter" && buffer.length > 5) {
        onScan(buffer)
        setBuffer("")
        toast.success(`Scanned: ${buffer}`)
        return
      }

      if (e.key.length === 1) {
        setBuffer((prev) => prev + e.key)
      }

      bufferTimeoutRef.current = setTimeout(() => {
        setBuffer("")
      }, 100)
    }

    window.addEventListener("keypress", handleKeyPress)
    return () => {
      window.removeEventListener("keypress", handleKeyPress)
      if (bufferTimeoutRef.current) {
        clearTimeout(bufferTimeoutRef.current)
      }
    }
  }, [buffer, onScan])

  const startCamera = async () => {
    try {
      if (!videoRef.current) return
      
      setCameraError(null)
      const codeReader = new BrowserMultiFormatReader()
      codeReaderRef.current = codeReader
      
      // Better video constraints for mobile devices
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: isMobile() ? 1280 : 1920 },
          height: { ideal: isMobile() ? 720 : 1080 },
          // Enable autofocus on mobile
          focusMode: 'continuous',
        },
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      videoRef.current.srcObject = stream
      setIsScanning(true)
      
      // On mobile, enter fullscreen for better scanning experience
      if (isMobile()) {
        setIsFullscreen(true)
      }
      
      // Wait for video to be ready, then start scanning
      const startScanning = () => {
        if (!videoRef.current || !codeReaderRef.current) return
        
        // Use decodeFromVideoDevice which continuously scans
        codeReaderRef.current.decodeFromVideoDevice(
          null,
          videoRef.current,
          (result, error) => {
            if (result) {
              const code = result.getText()
              
              // Haptic feedback on mobile
              if (navigator.vibrate) {
                navigator.vibrate(100)
              }
              
              onScan(code)
              stopCamera()
              setOpen(false)
              toast.success(`Scanned: ${code}`)
            }
            // NotFoundException is expected when no barcode is in view
            if (error && error.name !== 'NotFoundException') {
              console.debug('Barcode scan error:', error.name)
            }
          }
        )
      }
      
      if (videoRef.current.readyState >= 2) {
        // Video already loaded
        startScanning()
      } else {
        videoRef.current.onloadedmetadata = startScanning
      }
    } catch (error: any) {
      console.error('Camera access error:', error)
      setCameraError(error.message || 'Could not access camera')
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        toast.error('Camera permission denied. Please allow camera access in your browser settings.')
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        toast.error('No camera found on this device.')
      } else {
        toast.error('Could not access camera. Please try again.')
      }
      setIsScanning(false)
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
                        {cameraError}
                      </div>
                    )}
                    <Button onClick={startCamera} className="w-full" variant="outline" size="lg">
                      <Camera className="h-5 w-5 mr-2" />
                      Start Camera Scan
                    </Button>
                    {isMobile() && (
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
