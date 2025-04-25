"use client"

import { useState, useEffect } from "react"
import {
  FileText,
  Trash2,
  RefreshCw,
  Search,
  Clock,
  Database,
  Layers,
  Upload,
  BarChart3,
  Settings,
  Building2,
  Cpu,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import UploadComponent from "@/components/upload-component"
import DataVisualization from "@/components/data-visualization"
import SimulationSettings from "@/components/simulation-settings"
import IoTSensors from "@/components/iot-sensors"

// Nota: Para que la aplicación funcione correctamente con Azure,
// es necesario configurar la variable de entorno AZURE_STORAGE_CONNECTION_STRING
// con la cadena de conexión de Azure Storage.

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("upload")
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)
  const [files, setFiles] = useState<any[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [processingData, setProcessingData] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])

  // Cargar datos desde localStorage al inicio
  useEffect(() => {
    try {
      const storedData = localStorage.getItem("simulationData")
      if (storedData) {
        setData(JSON.parse(storedData))
      }
    } catch (error) {
      console.error("Error al cargar datos desde localStorage:", error)
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

      // Eliminar de la lista de seleccionados si estaba seleccionado
      if (selectedFiles.includes(fileName)) {
        setSelectedFiles(selectedFiles.filter((f) => f !== fileName))
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

  const deleteSelectedFiles = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No hay archivos seleccionados",
        description: "Por favor, selecciona al menos un archivo para eliminar.",
        variant: "destructive",
      })
      return
    }

    if (!confirm(`¿Estás seguro de que deseas eliminar ${selectedFiles.length} archivo(s)?`)) {
      return
    }

    setIsLoading(true)
    let successCount = 0
    let errorCount = 0

    for (const fileName of selectedFiles) {
      try {
        const response = await fetch(`/api/azure/delete-file?fileName=${encodeURIComponent(fileName)}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          errorCount++
          continue
        }

        // Si el archivo eliminado era el seleccionado, limpiar la selección
        if (selectedFile === fileName) {
          setSelectedFile(null)
          setData([])
          localStorage.removeItem("simulationData")
        }

        successCount++
      } catch (error) {
        console.error(`Error deleting file ${fileName}:`, error)
        errorCount++
      }
    }

    // Actualizar la lista de archivos
    await fetchFilesList()

    // Limpiar la selección
    setSelectedFiles([])

    if (successCount > 0) {
      toast({
        title: "Archivos eliminados",
        description: `Se han eliminado ${successCount} archivo(s) correctamente.${errorCount > 0 ? ` ${errorCount} archivo(s) no pudieron ser eliminados.` : ""}`,
        variant: "default",
      })
    } else {
      toast({
        title: "Error al eliminar archivos",
        description: "No se pudo eliminar ningún archivo.",
        variant: "destructive",
      })
    }

    setIsLoading(false)
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
      setSelectedFiles([])

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

  const processData = () => {
    // Verificar si hay datos para procesar
    if (!selectedFile && files.length === 0) {
      toast({
        title: "No hay datos para procesar",
        description: "Por favor, sube un archivo o genera una simulación primero.",
        variant: "destructive",
      })
      return
    }

    // Si no hay un archivo seleccionado pero hay archivos disponibles, cargar el primero
    if (!selectedFile && files.length > 0) {
      fetchFile(files[0].name)
      return
    }

    // Si hay un archivo seleccionado, simular procesamiento
    setProcessingData(true)

    // Simular procesamiento de datos
    setTimeout(() => {
      setProcessingData(false)

      // Cambiar a la pestaña de visualización
      setActiveTab("data")

      toast({
        title: "Datos procesados",
        description: "Los datos han sido procesados correctamente y están listos para visualización.",
        variant: "default",
      })
    }, 2000)
  }

  const toggleFileSelection = (fileName: string) => {
    if (selectedFiles.includes(fileName)) {
      setSelectedFiles(selectedFiles.filter((f) => f !== fileName))
    } else {
      setSelectedFiles([...selectedFiles, fileName])
    }
  }

  const selectAllFiles = () => {
    if (selectedFiles.length === files.length) {
      // Si todos están seleccionados, deseleccionar todos
      setSelectedFiles([])
    } else {
      // Seleccionar todos
      setSelectedFiles(files.map((f) => f.name))
    }
  }

  const filteredFiles = files.filter((file) => file.name.toLowerCase().includes(searchQuery.toLowerCase()))

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

  // Corregir la función formatDate para manejar correctamente los tipos
  const formatDate = (dateString: string | undefined | null) => {
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

  // Corregir la función formatFileSize para manejar correctamente los tipos
  const formatFileSize = (bytes: number | undefined | null) => {
    if (!bytes) return "Tamaño desconocido"
    const units = ["B", "KB", "MB", "GB", "TB"]
    let i = 0
    let size = bytes
    for (i; size >= 1024 && i < units.length - 1; i++) {
      size /= 1024
    }
    return `${size.toFixed(2)} ${units[i]}`
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[url('/mall-background.jpg')] bg-cover bg-center bg-fixed">
      {/* Overlay para mejorar la legibilidad del contenido sobre la imagen de fondo */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/90 to-blue-100/80 backdrop-blur-sm z-0"></div>

      {/* Header restaurado */}
      <header className="relative z-10 bg-blue-900 text-white py-3 px-4 md:px-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="bg-green-500 p-1.5 md:p-2 rounded-full">
                <Building2 className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold tracking-tight">MALL TRAFFIC ANALYTICS</h1>
                <p className="text-xs md:text-sm text-green-300">Análisis avanzado de tráfico comercial</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content wrapper */}
      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "100%", maxWidth: "280px", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full bg-white/90 backdrop-blur-md border-r border-blue-200 overflow-y-auto z-10 shadow-lg"
            >
              <div className="p-3 md:p-4">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h2 className="text-lg md:text-xl font-bold text-blue-800 mono-heading">Archivos</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Layers className="h-4 w-4" />
                  </Button>
                </div>

                <div className="relative mb-3 md:mb-4">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-blue-400" />
                  <Input
                    type="search"
                    placeholder="Buscar archivos..."
                    className="pl-9 bg-white border-blue-200 text-blue-800 placeholder:text-blue-400 focus:ring-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="select-all"
                      className="rounded border-blue-600 text-blue-600 focus:ring-blue-500 bg-white"
                      checked={selectedFiles.length === files.length && files.length > 0}
                      onChange={selectAllFiles}
                    />
                    <label htmlFor="select-all" className="text-xs md:text-sm text-blue-800 font-medium mono-text">
                      {selectedFiles.length === files.length && files.length > 0
                        ? "Deseleccionar todos"
                        : "Seleccionar todos"}
                    </label>
                  </div>

                  {selectedFiles.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={deleteSelectedFiles}
                      disabled={isLoading}
                      className="h-7 md:h-8 text-xs"
                    >
                      {isLoading ? (
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3 mr-1" />
                      )}
                      Eliminar ({selectedFiles.length})
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  {isLoadingFiles ? (
                    <div className="space-y-2 md:space-y-3">
                      <Skeleton className="h-14 md:h-16 w-full rounded-md bg-blue-100" />
                      <Skeleton className="h-14 md:h-16 w-full rounded-md bg-blue-100" />
                      <Skeleton className="h-14 md:h-16 w-full rounded-md bg-blue-100" />
                    </div>
                  ) : filteredFiles.length === 0 ? (
                    <div className="text-center py-6 md:py-8">
                      <Database className="h-10 w-10 md:h-12 md:w-12 text-blue-400 mx-auto mb-2" />
                      <p className="text-blue-800 font-medium mono-text">No hay archivos disponibles</p>
                      <p className="text-blue-600 text-xs md:text-sm mono-text">
                        {searchQuery ? "No se encontraron resultados" : "Sube un archivo o genera una simulación"}
                      </p>
                    </div>
                  ) : (
                    filteredFiles.map((file) => (
                      <Card
                        key={file.name}
                        className={`border ${selectedFile === file.name ? "border-blue-500 bg-blue-50" : "border-blue-200 bg-white"} hover:border-blue-400 transition-all duration-200`}
                      >
                        <CardContent className="p-2 md:p-3">
                          <div className="flex items-start gap-2 md:gap-3">
                            <input
                              type="checkbox"
                              className="mt-1 rounded border-blue-600 text-blue-600 focus:ring-blue-500 bg-white"
                              checked={selectedFiles.includes(file.name)}
                              onChange={() => toggleFileSelection(file.name)}
                            />
                            <div className="flex-1 min-w-0">
                              <button
                                onClick={() => fetchFile(file.name)}
                                className={`text-left w-full truncate text-sm md:text-base font-medium ${selectedFile === file.name ? "text-blue-700" : "text-black"} hover:text-blue-800 mono-text`}
                                disabled={isLoading}
                              >
                                {file.name}
                              </button>
                              <div className="flex items-center text-xs text-blue-600 gap-1 md:gap-2 mt-1">
                                <Clock className="h-3 w-3" />
                                <span className="truncate text-xs mono-text">{formatDate(file.createdOn)}</span>
                              </div>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-blue-600 mono-text">{formatFileSize(file.size)}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteFile(file.name)
                                  }}
                                  disabled={isLoading}
                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>

                <div className="mt-4 flex justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchFilesList}
                    disabled={isLoadingFiles}
                    className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800 text-xs md:text-sm"
                  >
                    {isLoadingFiles ? (
                      <RefreshCw className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    )}
                    Actualizar
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteData()}
                    disabled={isLoading || files.length === 0}
                    className="text-xs md:text-sm"
                  >
                    <Trash2 className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    Eliminar todo
                  </Button>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main content */}
        <motion.div
          className="flex-1 flex flex-col overflow-hidden"
          animate={{
            marginLeft: sidebarOpen ? 0 : 0,
          }}
          transition={{ duration: 0.3 }}
        >
          {/* Main content area */}
          <main className="flex-1 overflow-auto p-3 md:p-6 w-full">
            <motion.div variants={container} initial="hidden" animate="show" className="w-full max-w-none">
              {/* Botón para mostrar/ocultar sidebar cuando está cerrado */}
              {!sidebarOpen && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="mb-4 border-blue-200 text-blue-600"
                >
                  <Layers className="h-4 w-4 mr-2" />
                  Mostrar archivos
                </Button>
              )}

              {/* Dashboard summary cards */}
              <motion.div
                variants={item}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-4 md:mb-8"
              >
                <Card className="border-blue-200 bg-white shadow-md hover:shadow-lg transition-all">
                  <CardContent className="p-3 md:p-6">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-xs md:text-sm font-medium text-blue-600 mono-text">Archivos Disponibles</p>
                        <h3 className="text-xl md:text-3xl font-bold text-blue-800 mono-heading mt-1">
                          {files.length}
                        </h3>
                      </div>
                      <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-2 md:p-3 rounded-full">
                        <FileText className="h-4 w-4 md:h-6 md:w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="mt-2 md:mt-4">
                      <Progress
                        value={files.length > 0 ? 100 : 0}
                        className="h-1 bg-blue-100"
                        indicatorClassName="bg-blue-500"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-white shadow-md hover:shadow-lg transition-all">
                  <CardContent className="p-3 md:p-6">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-xs md:text-sm font-medium text-blue-600 mono-text">Datos Procesados</p>
                        <h3 className="text-xl md:text-3xl font-bold text-blue-800 mono-heading mt-1">{data.length}</h3>
                      </div>
                      <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-2 md:p-3 rounded-full">
                        <BarChart3 className="h-4 w-4 md:h-6 md:w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="mt-2 md:mt-4">
                      <Progress
                        value={data.length > 0 ? 100 : 0}
                        className="h-1 bg-blue-100"
                        indicatorClassName="bg-blue-500"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-white shadow-md hover:shadow-lg transition-all">
                  <CardContent className="p-3 md:p-6">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-xs md:text-sm font-medium text-blue-600 mono-text">Estado de Azure</p>
                        <h3 className="text-xl md:text-3xl font-bold text-blue-800 mono-heading mt-1">Conectado</h3>
                      </div>
                      <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-2 md:p-3 rounded-full">
                        <Database className="h-4 w-4 md:h-6 md:w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="mt-2 md:mt-4">
                      <Progress value={100} className="h-1 bg-blue-100" indicatorClassName="bg-blue-500" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Main tabs - sin contenedor */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-white p-1 rounded-lg shadow-sm border border-blue-200 mb-4 md:mb-6 w-full flex">
                  <TabsTrigger
                    value="upload"
                    className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs md:text-sm text-blue-600"
                  >
                    <Upload className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                    Subir Archivo
                  </TabsTrigger>
                  <TabsTrigger
                    value="data"
                    className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs md:text-sm text-blue-600"
                  >
                    <BarChart3 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                    Estadísticas
                  </TabsTrigger>
                  <TabsTrigger
                    value="settings"
                    className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs md:text-sm text-blue-600"
                  >
                    <Settings className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                    Simulador
                  </TabsTrigger>
                  <TabsTrigger
                    value="iot"
                    className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs md:text-sm text-blue-600"
                  >
                    <Cpu className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                    IOT
                  </TabsTrigger>
                </TabsList>

                {/* Contenido de las pestañas sin contenedor */}
                <TabsContent value="upload" className="mt-0 w-full">
                  <UploadComponent onUploadComplete={fetchFilesList} />
                </TabsContent>

                <TabsContent value="data" className="mt-0 w-full">
                  <DataVisualization data={data} />
                </TabsContent>

                <TabsContent value="settings" className="mt-0 w-full">
                  <SimulationSettings />
                </TabsContent>

                <TabsContent value="iot" className="mt-0 w-full">
                  <IoTSensors />
                </TabsContent>
              </Tabs>
            </motion.div>
          </main>

          <footer className="bg-white text-blue-800 py-2 md:py-4 px-4 md:px-6 border-t border-blue-200 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4 w-full">
              <div className="text-xs md:text-sm text-blue-600 mono-text">
                © {new Date().getFullYear()} Mall Traffic Analytics. Todos los derechos reservados.
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-blue-200 text-blue-600 text-xs">
                  v1.0.0
                </Badge>
                <Badge variant="outline" className="border-blue-200 text-teal-600 text-xs">
                  Azure Storage Conectado
                </Badge>
              </div>
            </div>
          </footer>
        </motion.div>
      </div>
    </div>
  )
}
