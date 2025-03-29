"use client"

import { useState, useEffect } from "react"
import {
  Upload,
  Download,
  BarChart3,
  Settings,
  Building2,
  Users,
  ShoppingBag,
  FileText,
  Trash2,
  RefreshCw,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import UploadComponent from "@/components/upload-component"
import DataVisualization from "@/components/data-visualization"
import SimulationSettings from "@/components/simulation-settings"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"

// Nota: Para que la aplicación funcione correctamente con Azure,
// es necesario configurar la variable de entorno AZURE_STORAGE_CONNECTION_STRING
// con la cadena de conexión de Azure Storage.

export default function Home() {
  const [activeTab, setActiveTab] = useState("upload")
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)
  const [files, setFiles] = useState<any[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  // Cargar datos desde localStorage al inicio
  useEffect(() => {
    const storedData = localStorage.getItem("simulationData")
    if (storedData) {
      try {
        setData(JSON.parse(storedData))
      } catch (error) {
        console.error("Error al cargar datos desde localStorage:", error)
      }
    }

    // Cargar lista de archivos
    fetchFilesList()
  }, [])

  // Escuchar eventos de generación de datos
  useEffect(() => {
    const handleSimulationDataGenerated = (event: CustomEvent) => {
      setData(event.detail)
    }

    window.addEventListener("simulationDataGenerated", handleSimulationDataGenerated as EventListener)

    return () => {
      window.removeEventListener("simulationDataGenerated", handleSimulationDataGenerated as EventListener)
    }
  }, [])

  const fetchFilesList = async () => {
    setIsLoadingFiles(true)
    try {
      const response = await fetch("/api/azure/list-files")
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Error al cargar archivos: ${errorText}`)
      }

      const result = await response.json()
      setFiles(result.files || [])
    } catch (error) {
      console.error("Error fetching files:", error)
      toast({
        title: "Error al cargar archivos",
        description: `${error instanceof Error ? error.message : "Error desconocido"}`,
        variant: "destructive",
      })
    } finally {
      setIsLoadingFiles(false)
    }
  }

  const fetchFile = async (fileName: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/azure/get-file?fileName=${encodeURIComponent(fileName)}`)
      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = "No se pudo cargar el archivo seleccionado"

        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.message || errorMessage
        } catch (e) {
          console.error("Error al parsear respuesta de error:", errorText)
        }

        throw new Error(errorMessage)
      }

      const fetchedData = await response.json()

      // Formatear la hora en el formato deseado
      const formattedData = fetchedData.map((item) => {
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

      setData(formattedData)

      // Guardar en localStorage para uso futuro
      localStorage.setItem("simulationData", JSON.stringify(formattedData))

      // Actualizar el archivo seleccionado
      setSelectedFile(fileName)

      toast({
        title: "Archivo cargado",
        description: `Se ha cargado el archivo ${fileName} correctamente.`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error fetching file:", error)
      toast({
        title: "Error al cargar archivo",
        description: `${error instanceof Error ? error.message : "Error desconocido"}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Verificar si hay archivos disponibles
      if (files.length === 0) {
        toast({
          title: "No hay archivos disponibles",
          description:
            "No hay archivos en Azure para cargar. Por favor, sube un archivo o genera una simulación primero.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Cargar el archivo más reciente
      await fetchFile(files[0].name)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error al cargar datos",
        description: `${error instanceof Error ? error.message : "Error desconocido"}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const deleteFile = async (fileName: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar el archivo ${fileName}?`)) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/azure/delete-file?fileName=${encodeURIComponent(fileName)}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = "No se pudo eliminar el archivo"

        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.message || errorMessage
        } catch (e) {
          console.error("Error al parsear respuesta de error:", errorText)
        }

        throw new Error(errorMessage)
      }

      // Actualizar la lista de archivos
      await fetchFilesList()

      // Si el archivo eliminado era el seleccionado, limpiar la selección
      if (selectedFile === fileName) {
        setSelectedFile(null)
        setData([])
        localStorage.removeItem("simulationData")
      }

      toast({
        title: "Archivo eliminado",
        description: `El archivo ${fileName} ha sido eliminado correctamente.`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error deleting file:", error)
      toast({
        title: "Error al eliminar archivo",
        description: `${error instanceof Error ? error.message : "Error desconocido"}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const deleteData = async (deleteAll = true) => {
    if (
      !confirm(
        deleteAll
          ? "¿Estás seguro de que deseas eliminar TODOS los datos?"
          : "¿Estás seguro de que deseas eliminar los datos seleccionados?",
      )
    ) {
      return
    }

    setIsLoading(true)
    try {
      // Eliminar datos de la API
      const response = await fetch(`/api/azure/delete-data?deleteAll=${deleteAll}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = "No se pudieron eliminar los datos"

        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.message || errorMessage
        } catch (e) {
          console.error("Error al parsear respuesta de error:", errorText)
        }

        throw new Error(errorMessage)
      }

      // Eliminar datos de localStorage
      localStorage.removeItem("simulationData")
      setData([])
      setSelectedFile(null)

      // Actualizar la lista de archivos
      await fetchFilesList()

      toast({
        title: "Datos eliminados",
        description: "Todos los datos han sido eliminados correctamente.",
        variant: "default",
      })
    } catch (error) {
      console.error("Error deleting data:", error)
      toast({
        title: "Error al eliminar datos",
        description: `${error instanceof Error ? error.message : "Error desconocido"}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Fecha desconocida"
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return "Tamaño desconocido"
    const units = ["B", "KB", "MB", "GB"]
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`
  }

  return (
    <div className="min-h-screen mall-bg mall-pattern">
      <header className="analytics-header text-white py-10 px-4 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-10 -top-10 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute left-1/4 -bottom-24 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                <Building2 className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight mono-heading">ANÁLISIS DE TRÁFICO</h1>
                <p className="text-blue-100 mt-1 font-light tracking-wider mono-text">
                  SISTEMA DE MONITOREO DE AFLUENCIA EN CENTROS COMERCIALES
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-8 px-4">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={item}>
            <Card className="data-card shadow-md hover:shadow-lg transition-all duration-300 h-full">
              <CardContent className="p-6 flex flex-col items-center text-center h-full">
                <div className="bg-blue-600 text-white p-3 rounded-full mb-4 shadow-md">
                  <Users className="h-6 w-6" />
                </div>
                <CardTitle className="text-blue-800 mb-3 text-xl font-semibold tracking-tight mono-heading">
                  ANÁLISIS DE VISITANTES
                </CardTitle>
                <p className="text-blue-700 leading-relaxed mono-text">
                  Monitorea en tiempo real la afluencia de personas en diferentes zonas del centro comercial para
                  optimizar la experiencia del cliente.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="data-card shadow-md hover:shadow-lg transition-all duration-300 h-full">
              <CardContent className="p-6 flex flex-col items-center text-center h-full">
                <div className="bg-teal-600 text-white p-3 rounded-full mb-4 shadow-md">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <CardTitle className="text-teal-800 mb-3 text-xl font-semibold tracking-tight mono-heading">
                  OPTIMIZACIÓN COMERCIAL
                </CardTitle>
                <p className="text-teal-700 leading-relaxed mono-text">
                  Identifica patrones de tráfico para mejorar estratégicamente la ubicación de tiendas, promociones y
                  maximizar las ventas.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="data-card shadow-md hover:shadow-lg transition-all duration-300 h-full">
              <CardContent className="p-6 flex flex-col items-center text-center h-full">
                <div className="bg-emerald-600 text-white p-3 rounded-full mb-4 shadow-md">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <CardTitle className="text-emerald-800 mb-3 text-xl font-semibold tracking-tight mono-heading">
                  REPORTES DETALLADOS
                </CardTitle>
                <p className="text-emerald-700 leading-relaxed mono-text">
                  Genera informes y visualizaciones avanzadas para tomar decisiones estratégicas basadas en datos
                  precisos y actualizados.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-6 mb-8 border border-gray-200 mall-grid"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 mb-8 bg-gray-100 p-1 rounded-lg">
              <TabsTrigger
                value="upload"
                className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md transition-all mono-text"
              >
                <Upload className="h-4 w-4" />
                <span className="tracking-wide">SUBIR DATOS</span>
              </TabsTrigger>
              <TabsTrigger
                value="download"
                className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md transition-all mono-text"
              >
                <Download className="h-4 w-4" />
                <span className="tracking-wide">DESCARGAR DATOS</span>
              </TabsTrigger>
              <TabsTrigger
                value="visualization"
                className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md transition-all mono-text"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="tracking-wide">VISUALIZACIÓN</span>
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md transition-all mono-text"
              >
                <Settings className="h-4 w-4" />
                <span className="tracking-wide">SIMULADOR</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload">
              <Card className="data-card shadow-md overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-t-lg">
                  <CardTitle className="text-blue-800 text-xl font-semibold tracking-tight mono-heading">
                    SUBIR DATOS
                  </CardTitle>
                  <CardDescription className="text-blue-600 tracking-wide mono-text">
                    Sube archivos CSV o JSON generados por la simulación
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <UploadComponent />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="download">
              <Card className="data-card shadow-md overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-t-lg">
                  <CardTitle className="text-blue-800 text-xl font-semibold tracking-tight mono-heading">
                    DESCARGAR DATOS
                  </CardTitle>
                  <CardDescription className="text-blue-600 tracking-wide mono-text">
                    Recupera los datos almacenados
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={fetchData}
                        disabled={isLoading || files.length === 0}
                        className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 transition-all shadow-md mono-text"
                      >
                        {isLoading ? (
                          <span className="flex items-center gap-2">
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            CARGANDO...
                          </span>
                        ) : (
                          "OBTENER DATOS RECIENTES"
                        )}
                      </Button>

                      <Button
                        onClick={() => deleteData(true)}
                        disabled={isLoading || files.length === 0}
                        variant="destructive"
                        className="w-full md:w-auto shadow-md mono-text"
                      >
                        {isLoading ? "PROCESANDO..." : "BORRAR TODOS LOS DATOS"}
                      </Button>

                      <Button
                        onClick={fetchFilesList}
                        disabled={isLoadingFiles}
                        variant="outline"
                        className="w-full md:w-auto border-blue-300 text-blue-700 hover:bg-blue-50 shadow-sm mono-text"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        ACTUALIZAR LISTA
                      </Button>
                    </div>

                    <div className="border rounded-lg border-blue-200 overflow-hidden">
                      <div className="bg-blue-50 p-3 border-b border-blue-200">
                        <h3 className="font-medium text-blue-800 tracking-wide mono-heading">
                          ARCHIVOS DISPONIBLES EN AZURE
                        </h3>
                      </div>
                      <div className="divide-y divide-blue-100 max-h-64 overflow-auto">
                        {isLoadingFiles ? (
                          <div className="p-4 space-y-3">
                            <Skeleton className="h-12 w-full bg-blue-100" />
                            <Skeleton className="h-12 w-full bg-blue-100" />
                            <Skeleton className="h-12 w-full bg-blue-100" />
                          </div>
                        ) : files.length === 0 ? (
                          <div className="p-6 text-center text-blue-500">
                            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="mono-text">No hay archivos disponibles en Azure.</p>
                            <p className="text-sm text-blue-400 mt-1 mono-text">
                              Sube un archivo o genera una simulación.
                            </p>
                          </div>
                        ) : (
                          files.map((file, index) => (
                            <div
                              key={index}
                              className={`p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                                selectedFile === file.name ? "bg-blue-50" : "hover:bg-blue-50"
                              }`}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-5 w-5 text-blue-600" />
                                  <span className="font-medium text-blue-700 truncate max-w-[200px] sm:max-w-xs mono-text">
                                    {file.name}
                                  </span>
                                  {selectedFile === file.name && (
                                    <Badge className="bg-blue-600 mono-text">SELECCIONADO</Badge>
                                  )}
                                </div>
                                <div className="text-xs text-blue-500 mt-1 ml-7 mono-text">
                                  {formatDate(file.createdOn)} • {formatFileSize(file.size)}
                                </div>
                              </div>
                              <div className="flex gap-2 ml-7 sm:ml-0">
                                <Button
                                  size="sm"
                                  onClick={() => fetchFile(file.name)}
                                  disabled={isLoading || selectedFile === file.name}
                                  className="bg-blue-600 hover:bg-blue-700 mono-text"
                                >
                                  CARGAR
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteFile(file.name)}
                                  disabled={isLoading}
                                  className="border-red-300 text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {data.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-lg font-medium mb-2 text-blue-800 tracking-wide mono-heading">
                          DATOS CARGADOS
                        </h3>
                        {selectedFile && (
                          <div className="mb-2">
                            <Badge className="bg-blue-600 mb-2 mono-text">ARCHIVO: {selectedFile}</Badge>
                          </div>
                        )}
                        <div className="border rounded-md p-4 max-h-96 overflow-auto bg-blue-50 shadow-inner border-blue-200">
                          <pre className="text-sm text-blue-700 font-mono">{JSON.stringify(data, null, 2)}</pre>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            className="border-blue-300 text-blue-700 hover:bg-blue-50 shadow-sm mono-text"
                            onClick={() => {
                              const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
                              const url = URL.createObjectURL(blob)
                              const a = document.createElement("a")
                              a.href = url
                              a.download = "simulacion_afluencia.json"
                              a.click()
                            }}
                          >
                            DESCARGAR JSON
                          </Button>
                          <Button
                            variant="outline"
                            className="border-blue-300 text-blue-700 hover:bg-blue-50 shadow-sm mono-text"
                            onClick={() => {
                              // Simple CSV conversion
                              if (data.length === 0) return
                              const headers = Object.keys(data[0]).join(",")
                              const csvRows = data.map((row) =>
                                Object.values(row)
                                  .map((value) => (typeof value === "string" ? `"${value}"` : value))
                                  .join(","),
                              )
                              const csvContent = [headers, ...csvRows].join("\n")

                              const blob = new Blob([csvContent], { type: "text/csv" })
                              const url = URL.createObjectURL(blob)
                              const a = document.createElement("a")
                              a.href = url
                              a.download = "simulacion_afluencia.csv"
                              a.click()
                            }}
                          >
                            DESCARGAR CSV
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="visualization">
              <Card className="data-card shadow-md overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-t-lg">
                  <CardTitle className="text-blue-800 text-xl font-semibold tracking-tight mono-heading">
                    VISUALIZACIÓN DE DATOS
                  </CardTitle>
                  <CardDescription className="text-blue-600 tracking-wide mono-text">
                    Visualiza los patrones de tráfico en el centro comercial
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <DataVisualization data={data} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card className="data-card shadow-md overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-t-lg">
                  <CardTitle className="text-blue-800 text-xl font-semibold tracking-tight mono-heading">
                    SIMULADOR
                  </CardTitle>
                  <CardDescription className="text-blue-600 tracking-wide mono-text">
                    Configura los parámetros para generar nuevos datos de simulación
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <SimulationSettings />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      <footer className="bg-gradient-to-r from-blue-900 to-teal-800 text-white py-10 px-4 mt-8">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 tracking-wide mono-heading">
                <Building2 className="h-5 w-5" />
                ANÁLISIS DE TRÁFICO
              </h3>
              <p className="text-blue-200 mono-text">
                Sistema avanzado para el monitoreo y análisis de patrones de tráfico en centros comerciales.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 tracking-wide mono-heading">CARACTERÍSTICAS</h3>
              <ul className="space-y-2 text-blue-200 mono-text">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-400"></div>
                  Visualización de datos en tiempo real
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-teal-400"></div>
                  Análisis por zonas y categorías
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400"></div>
                  Simulación de escenarios
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-400"></div>
                  Integración con Azure Storage
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 tracking-wide mono-heading">CONTACTO</h3>
              <p className="text-blue-200 mb-4 mono-text">
                Para soporte técnico o consultas sobre el sistema, contáctenos en:
              </p>
              <a
                href="mailto:soporte@analisisdetrafico.com"
                className="flex items-center gap-2 text-blue-300 hover:text-blue-200 transition-colors mono-text"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                soporte@analisisdetrafico.com
              </a>
            </div>
          </div>

          <div className="border-t border-blue-700 mt-8 pt-6 text-center text-blue-300 mono-text">
            <p>© {new Date().getFullYear()} ANÁLISIS DE TRÁFICO EN CENTRO COMERCIAL. TODOS LOS DERECHOS RESERVADOS.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

