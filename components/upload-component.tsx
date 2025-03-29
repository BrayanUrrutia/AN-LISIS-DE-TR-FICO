"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, FileUp, Check, AlertCircle, FileJson, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"

export default function UploadComponent() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle")
  const [statusMessage, setStatusMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (
        selectedFile.type === "application/json" ||
        selectedFile.type === "text/csv" ||
        selectedFile.name.endsWith(".json") ||
        selectedFile.name.endsWith(".csv")
      ) {
        setFile(selectedFile)
        setUploadStatus("idle")
      } else {
        setStatusMessage("Por favor selecciona un archivo JSON o CSV")
        setUploadStatus("error")
        toast({
          title: "Formato no válido",
          description: "Por favor selecciona un archivo JSON o CSV",
          variant: "destructive",
        })
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (
        droppedFile.type === "application/json" ||
        droppedFile.type === "text/csv" ||
        droppedFile.name.endsWith(".json") ||
        droppedFile.name.endsWith(".csv")
      ) {
        setFile(droppedFile)
        setUploadStatus("idle")
      } else {
        setStatusMessage("Por favor selecciona un archivo JSON o CSV")
        setUploadStatus("error")
        toast({
          title: "Formato no válido",
          description: "Por favor selecciona un archivo JSON o CSV",
          variant: "destructive",
        })
      }
    }
  }

  const uploadFile = async () => {
    if (!file) return

    setUploading(true)
    setUploadProgress(0)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressInterval)
          return 95
        }
        return prev + 5
      })
    }, 200)

    try {
      // Crear FormData para enviar el archivo
      const formData = new FormData()
      formData.append("file", file)

      // Enviar a la nueva API en app/api
      const response = await fetch("/api/azure/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = "Error desconocido al procesar el archivo"

        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.message || errorMessage
        } catch (e) {
          console.error("Error al parsear respuesta de error:", errorText)
        }

        throw new Error(errorMessage)
      }

      const result = await response.json()

      // Si la respuesta es exitosa, actualizar los datos
      if (result.data) {
        // Formatear la hora en el formato deseado
        const formattedData = result.data.map((item) => {
          if (item.Timestamp) {
            const date = new Date(item.Timestamp)
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, "0")
            const day = String(date.getDate()).padStart(2, "0")
            const hours = String(date.getHours()).padStart(2, "0")
            const minutes = String(date.getMinutes()).padStart(2, "0")
            const seconds = String(date.getSeconds()).padStart(2, "0")

            item.Timestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
          }
          return item
        })

        // Guardar en localStorage
        localStorage.setItem("simulationData", JSON.stringify(formattedData))

        // Actualizar la página para mostrar los nuevos datos
        window.dispatchEvent(new CustomEvent("simulationDataGenerated", { detail: formattedData }))
      }

      clearInterval(progressInterval)
      setUploadProgress(100)
      setUploadStatus("success")
      setStatusMessage(result.message || "Archivo procesado exitosamente")

      toast({
        title: "Archivo procesado",
        description: result.message || "Archivo procesado exitosamente",
        variant: "default",
      })

      setTimeout(() => {
        setUploadProgress(0)
        setFile(null) // Limpiar el archivo después de subir exitosamente
      }, 1000)
    } catch (error) {
      clearInterval(progressInterval)
      setUploadStatus("error")
      setStatusMessage(`Error al procesar el archivo: ${error instanceof Error ? error.message : String(error)}`)
      setUploadProgress(0)

      toast({
        title: "Error al procesar archivo",
        description: `${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const getFileIcon = () => {
    if (!file) return <Upload className="h-10 w-10 text-blue-400" />

    if (file.type === "application/json" || file.name.endsWith(".json")) {
      return <FileJson className="h-10 w-10 text-blue-500" />
    } else {
      return <FileSpreadsheet className="h-10 w-10 text-green-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div
        className="border-2 border-dashed rounded-lg p-10 text-center cursor-pointer hover:bg-blue-50 transition-colors border-blue-200"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json,.csv" className="hidden" />
        <div className="flex flex-col items-center justify-center gap-3">
          {getFileIcon()}
          <h3 className="text-lg font-medium text-blue-800">Arrastra y suelta tu archivo aquí</h3>
          <p className="text-sm text-blue-600">O haz clic para seleccionar un archivo (JSON o CSV)</p>
        </div>
      </div>

      {file && (
        <Card className="p-4 border-blue-200 bg-blue-50">
          <div className="flex items-center gap-3">
            <FileUp className="h-6 w-6 text-indigo-600" />
            <div className="flex-1">
              <p className="font-medium text-indigo-800">{file.name}</p>
              <p className="text-sm text-indigo-600">
                {(file.size / 1024).toFixed(2)} KB •{" "}
                {file.type || (file.name.endsWith(".json") ? "application/json" : "text/csv")}
              </p>
            </div>
            <Button onClick={uploadFile} disabled={uploading} className="bg-blue-600 hover:bg-blue-700">
              {uploading ? "Procesando..." : "Procesar Archivo"}
            </Button>
          </div>

          {uploading && (
            <div className="mt-4">
              <Progress value={uploadProgress} className="h-2 bg-blue-200" indicatorClassName="bg-blue-600" />
              <p className="text-xs text-right mt-1 text-blue-700">{uploadProgress}%</p>
            </div>
          )}
        </Card>
      )}

      {uploadStatus !== "idle" && (
        <Alert
          variant={uploadStatus === "success" ? "default" : "destructive"}
          className={uploadStatus === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : ""}
        >
          {uploadStatus === "success" ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>{uploadStatus === "success" ? "Éxito" : "Error"}</AlertTitle>
          <AlertDescription>{statusMessage}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

