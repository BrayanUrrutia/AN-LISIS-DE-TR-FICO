"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Activity,
  AlertTriangle,
  Battery,
  CheckCircle,
  Clock,
  Cpu,
  Gauge,
  RefreshCw,
  Thermometer,
  WifiOff,
  PlusCircle,
  Trash2,
  Power,
  PowerOff,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Corregir la función formatDate para manejar correctamente los tipos
const formatDate = (dateString: string | undefined | null) => {
  try {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "Fecha inválida"

    return new Intl.DateTimeFormat("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date)
  } catch (error) {
    console.error("Error al formatear fecha:", error)
    return "Error de formato"
  }
}

// Reemplazar la función IoTSensors completa
export default function IoTSensors() {
  const [sensors, setSensors] = useState([
    {
      id: "sensor-001",
      name: "Entrada Norte",
      type: "Movimiento",
      status: "online",
      battery: 87,
      lastReading: new Date(Date.now() - 120000).toISOString(),
      temperature: 23.5,
      humidity: 45,
      peopleCount: 124,
      signal: 92,
      location: "Entrada Principal",
      maintenance: "2024-06-15",
    },
    {
      id: "sensor-002",
      name: "Tienda Central",
      type: "Presencia",
      status: "online",
      battery: 64,
      lastReading: new Date(Date.now() - 300000).toISOString(),
      temperature: 24.2,
      humidity: 50,
      peopleCount: 78,
      signal: 85,
      location: "Área Comercial",
      maintenance: "2024-05-20",
    },
    {
      id: "sensor-003",
      name: "Patio Comidas",
      type: "Movimiento",
      status: "warning",
      battery: 32,
      lastReading: new Date(Date.now() - 900000).toISOString(),
      temperature: 25.8,
      humidity: 55,
      peopleCount: 203,
      signal: 68,
      location: "Zona Restaurantes",
      maintenance: "2024-04-10",
    },
    {
      id: "sensor-004",
      name: "Salida Sur",
      type: "Presencia",
      status: "offline",
      battery: 12,
      lastReading: new Date(Date.now() - 3600000).toISOString(),
      temperature: 22.1,
      humidity: 42,
      peopleCount: 56,
      signal: 0,
      location: "Salida Secundaria",
      maintenance: "2024-03-25",
    },
  ])

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [newSensor, setNewSensor] = useState({
    name: "",
    type: "Movimiento",
    location: "",
    battery: 100,
    signal: 100,
  })
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  // Simular actualización de datos de sensores
  const refreshSensors = () => {
    setIsRefreshing(true)

    // Simular una llamada a API
    setTimeout(() => {
      setSensors(
        sensors.map((sensor) => {
          // Actualizar solo sensores online
          if (sensor.status === "offline") return sensor

          return {
            ...sensor,
            lastReading: new Date().toISOString(),
            battery: Math.max(1, sensor.battery - Math.floor(Math.random() * 5)),
            temperature: +(sensor.temperature + (Math.random() * 2 - 1)).toFixed(1),
            humidity: Math.min(100, Math.max(0, sensor.humidity + Math.floor(Math.random() * 10 - 5))),
            peopleCount: sensor.peopleCount + Math.floor(Math.random() * 20 - 5),
            signal: Math.min(100, Math.max(0, sensor.signal + Math.floor(Math.random() * 10 - 5))),
            status: sensor.battery < 15 ? "warning" : "online",
          }
        }),
      )
      setIsRefreshing(false)

      toast({
        title: "Sensores actualizados",
        description: "Los datos de los sensores han sido actualizados correctamente.",
      })
    }, 1500)
  }

  // Agregar un nuevo sensor
  const handleAddSensor = () => {
    if (!newSensor.name || !newSensor.location) {
      toast({
        title: "Error",
        description: "El nombre y la ubicación son obligatorios.",
        variant: "destructive",
      })
      return
    }

    const newSensorObj = {
      id: `sensor-${Math.floor(Math.random() * 1000)}`,
      name: newSensor.name,
      type: newSensor.type,
      status: "online",
      battery: newSensor.battery,
      lastReading: new Date().toISOString(),
      temperature: Math.floor(Math.random() * 10) + 20,
      humidity: Math.floor(Math.random() * 30) + 40,
      peopleCount: Math.floor(Math.random() * 100),
      signal: newSensor.signal,
      location: newSensor.location,
      maintenance: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    }

    setSensors([...sensors, newSensorObj])
    setNewSensor({
      name: "",
      type: "Movimiento",
      location: "",
      battery: 100,
      signal: 100,
    })
    setIsAddDialogOpen(false)

    toast({
      title: "Sensor agregado",
      description: `El sensor ${newSensorObj.name} ha sido agregado correctamente.`,
    })
  }

  // Eliminar un sensor
  const deleteSensor = (id) => {
    setSensors(sensors.filter((sensor) => sensor.id !== id))

    toast({
      title: "Sensor eliminado",
      description: "El sensor ha sido eliminado correctamente.",
    })
  }

  // Activar/desactivar un sensor
  const toggleSensorStatus = (id) => {
    setSensors(
      sensors.map((sensor) => {
        if (sensor.id === id) {
          const newStatus = sensor.status === "offline" ? "online" : "offline"
          const newSignal = newStatus === "offline" ? 0 : 85

          return {
            ...sensor,
            status: newStatus,
            signal: newSignal,
            lastReading: newStatus === "online" ? new Date().toISOString() : sensor.lastReading,
          }
        }
        return sensor
      }),
    )
  }

  // Ajustar la señal de un sensor
  const adjustSignal = (id, value) => {
    setSensors(
      sensors.map((sensor) => {
        if (sensor.id === id) {
          let newStatus = sensor.status

          // Si la señal es 0, el sensor está offline
          if (value === 0) {
            newStatus = "offline"
          }
          // Si la señal es baja pero no 0, el sensor está en warning
          else if (value < 30) {
            newStatus = "warning"
          }
          // Si la señal es buena y el sensor estaba offline, ponerlo online
          else if (sensor.status === "offline") {
            newStatus = "online"
          }

          return {
            ...sensor,
            signal: value,
            status: newStatus,
            lastReading: newStatus === "online" ? new Date().toISOString() : sensor.lastReading,
          }
        }
        return sensor
      }),
    )
  }

  // Filtrar sensores según la pestaña activa
  const filteredSensors = sensors.filter((sensor) => {
    if (activeTab === "all") return true
    if (activeTab === "online") return sensor.status === "online"
    if (activeTab === "warning") return sensor.status === "warning"
    if (activeTab === "offline") return sensor.status === "offline"
    return true
  })

  // Obtener estadísticas de sensores
  const stats = {
    total: sensors.length,
    online: sensors.filter((s) => s.status === "online").length,
    warning: sensors.filter((s) => s.status === "warning").length,
    offline: sensors.filter((s) => s.status === "offline").length,
  }

  return (
    <div className="space-y-6">
      {/* Panel de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-blue-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Sensores</p>
              <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Cpu className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-green-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">En línea</p>
              <p className="text-2xl font-bold text-green-800">{stats.online}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-amber-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600">Advertencia</p>
              <p className="text-2xl font-bold text-amber-800">{stats.warning}</p>
            </div>
            <div className="bg-amber-100 p-3 rounded-full">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-red-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Desconectados</p>
              <p className="text-2xl font-bold text-red-800">{stats.offline}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <WifiOff className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles y filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg border border-blue-200">
        <div>
          <h2 className="text-lg font-bold text-blue-800">Sensores IoT</h2>
          <p className="text-sm text-blue-600">Monitoreo en tiempo real de sensores del centro comercial</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <PlusCircle className="mr-2 h-4 w-4" />
                Agregar Sensor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Sensor</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nombre
                  </Label>
                  <Input
                    id="name"
                    value={newSensor.name}
                    onChange={(e) => setNewSensor({ ...newSensor, name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Tipo
                  </Label>
                  <Select value={newSensor.type} onValueChange={(value) => setNewSensor({ ...newSensor, type: value })}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Movimiento">Movimiento</SelectItem>
                      <SelectItem value="Presencia">Presencia</SelectItem>
                      <SelectItem value="Temperatura">Temperatura</SelectItem>
                      <SelectItem value="Humedad">Humedad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="location" className="text-right">
                    Ubicación
                  </Label>
                  <Input
                    id="location"
                    value={newSensor.location}
                    onChange={(e) => setNewSensor({ ...newSensor, location: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="battery" className="text-right">
                    Batería
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input
                      id="battery"
                      type="range"
                      min="1"
                      max="100"
                      value={newSensor.battery}
                      onChange={(e) => setNewSensor({ ...newSensor, battery: Number.parseInt(e.target.value) })}
                    />
                    <span>{newSensor.battery}%</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="signal" className="text-right">
                    Señal
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input
                      id="signal"
                      type="range"
                      min="0"
                      max="100"
                      value={newSensor.signal}
                      onChange={(e) => setNewSensor({ ...newSensor, signal: Number.parseInt(e.target.value) })}
                    />
                    <span>{newSensor.signal}%</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddSensor}>Agregar Sensor</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button onClick={refreshSensors} disabled={isRefreshing} className="bg-blue-600 hover:bg-blue-700">
            {isRefreshing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Actualizando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualizar datos
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tabs para filtrar sensores */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border border-blue-200 p-1">
          <TabsTrigger value="all" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Todos ({stats.total})
          </TabsTrigger>
          <TabsTrigger value="online" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            En línea ({stats.online})
          </TabsTrigger>
          <TabsTrigger value="warning" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
            Advertencia ({stats.warning})
          </TabsTrigger>
          <TabsTrigger value="offline" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
            Desconectados ({stats.offline})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSensors.map((sensor) => (
              <SensorCard
                key={sensor.id}
                sensor={sensor}
                onDelete={deleteSensor}
                onToggleStatus={toggleSensorStatus}
                onAdjustSignal={adjustSignal}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="online" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSensors.map((sensor) => (
              <SensorCard
                key={sensor.id}
                sensor={sensor}
                onDelete={deleteSensor}
                onToggleStatus={toggleSensorStatus}
                onAdjustSignal={adjustSignal}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="warning" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSensors.map((sensor) => (
              <SensorCard
                key={sensor.id}
                sensor={sensor}
                onDelete={deleteSensor}
                onToggleStatus={toggleSensorStatus}
                onAdjustSignal={adjustSignal}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="offline" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSensors.map((sensor) => (
              <SensorCard
                key={sensor.id}
                sensor={sensor}
                onDelete={deleteSensor}
                onToggleStatus={toggleSensorStatus}
                onAdjustSignal={adjustSignal}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Reemplazar el componente SensorCard
function SensorCard({ sensor, onDelete, onToggleStatus, onAdjustSignal }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "online":
        return "bg-green-100 text-green-800 border-green-200"
      case "warning":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "offline":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getBatteryColor = (level) => {
    if (level > 70) return "bg-green-500"
    if (level > 30) return "bg-amber-500"
    return "bg-red-500"
  }

  const getSignalIcon = (signal) => {
    if (signal === 0) return <WifiOff className="h-4 w-4 text-red-500" />
    if (signal < 30) return <Activity className="h-4 w-4 text-red-500" />
    if (signal < 70) return <Activity className="h-4 w-4 text-amber-500" />
    return <Activity className="h-4 w-4 text-green-500" />
  }

  return (
    <Card className="bg-white border-blue-100 overflow-hidden">
      <CardHeader className="bg-blue-50 p-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-blue-800">{sensor.name}</CardTitle>
            <p className="text-sm text-blue-600">ID: {sensor.id}</p>
          </div>
          <Badge className={`${getStatusColor(sensor.status)}`}>
            {sensor.status === "online" ? "En línea" : sensor.status === "warning" ? "Advertencia" : "Desconectado"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-gray-500 flex items-center">
              <Thermometer className="h-3 w-3 mr-1" /> Temperatura
            </p>
            <p className="font-medium text-blue-800">
              {sensor.status !== "offline" ? `${sensor.temperature}°C` : "N/A"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-gray-500 flex items-center">
              <Gauge className="h-3 w-3 mr-1" /> Humedad
            </p>
            <p className="font-medium text-blue-800">{sensor.status !== "offline" ? `${sensor.humidity}%` : "N/A"}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-gray-500 flex items-center">
              <Clock className="h-3 w-3 mr-1" /> Última lectura
            </p>
            <p className="font-medium text-blue-800 text-xs">{formatDate(sensor.lastReading)}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-gray-500 flex items-center">
              <Activity className="h-3 w-3 mr-1" /> Señal
            </p>
            <div className="flex items-center">
              {getSignalIcon(sensor.signal)}
              <span className="ml-1 font-medium text-blue-800">
                {sensor.status !== "offline" ? `${sensor.signal}%` : "0%"}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500 flex items-center">
              <Battery className="h-3 w-3 mr-1" /> Batería
            </p>
            <span className="text-xs font-medium text-blue-800">{sensor.battery}%</span>
          </div>
          <Progress
            value={sensor.battery}
            className="h-2 bg-gray-100"
            indicatorClassName={getBatteryColor(sensor.battery)}
          />
        </div>

        {/* Control de señal */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">Ajustar señal</p>
            <span className="text-xs font-medium text-blue-800">{sensor.signal}%</span>
          </div>
          <Input
            type="range"
            min="0"
            max="100"
            value={sensor.signal}
            onChange={(e) => onAdjustSignal(sensor.id, Number.parseInt(e.target.value))}
            className="h-2"
          />
        </div>

        <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
          <span className="text-xs text-gray-500">{sensor.location}</span>
          <Badge variant="outline" className="text-xs border-blue-200 text-blue-600">
            {sensor.type}
          </Badge>
        </div>

        {/* Controles del sensor */}
        <div className="flex justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleStatus(sensor.id)}
            className={sensor.status === "offline" ? "text-green-600 border-green-200" : "text-red-600 border-red-200"}
          >
            {sensor.status === "offline" ? (
              <>
                <Power className="h-3 w-3 mr-1" /> Activar
              </>
            ) : (
              <>
                <PowerOff className="h-3 w-3 mr-1" /> Desactivar
              </>
            )}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-red-600 border-red-200">
                <Trash2 className="h-3 w-3 mr-1" /> Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción eliminará el sensor "{sensor.name}" y no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(sensor.id)} className="bg-red-600 hover:bg-red-700">
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}
