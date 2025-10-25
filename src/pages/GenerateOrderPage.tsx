import { useState, useRef } from 'react'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IconUpload, IconX, IconCheck, IconAlertCircle, IconRobot } from "@tabler/icons-react"
import { processFileWithGemini, validateExtractedData } from '@/services/gemini-ai-service'
import { createOrderFromExtractedData } from '@/services/order-processing-service'
import type { Order } from '@/types/order-types'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'

interface UploadedFile {
  id: string
  file: File
  status: 'uploading' | 'processing' | 'success' | 'error'
  error?: string
  order?: Order
}

interface GenerateOrderPageProps {
  onNavigate: (page: 'dashboard' | 'generate-order' | 'order-tracking') => void
}

export default function GenerateOrderPage({ onNavigate }: GenerateOrderPageProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const acceptedExtensions = ['.pdf', '.csv', '.xls', '.xlsx']
  const maxFileSize = 10 * 1024 * 1024 // 10MB

  const validateFile = (file: File): string | null => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    
    if (!acceptedExtensions.includes(fileExtension)) {
      return `File type not supported. Please upload PDF, CSV, or Excel files.`
    }
    
    if (file.size > maxFileSize) {
      return `File size too large. Maximum size is 10MB.`
    }
    
    return null
  }

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return

    Array.from(files).forEach(async (file) => {
      const error = validateFile(file)
      const fileId = Date.now().toString() + Math.random().toString(36).substr(2, 9)
      
      const newFile: UploadedFile = {
        id: fileId,
        file,
        status: error ? 'error' : 'uploading',
        error: error || undefined
      }

      setUploadedFiles(prev => [...prev, newFile])

      // Process file with Gemini AI
      if (!error) {
        try {
          // Update status to processing
          setUploadedFiles(prev => 
            prev.map(f => f.id === fileId ? { ...f, status: 'processing' } : f)
          )

          toast.info(`Procesando archivo con IA: ${file.name}`)

          // Extract data using Gemini AI
          const extractedData = await processFileWithGemini(file)
          
          // Validate extracted data
          const validation = validateExtractedData(extractedData)
          if (!validation.valid) {
            throw new Error(`Datos inválidos: ${validation.errors.join(', ')}`)
          }

          // Create order from extracted data
          const result = await createOrderFromExtractedData(extractedData, file.name)
          
          if (!result.success) {
            throw new Error(result.error || 'Error al crear la orden')
          }

          // Update file status to success
          setUploadedFiles(prev => 
            prev.map(f => f.id === fileId ? { 
              ...f, 
              status: 'success',
              order: result.order 
            } : f)
          )

          toast.success(`✅ Orden creada: ${result.order?.order_number}`, {
            description: `Cliente: ${result.order?.airline_name} | Total: $${result.order?.total.toFixed(2)}`
          })

          if (result.warnings && result.warnings.length > 0) {
            toast.warning('Advertencias al procesar', {
              description: result.warnings.join(', ')
            })
          }

        } catch (error) {
          console.error('Error procesando archivo:', error)
          setUploadedFiles(prev => 
            prev.map(f => f.id === fileId ? { 
              ...f, 
              status: 'error',
              error: error instanceof Error ? error.message : 'Error desconocido'
            } : f)
          )
          
          toast.error('Error al procesar archivo', {
            description: error instanceof Error ? error.message : 'Error desconocido'
          })
        }
      }
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileUpload(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files)
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf':
        return '📄'
      case 'csv':
        return '📊'
      case 'xls':
      case 'xlsx':
        return '📈'
      default:
        return '📁'
    }
  }

  const getFileTypeColor = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'csv':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'xls':
      case 'xlsx':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const processFiles = () => {
    const validFiles = uploadedFiles.filter(f => f.status === 'success')
    if (validFiles.length === 0) {
      toast.error('No hay archivos válidos para procesar')
      return
    }
    
    const totalOrders = validFiles.filter(f => f.order).length
    const totalAmount = validFiles
      .filter(f => f.order)
      .reduce((sum, f) => sum + (f.order?.total || 0), 0)
    
    toast.success(`${totalOrders} orden(es) procesada(s)`, {
      description: `Total general: $${totalAmount.toFixed(2)}`
    })
  }

  const clearAllFiles = () => {
    setUploadedFiles([])
    toast.info('Archivos eliminados')
  }

  return (
    <>
      <Toaster />
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" onNavigate={onNavigate} />
        <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="mb-6">
                  <h1 className="text-3xl font-bold tracking-tight">Generate Order</h1>
                  <p className="text-muted-foreground">
                    Upload PDF, CSV, or Excel files to generate orders automatically
                  </p>
                </div>

                <div className="grid gap-6">
                  {/* File Upload Area */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Upload Files</CardTitle>
                      <CardDescription>
                        Drag and drop files here or click to browse. Supported formats: PDF, CSV, Excel (.xls, .xlsx)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                          isDragOver
                            ? 'border-primary bg-primary/5'
                            : 'border-muted-foreground/25 hover:border-primary/50'
                        }`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                      >
                        <IconUpload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <div className="space-y-2">
                          <p className="text-lg font-medium">
                            Drop files here or{' '}
                            <button
                              type="button"
                              className="text-primary hover:underline"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              browse
                            </button>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Maximum file size: 10MB
                          </p>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept=".pdf,.csv,.xls,.xlsx"
                          onChange={handleFileInputChange}
                          className="hidden"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Uploaded Files List */}
                  {uploadedFiles.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Uploaded Files</CardTitle>
                        <CardDescription>
                          {uploadedFiles.length} file(s) uploaded
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {uploadedFiles.map((file) => (
                            <div
                              key={file.id}
                              className="p-3 border rounded-lg"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <span className="text-2xl">
                                    {getFileIcon(file.file.name)}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {file.file.name}
                                    </p>
                                    <div className="flex items-center space-x-2">
                                      <Badge
                                        variant="secondary"
                                        className={`text-xs ${getFileTypeColor(file.file.name)}`}
                                      >
                                        {file.file.name.split('.').pop()?.toUpperCase()}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {(file.file.size / 1024 / 1024).toFixed(2)} MB
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {file.status === 'uploading' && (
                                    <div className="flex items-center space-x-1 text-blue-600">
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                      <span className="text-xs">Subiendo...</span>
                                    </div>
                                  )}
                                  {file.status === 'processing' && (
                                    <div className="flex items-center space-x-1 text-purple-600">
                                      <IconRobot className="h-4 w-4 animate-pulse" />
                                      <span className="text-xs">Procesando con IA...</span>
                                    </div>
                                  )}
                                  {file.status === 'success' && (
                                    <div className="flex items-center space-x-1 text-green-600">
                                      <IconCheck className="h-4 w-4" />
                                      <span className="text-xs">Orden creada</span>
                                    </div>
                                  )}
                                  {file.status === 'error' && (
                                    <div className="flex items-center space-x-1 text-red-600">
                                      <IconAlertCircle className="h-4 w-4" />
                                      <span className="text-xs">Error</span>
                                    </div>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFile(file.id)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <IconX className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Order Details */}
                              {file.order && (
                                <div className="mt-3 p-3 bg-muted/50 rounded-md border">
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                      <span className="font-semibold">Orden:</span> {file.order.order_number}
                                    </div>
                                    <div>
                                      <span className="font-semibold">Cliente:</span> {file.order.airline_name}
                                    </div>
                                    <div>
                                      <span className="font-semibold">Items:</span> {file.order.items.length}
                                    </div>
                                    <div>
                                      <span className="font-semibold">Total:</span> ${file.order.total.toFixed(2)}
                                    </div>
                                    <div className="col-span-2">
                                      <span className="font-semibold">Entrega:</span>{' '}
                                      {new Date(file.order.fecha_entrega_solicitada).toLocaleDateString('es-MX')}
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Error Details */}
                              {file.error && (
                                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-600 dark:text-red-400">
                                  {file.error}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Action Buttons */}
                  {uploadedFiles.length > 0 && (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-muted-foreground">
                            {uploadedFiles.filter(f => f.status === 'success').length} orden(es) creada(s) de {uploadedFiles.length} archivo(s)
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={clearAllFiles}
                              variant="outline"
                              className="min-w-32"
                            >
                              <IconX className="mr-2 h-4 w-4" />
                              Limpiar Todo
                            </Button>
                            <Button
                              onClick={processFiles}
                              disabled={uploadedFiles.filter(f => f.status === 'success').length === 0}
                              className="min-w-32"
                            >
                              <IconCheck className="mr-2 h-4 w-4" />
                              Ver Resumen
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
    </>
  )
}
