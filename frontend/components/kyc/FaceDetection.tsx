"use client"

import React, { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Camera, 
  Eye, 
  Shield, 
  Smile,
  User,
  Clock
} from 'lucide-react'
import { useFaceDetection, FaceDetectionResult } from '@/hooks/useFaceDetection'
import { kycService } from '@/lib/kyc/service'

interface FaceDetectionProps {
  userId: string
  type: 'enrol' | 'verify'
  onComplete: (result: FaceDetectionResult) => void
  onError: (error: string) => void
  minLivenessScore?: number
  minConfidence?: number
  requiredFrames?: number
}

export function FaceDetection({ 
  userId, 
  type, 
  onComplete, 
  onError,
  minLivenessScore = 0.7,
  minConfidence = 0.8,
  requiredFrames = 5
}: FaceDetectionProps) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'detecting' | 'processing' | 'complete' | 'error'>('loading')
  const [progress, setProgress] = useState(0)
  const [instructions, setInstructions] = useState('')
  const [frameCount, setFrameCount] = useState(0)
  const [averageLiveness, setAverageLiveness] = useState(0)
  const [averageConfidence, setAverageConfidence] = useState(0)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const {
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
    clearError
  } = useFaceDetection()

  useEffect(() => {
    initializeHuman()
  }, [])

  useEffect(() => {
    if (lastResult) {
      updateProgress()
    }
  }, [lastResult])

  const initializeHuman = async () => {
    try {
      setStatus('loading')
      clearError()
      await initialize()
      setStatus('ready')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize face detection'
      setStatus('error')
      onError(errorMessage)
    }
  }

  const startFaceDetection = async () => {
    try {
      setStatus('detecting')
      setProgress(0)
      setFrameCount(0)
      setAverageLiveness(0)
      setAverageConfidence(0)
      clearHistory()
      
      await startDetection()
      
      // Set up video display
      if (videoRef.current && containerRef.current) {
        const video = videoRef.current
        const container = containerRef.current
        
        // Get the video stream from the hook's internal video element
        // This is a workaround since the hook manages its own video element
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' }
        })
        
        video.srcObject = stream
        video.play()
      }
      
      setInstructions('Look directly at the camera and keep your face centered')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start face detection'
      setStatus('error')
      onError(errorMessage)
    }
  }

  const updateProgress = () => {
    if (!lastResult || detectionHistory.length < 2) return

    const recentResults = detectionHistory.slice(-requiredFrames)
    const avgLiveness = recentResults.reduce((sum, r) => sum + r.livenessScore, 0) / recentResults.length
    const avgConfidence = recentResults.reduce((sum, r) => sum + r.confidence, 0) / recentResults.length
    
    setAverageLiveness(avgLiveness)
    setAverageConfidence(avgConfidence)
    setFrameCount(recentResults.length)
    
    const progressValue = Math.min((recentResults.length / requiredFrames) * 100, 100)
    setProgress(progressValue)
    
    // Check if we have enough good frames
    if (recentResults.length >= requiredFrames && 
        avgLiveness >= minLivenessScore && 
        avgConfidence >= minConfidence) {
      completeDetection()
    }
  }

  const completeDetection = async () => {
    try {
      setStatus('processing')
      setInstructions('Processing your verification...')
      
      // Capture final frame
      const finalResult = await captureFrame()
      
      if (finalResult && finalResult.success) {
        // Process the result through KYC service
        const processResult = await kycService.processFaceDetectionResult(
          userId,
          finalResult,
          type
        )
        
        if (processResult.success) {
          setStatus('complete')
          setInstructions('Verification completed successfully!')
          onComplete(finalResult)
        } else {
          throw new Error(processResult.message)
        }
      } else {
        throw new Error('Failed to capture final frame')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete verification'
      setStatus('error')
      onError(errorMessage)
    }
  }

  const retryDetection = () => {
    stopDetection()
    setStatus('ready')
    setProgress(0)
    setFrameCount(0)
    setAverageLiveness(0)
    setAverageConfidence(0)
    clearHistory()
  }

  const renderStatus = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p>Initializing face detection...</p>
          </div>
        )

      case 'ready':
        return (
          <div className="text-center space-y-4">
            <Camera className="h-12 w-12 mx-auto text-blue-500" />
            <div>
              <h3 className="text-lg font-semibold">
                {type === 'enrol' ? 'Register Your Face' : 'Verify Your Identity'}
              </h3>
              <p className="text-muted-foreground">
                {type === 'enrol' 
                  ? 'We\'ll capture your face to create a secure biometric template'
                  : 'Look at the camera to verify your identity'
                }
              </p>
            </div>
            <Button onClick={startFaceDetection} className="w-full" disabled={!isInitialized}>
              <Camera className="w-4 h-4 mr-2" />
              Start Face {type === 'enrol' ? 'Registration' : 'Verification'}
            </Button>
          </div>
        )

      case 'detecting':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <div className="relative mx-auto w-64 h-64 border-2 border-blue-500 rounded-full overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                <div className="absolute inset-0 border-2 border-green-400 rounded-full animate-pulse" />
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <p className="font-medium">{instructions}</p>
              <div className="flex justify-center space-x-2">
                <Badge variant="outline" className="flex items-center space-x-1">
                  <Eye className="w-3 h-3" />
                  <span>Liveness: {Math.round(averageLiveness * 100)}%</span>
                </Badge>
                <Badge variant="outline" className="flex items-center space-x-1">
                  <Shield className="w-3 h-3" />
                  <span>Confidence: {Math.round(averageConfidence * 100)}%</span>
                </Badge>
                <Badge variant="outline" className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>Frames: {frameCount}/{requiredFrames}</span>
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>

            <div className="text-center">
              <Button onClick={stopDetection} variant="outline" size="sm">
                Cancel
              </Button>
            </div>
          </div>
        )

      case 'processing':
        return (
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p>{instructions}</p>
          </div>
        )

      case 'complete':
        return (
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
            <div>
              <h3 className="text-lg font-semibold text-green-700">Verification Successful</h3>
              <p className="text-muted-foreground">
                Your face has been {type === 'enrol' ? 'registered' : 'verified'} successfully
              </p>
            </div>
            {lastResult && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-blue-500" />
                  <span>Liveness: {Math.round(lastResult.livenessScore * 100)}%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span>Confidence: {Math.round(lastResult.confidence * 100)}%</span>
                </div>
                {lastResult.emotion && (
                  <div className="flex items-center space-x-2">
                    <Smile className="w-4 h-4 text-yellow-500" />
                    <span>Emotion: {lastResult.emotion}</span>
                  </div>
                )}
                {lastResult.age && (
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-purple-500" />
                    <span>Age: {Math.round(lastResult.age)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )

      case 'error':
        return (
          <div className="text-center space-y-4">
            <XCircle className="h-12 w-12 mx-auto text-red-500" />
            <div>
              <h3 className="text-lg font-semibold text-red-700">Verification Failed</h3>
              <p className="text-muted-foreground">{error}</p>
            </div>
            <Button onClick={retryDetection} variant="outline">
              Try Again
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Face Verification</CardTitle>
        <CardDescription>
          {type === 'enrol' 
            ? 'Register your face for secure identity verification'
            : 'Verify your identity using face recognition'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && status !== 'error' && (
          <Alert className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div ref={containerRef} className="min-h-[400px] flex items-center justify-center">
          {renderStatus()}
        </div>

        {/* Hidden canvas for processing */}
        <canvas
          ref={canvasRef}
          className="hidden"
          width={640}
          height={480}
        />
      </CardContent>
    </Card>
  )
}
