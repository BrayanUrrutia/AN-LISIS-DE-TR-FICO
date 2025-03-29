"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts"
import { Separator } from "@/components/ui/separator"

// Colores para el gráfico de barras
const CHART_COLORS = [
  "#0891b2", // cyan-600
  "#0284c7", // sky-600
  "#2563eb", // blue-600
  "#4f46e5", // indigo-600
  "#0d9488", // teal-600
  "#059669", // emerald-600
  "#16a34a", // green-600
  "#65a30d", // lime-600
  "#0369a1", // sky-700
  "#1d4ed8", // blue-700
]

export default function DataVisualization({ data }: { data: any[] }) {
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterDay, setFilterDay] = useState("all")
  const [filterClima, setFilterClima] = useState("all")
  const [groupBy, setGroupBy] = useState("zona")

  // Datos procesados para visualización
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return []

    // Filtrar datos
    let filtered = [...data]

    if (filterCategory !== "all") {
      filtered = filtered.filter((item) => item.Categoria === filterCategory)
    }

    if (filterDay !== "all") {
      filtered = filtered.filter((item) => item.Dia === filterDay)
    }

    if (filterClima !== "all") {
      filtered = filtered.filter((item) => item.Clima === filterClima)
    }

    // Agrupar datos según la selección
    if (groupBy === "zona") {
      // Agrupar por zona
      const grouped = filtered.reduce((acc, curr) => {
        const key = curr.Zona
        if (!acc[key]) {
          acc[key] = {
            name: key,
            value: 0,
            categoria: curr.Categoria,
          }
        }
        acc[key].value += curr.Personas
        return acc
      }, {})

      return Object.values(grouped)
    } else if (groupBy === "categoria") {
      // Agrupar por categoría
      const grouped = filtered.reduce((acc, curr) => {
        const key = curr.Categoria
        if (!acc[key]) {
          acc[key] = { name: key, value: 0 }
        }
        acc[key].value += curr.Personas
        return acc
      }, {})

      return Object.values(grouped)
    } else if (groupBy === "hora") {
      // Agrupar por hora del día
      const grouped = filtered.reduce((acc, curr) => {
        const date = new Date(curr.Timestamp)
        const hour = date.getHours()
        const key = `${hour}:00`

        if (!acc[key]) {
          acc[key] = { name: key, value: 0 }
        }
        acc[key].value += curr.Personas
        return acc
      }, {})

      // Ordenar por hora
      return Object.values(grouped).sort((a, b) => {
        const hourA = Number.parseInt(a.name.split(":")[0])
        const hourB = Number.parseInt(b.name.split(":")[0])
        return hourA - hourB
      })
    } else if (groupBy === "clima") {
      // Agrupar por clima
      const grouped = filtered.reduce((acc, curr) => {
        const key = curr.Clima
        if (!acc[key]) {
          acc[key] = { name: key, value: 0 }
        }
        acc[key].value += curr.Personas
        return acc
      }, {})

      return Object.values(grouped)
    } else if (groupBy === "dia") {
      // Agrupar por día
      const grouped = filtered.reduce((acc, curr) => {
        const key = curr.Dia
        if (!acc[key]) {
          acc[key] = { name: key, value: 0 }
        }
        acc[key].value += curr.Personas
        return acc
      }, {})

      // Orden de los días de la semana
      const diasOrden = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
      return Object.values(grouped).sort((a, b) => {
        return diasOrden.indexOf(a.name) - diasOrden.indexOf(b.name)
      })
    }

    return []
  }, [data, filterCategory, filterDay, filterClima, groupBy])

  // Obtener valores únicos para los filtros
  const categories = useMemo(() => {
    if (data.length === 0) return ["all"]
    return ["all", ...new Set(data.map((item) => item.Categoria))]
  }, [data])

  const days = useMemo(() => {
    if (data.length === 0) return ["all"]
    return ["all", ...new Set(data.map((item) => item.Dia))]
  }, [data])

  const climas = useMemo(() => {
    if (data.length === 0) return ["all"]
    return ["all", ...new Set(data.map((item) => item.Clima))]
  }, [data])

  if (data.length === 0) {
    return (
      <div className="text-center p-10">
        <p className="text-blue-600 font-medium">
          No hay datos disponibles para visualizar. Por favor, descarga datos de Azure o sube un archivo.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="group-by" className="text-blue-700">
            Agrupar por
          </Label>
          <Select value={groupBy} onValueChange={setGroupBy}>
            <SelectTrigger id="group-by" className="border-blue-200 focus:ring-blue-500">
              <SelectValue placeholder="Seleccionar agrupación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="zona">Zona</SelectItem>
              <SelectItem value="categoria">Categoría</SelectItem>
              <SelectItem value="hora">Hora del día</SelectItem>
              <SelectItem value="clima">Clima</SelectItem>
              <SelectItem value="dia">Día de la semana</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="filter-category" className="text-blue-700">
            Filtrar por Categoría
          </Label>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger id="filter-category" className="border-blue-200 focus:ring-blue-500">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category === "all" ? "Todas las categorías" : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="filter-day" className="text-blue-700">
            Filtrar por Día
          </Label>
          <Select value={filterDay} onValueChange={setFilterDay}>
            <SelectTrigger id="filter-day" className="border-blue-200 focus:ring-blue-500">
              <SelectValue placeholder="Todos los días" />
            </SelectTrigger>
            <SelectContent>
              {days.map((day) => (
                <SelectItem key={day} value={day}>
                  {day === "all" ? "Todos los días" : day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="filter-clima" className="text-blue-700">
          Filtrar por Clima
        </Label>
        <Select value={filterClima} onValueChange={setFilterClima}>
          <SelectTrigger id="filter-clima" className="border-blue-200 focus:ring-blue-500">
            <SelectValue placeholder="Todos los climas" />
          </SelectTrigger>
          <SelectContent>
            {climas.map((clima) => (
              <SelectItem key={clima} value={clima}>
                {clima === "all" ? "Todos los climas" : clima}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator className="bg-blue-200" />

      <Tabs defaultValue="chart" className="w-full">
        <TabsList className="bg-blue-100">
          <TabsTrigger value="chart" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Gráfico
          </TabsTrigger>
          <TabsTrigger value="table" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Tabla
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chart" className="pt-4">
          <Card className="border-blue-200 shadow-lg">
            <CardContent className="pt-6">
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={processedData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 60,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fill: "#1e40af" }} angle={-45} textAnchor="end" height={60} />
                    <YAxis
                      tick={{ fill: "#1e40af" }}
                      label={{
                        value: "Personas",
                        angle: -90,
                        position: "insideLeft",
                        fill: "#1e40af",
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#EFF6FF",
                        borderColor: "#3B82F6",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px rgba(59, 130, 246, 0.2)",
                      }}
                      formatter={(value) => [`${value} personas`, "Total"]}
                      labelFormatter={(name) =>
                        `${
                          groupBy === "zona"
                            ? "Zona"
                            : groupBy === "categoria"
                              ? "Categoría"
                              : groupBy === "hora"
                                ? "Hora"
                                : groupBy === "clima"
                                  ? "Clima"
                                  : "Día"
                        }: ${name}`
                      }
                    />
                    <Legend wrapperStyle={{ paddingTop: 10 }} />
                    <Bar dataKey="value" name="Personas" fill="#0284c7" radius={[4, 4, 0, 0]}>
                      {processedData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table" className="pt-4">
          <Card className="border-blue-200 shadow-lg">
            <CardContent className="pt-6">
              <div className="border rounded-md overflow-hidden border-blue-200">
                <table className="w-full">
                  <thead>
                    <tr className="bg-blue-100">
                      <th className="text-left p-3 font-medium text-blue-800">
                        {groupBy === "zona"
                          ? "Zona"
                          : groupBy === "categoria"
                            ? "Categoría"
                            : groupBy === "hora"
                              ? "Hora"
                              : groupBy === "clima"
                                ? "Clima"
                                : "Día"}
                      </th>
                      <th className="text-right p-3 font-medium text-blue-800">Total de Personas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedData.map((item, index) => (
                      <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-blue-50"}>
                        <td className="p-3 text-blue-700">{item.name}</td>
                        <td className="p-3 text-right font-medium text-blue-700">{item.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

