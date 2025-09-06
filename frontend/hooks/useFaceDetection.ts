"use client"

import { useState, useCallback, useRef, useEffect } from 'react'

export interface FaceDetectionResult {
  success: boolean
  confidence: number
  faceCount: number
  livenessScore: number
  antispoofScore: number
  emotion?: string
  age?: number
  gender?: string
  error?: string
  frame?: string // base64 encoded image
}

export interface UseFaceDetectionReturn {
  // Detection state
  isDetecting: boolean
  isInitialized: boolean
  isWebcamReady: boolean

  // Detection results
  lastResult: FaceDetectionResult | null
  detectionHistory: FaceDetectionResult[]

  // Methods
  initialize: () => Promise<void>
  startDetection: () => Promise<void>
  stopDetection: () => void
  captureFrame: () => Promise<FaceDetectionResult | null>
  clearHistory: () => void

  // Error handling
  error: string | null
  clearError: () => void
}

export function useFaceDetection(): UseFaceDetectionReturn {
  const [isDetecting, setIsDetecting] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isWebcamReady, setIsWebcamReady] = useState(false)
  const [lastResult, setLastResult] = useState<FaceDetectionResult | null>(null)
  const [detectionHistory, setDetectionHistory] = useState<FaceDetectionResult[]>([])
  const [error, setError] = useState<string | null>(null)

  const humanRef = useRef<any | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isDetectingRef = useRef(false)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const initialize = useCallback(async () => {
    try {
      setError(null)
      setIsInitialized(false)

      // Dynamically import Human library only on client side
      const { Human } = await import('@vladmandic/human')

      // Human configuration optimized for face detection and liveness
      const config = {
        debug: false,
        backend: 'webgl' as any, // Use WebGL for better performance
        modelBasePath: 'https://vladmandic.github.io/human-models/models/',
        filter: {
          enabled: true,
          equalization: true,
          flip: false
        },
        face: {
          enabled: true,
          detector: {
            rotation: true,
            maxDetected: 1, // Only detect one face for KYC
            minConfidence: 0.3,
            return: true
          },
          mesh: { enabled: true },
          iris: { enabled: true },
          description: { enabled: true },
          emotion: { enabled: true },
          antispoof: { enabled: true },
          liveness: { enabled: true },
        },
        body: { enabled: false },
        hand: { enabled: false },
        object: { enabled: false },
        gesture: { enabled: false },
        segmentation: { enabled: false },
      }

      // Initialize Human
      humanRef.current = new Human(config)
      await humanRef.current.load()
      await humanRef.current.warmup()

      // Create video and canvas elements
      videoRef.current = document.createElement('video')
      videoRef.current.playsInline = true
      videoRef.current.muted = true

      canvasRef.current = document.createElement('canvas')
      canvasRef.current.width = 640
      canvasRef.current.height = 480

      setIsInitialized(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize face detection'
      setError(errorMessage)
      throw err
    }
  }, [])

  const startDetection = useCallback(async () => {
    if (!humanRef.current || !videoRef.current || !canvasRef.current) {
      throw new Error('Face detection not initialized')
    }

    try {
      setError(null)
      setIsDetecting(true)
      isDetectingRef.current = true

      // Start webcam
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      })

      videoRef.current.srcObject = stream
      await videoRef.current.play()
      setIsWebcamReady(true)

      // Start detection loop
      const detectFrame = async () => {
        if (!isDetectingRef.current || !humanRef.current || !videoRef.current || !canvasRef.current) {
          return
        }

        try {
          const result = await humanRef.current.detect(videoRef.current)
          const faceResult = processDetectionResult(result, canvasRef.current)

          if (faceResult) {
            setLastResult(faceResult)
            setDetectionHistory(prev => [...prev.slice(-9), faceResult]) // Keep last 10 results
          }
        } catch (err) {
          console.error('Detection error:', err)
        }

        if (isDetectingRef.current) {
          detectionIntervalRef.current = setTimeout(detectFrame, 100) // 10 FPS
        }
      }

      detectFrame()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start face detection'
      setError(errorMessage)
      setIsDetecting(false)
      isDetectingRef.current = false
      throw err
    }
  }, [])

  const stopDetection = useCallback(() => {
    setIsDetecting(false)
    isDetectingRef.current = false

    if (detectionIntervalRef.current) {
      clearTimeout(detectionIntervalRef.current)
      detectionIntervalRef.current = null
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }

    setIsWebcamReady(false)
  }, [])

  const captureFrame = useCallback(async (): Promise<FaceDetectionResult | null> => {
    if (!humanRef.current || !videoRef.current || !canvasRef.current) {
      return null
    }

    try {
      const result = await humanRef.current.detect(videoRef.current)
      const faceResult = processDetectionResult(result, canvasRef.current)

      if (faceResult) {
        setLastResult(faceResult)
        setDetectionHistory(prev => [...prev.slice(-9), faceResult])
      }

      return faceResult
    } catch (err) {
      console.error('Capture error:', err)
      return null
    }
  }, [])

  const clearHistory = useCallback(() => {
    setDetectionHistory([])
    setLastResult(null)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDetection()
      if (humanRef.current) {
        humanRef.current.tf.dispose()
      }
    }
  }, [stopDetection])

  return {
    isDetecting,
    isInitialized,
    isWebcamReady,
    lastResult,
    detectionHistory,
    initialize,
    startDetection,
    stopDetection,
    captureFrame,
    clearHistory,
    error,
    clearError,
  }
}

function processDetectionResult(result: any, canvas: HTMLCanvasElement): FaceDetectionResult | null {
  if (!result.face || result.face.length === 0) {
    return null
  }

  const face = result.face[0] // Get the first (and only) detected face

  // Draw the face on canvas for frame capture
  const ctx = canvas.getContext('2d')
  if (ctx && result.canvas) {
    ctx.drawImage(result.canvas, 0, 0, canvas.width, canvas.height)
  }

  // Calculate liveness score based on multiple factors
  const livenessScore = calculateLivenessScore(face)

  // Get antispoof score
  const antispoofScore = face.antispoof?.score || 0

  // Get emotion
  const emotion = face.emotion?.[0]?.emotion || 'neutral'

  // Get age and gender
  const age = face.age || 0
  const gender = face.gender || 'unknown'

  // Convert canvas to base64
  const frame = canvas.toDataURL('image/jpeg', 0.8)

  return {
    success: true,
    confidence: face.boxScore || 0,
    faceCount: result.face.length,
    livenessScore,
    antispoofScore,
    emotion,
    age,
    gender,
    frame,
  }
}

function calculateLivenessScore(face: any): number {
  let score = 0
  let factors = 0

  // Factor 1: Face detection confidence
  if (face.boxScore) {
    score += face.boxScore * 0.3
    factors += 0.3
  }

  // Factor 2: Face mesh quality (more points = better quality)
  if (face.mesh && face.mesh.length > 0) {
    const meshQuality = Math.min(face.mesh.length / 468, 1) // 468 is max face mesh points
    score += meshQuality * 0.2
    factors += 0.2
  }

  // Factor 3: Iris detection (indicates real eyes)
  if (face.iris && face.iris.length > 0) {
    score += 0.2
    factors += 0.2
  }

  // Factor 4: Antispoof score
  if (face.antispoof?.score) {
    score += face.antispoof.score * 0.2
    factors += 0.2
  }

  // Factor 5: Liveness detection
  if (face.liveness?.score) {
    score += face.liveness.score * 0.1
    factors += 0.1
  }

  return factors > 0 ? score / factors : 0
}
