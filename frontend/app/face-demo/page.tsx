"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FaceDetection } from '@/components/kyc/FaceDetection'
import { FaceDetectionResult } from '@/hooks/useFaceDetection'
import { CheckCircle, XCircle, Eye, Shield, Smile, User } from 'lucide-react'

export default function FaceDemoPage() {
  const [result, setResult] = useState<FaceDetectionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleComplete = (faceResult: FaceDetectionResult) => {
    setResult(faceResult)
    setError(null)
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
    setResult(null)
  }

  const resetDemo = () => {
    setResult(null)
    setError(null)
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Face Detection Demo</h1>
        <p className="text-muted-foreground">
          Test the new Human library-based face detection and liveness verification
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Face Detection Component */}
        <div>
          <FaceDetection
            userId="demo-user"
            type="verify"
            onComplete={handleComplete}
            onError={handleError}
            minLivenessScore={0.7}
            minConfidence={0.8}
            requiredFrames={5}
          />
        </div>

        {/* Results Display */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detection Results</CardTitle>
              <CardDescription>
                Real-time face detection and liveness verification results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="font-medium text-green-700">Verification Successful</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Eye className="w-4 h-4 text-blue-500" />
                      <div>
                        <div className="text-sm font-medium">Liveness Score</div>
                        <div className="text-lg font-bold text-blue-600">
                          {Math.round(result.livenessScore * 100)}%
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-green-500" />
                      <div>
                        <div className="text-sm font-medium">Confidence</div>
                        <div className="text-lg font-bold text-green-600">
                          {Math.round(result.confidence * 100)}%
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-purple-500" />
                      <div>
                        <div className="text-sm font-medium">Anti-Spoof</div>
                        <div className="text-lg font-bold text-purple-600">
                          {Math.round(result.antispoofScore * 100)}%
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-orange-500" />
                      <div>
                        <div className="text-sm font-medium">Face Count</div>
                        <div className="text-lg font-bold text-orange-600">
                          {result.faceCount}
                        </div>
                      </div>
                    </div>
                  </div>

                  {result.emotion && (
                    <div className="flex items-center space-x-2">
                      <Smile className="w-4 h-4 text-yellow-500" />
                      <div>
                        <div className="text-sm font-medium">Detected Emotion</div>
                        <Badge variant="outline">{result.emotion}</Badge>
                      </div>
                    </div>
                  )}

                  {result.age && (
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-indigo-500" />
                      <div>
                        <div className="text-sm font-medium">Estimated Age</div>
                        <Badge variant="outline">{Math.round(result.age)} years</Badge>
                      </div>
                    </div>
                  )}

                  {result.gender && (
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-pink-500" />
                      <div>
                        <div className="text-sm font-medium">Gender</div>
                        <Badge variant="outline">{result.gender}</Badge>
                      </div>
                    </div>
                  )}

                  <div className="pt-4">
                    <Button onClick={resetDemo} variant="outline" className="w-full">
                      Test Again
                    </Button>
                  </div>
                </div>
              ) : error ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="font-medium text-red-700">Verification Failed</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <Button onClick={resetDemo} variant="outline" className="w-full">
                    Try Again
                  </Button>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <p>Start face detection to see results here</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Technical Details */}
          <Card>
            <CardHeader>
              <CardTitle>Technical Details</CardTitle>
              <CardDescription>
                Information about the face detection system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Library:</span>
                <Badge variant="outline">@vladmandic/human</Badge>
              </div>
              <div className="flex justify-between">
                <span>Backend:</span>
                <Badge variant="outline">WebGL</Badge>
              </div>
              <div className="flex justify-between">
                <span>Models:</span>
                <Badge variant="outline">MediaPipe + HSE</Badge>
              </div>
              <div className="flex justify-between">
                <span>Liveness Check:</span>
                <Badge variant="outline">Multi-factor</Badge>
              </div>
              <div className="flex justify-between">
                <span>Anti-Spoofing:</span>
                <Badge variant="outline">Enabled</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
