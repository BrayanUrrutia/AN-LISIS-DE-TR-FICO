"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Settings2 } from "lucide-react"

export default function SimulationSettings() {
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("22:00")
  const [timeInterval, setTimeInterval] = useState("10")
  const [simulationDate, setSimulationDate] = useState("2024-02-23")
  const [useCustomFactors, setUseCustomFactors] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStatus, setGenerationStatus] = useState<string | null>(null)

  // Factores de clima
  const [climaFactores, setClimaFactores] = useState({
    Soleado: 1.0,
    Lluvioso: 0.7,
    Nublado: 0.9,
  })

  // Factores de día
  const [diaFactores, setDiaFactores] = useState({
    Lunes: 0.8,
    Martes: 0.9,
    Miércoles: 1.0,
    Jueves: 1.1,
    Viernes: 1.2,
    Sábado: 1.5,
    Domingo: 1.3,
  })

  // Descuentos por día
  const [descuentosDia, setDescuentosDia] = useState({
    Lunes: 0,
    Martes: 10,
    Miércoles: 0,
    Jueves: 15,
    Viernes: 0,
    Sábado: 0,
    Domingo: 20,
  })

  const handleGenerateSimulation = async () => {
    setIsGenerating(true)
    setGenerationStatus(null)

    try {
      // Intentar guardar en el servidor (que luego intentará guardar en Azure)
      const response = await fetch("/api/azure/generate-simulation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startTime,
          endTime,
          timeInterval,
          simulationDate,
          useCustomFactors,
          climaFactores: useCustomFactors ? climaFactores : undefined,
          diaFactores: useCustomFactors ? diaFactores : undefined,
          descuentosDia: useCustomFactors ? descuentosDia : undefined,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = "Error desconocido al generar simulación"

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

      setGenerationStatus(result.message || "Simulación generada exitosamente")

      toast({
        title: "Simulación generada",
        description: result.message || "Simulación generada exitosamente",
        variant: "default",
      })
    } catch (error) {
      setGenerationStatus(`Error al generar simulación: ${error instanceof Error ? error.message : String(error)}`)

      toast({
        title: "Error al generar simulación",
        description: `${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card className="border-blue-200 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Settings2 className="h-5 w-5 text-blue-600" />
                <h3 className="font-medium text-blue-800">Parámetros Básicos</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="simulation-date" className="text-blue-700">
                    Fecha de Simulación
                  </Label>
                  <Input
                    id="simulation-date"
                    type="date"
                    value={simulationDate}
                    onChange={(e) => setSimulationDate(e.target.value)}
                    className="border-blue-200 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-time" className="text-blue-700">
                      Hora de Inicio
                    </Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="border-blue-200 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-time" className="text-blue-700">
                      Hora de Fin
                    </Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="border-blue-200 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="time-interval" className="text-indigo-700">
                    Intervalo de Tiempo (minutos)
                  </Label>
                  <Select value={timeInterval} onValueChange={setTimeInterval}>
                    <SelectTrigger id="time-interval" className="border-indigo-200 focus:ring-indigo-500">
                      <SelectValue placeholder="Seleccionar intervalo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 minutos</SelectItem>
                      <SelectItem value="10">10 minutos</SelectItem>
                      <SelectItem value="15">15 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-blue-200 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-blue-600" />
                  <h3 className="font-medium text-blue-800">Factores Personalizados</h3>
                </div>
                <Switch
                  id="custom-factors"
                  checked={useCustomFactors}
                  onCheckedChange={setUseCustomFactors}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>

              <AnimatePresence mode="wait">
                {useCustomFactors ? (
                  <motion.div
                    key="expanded"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-indigo-700">Factores de Clima</h4>
                      {Object.entries(climaFactores).map(([clima, factor]) => (
                        <div key={clima} className="grid grid-cols-[1fr_120px] gap-4 items-center mb-2">
                          <Label htmlFor={`clima-${clima}`} className="text-indigo-600">
                            {clima}
                          </Label>
                          <div className="flex items-center gap-2">
                            <Slider
                              id={`clima-${clima}`}
                              min={0}
                              max={2}
                              step={0.1}
                              value={[factor]}
                              onValueChange={(value) =>
                                setClimaFactores({
                                  ...climaFactores,
                                  [clima]: value[0],
                                })
                              }
                              className="data-[state=checked]:bg-blue-600"
                            />
                            <span className="text-sm w-8 text-right text-indigo-700">{factor.toFixed(1)}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator className="bg-blue-200" />

                    <div>
                      <h4 className="text-sm font-medium mb-2 text-indigo-700">Factores de Día</h4>
                      {Object.entries(diaFactores).map(([dia, factor]) => (
                        <div key={dia} className="grid grid-cols-[1fr_120px] gap-4 items-center mb-2">
                          <Label htmlFor={`dia-${dia}`} className="text-indigo-600">
                            {dia}
                          </Label>
                          <div className="flex items-center gap-2">
                            <Slider
                              id={`dia-${dia}`}
                              min={0}
                              max={2}
                              step={0.1}
                              value={[factor]}
                              onValueChange={(value) =>
                                setDiaFactores({
                                  ...diaFactores,
                                  [dia]: value[0],
                                })
                              }
                              className="data-[state=checked]:bg-blue-600"
                            />
                            <span className="text-sm w-8 text-right text-indigo-700">{factor.toFixed(1)}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator className="bg-blue-200" />

                    <div>
                      <h4 className="text-sm font-medium mb-2 text-indigo-700">Descuentos por Día (%)</h4>
                      {Object.entries(descuentosDia).map(([dia, descuento]) => (
                        <div key={dia} className="grid grid-cols-[1fr_120px] gap-4 items-center mb-2">
                          <Label htmlFor={`descuento-${dia}`} className="text-indigo-600">
                            {dia}
                          </Label>
                          <Input
                            id={`descuento-${dia}`}
                            type="number"
                            min="0"
                            max="100"
                            value={descuento}
                            onChange={(e) =>
                              setDescuentosDia({
                                ...descuentosDia,
                                [dia]: Number.parseInt(e.target.value) || 0,
                              })
                            }
                            className="border-indigo-200 focus:ring-indigo-500"
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="collapsed"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-center py-4 text-blue-600"
                  >
                    <p>Activa los factores personalizados para configurar valores específicos.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleGenerateSimulation}
          disabled={isGenerating}
          className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 transition-all shadow-md"
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Generando...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Generar Simulación
            </span>
          )}
        </Button>
      </div>

      {generationStatus && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertDescription className="text-blue-700">{generationStatus}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

