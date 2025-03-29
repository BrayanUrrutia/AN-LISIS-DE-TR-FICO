import { NextResponse } from "next/server"
import { BlobServiceClient } from "@azure/storage-blob"

export async function POST(req: Request) {
  try {
    const data = await req.json()

    // Extraer parámetros de la solicitud
    const {
      startTime,
      endTime,
      timeInterval,
      simulationDate,
      useCustomFactors,
      climaFactores,
      diaFactores,
      descuentosDia,
    } = data

    // Validar parámetros
    if (!startTime || !endTime || !timeInterval || !simulationDate) {
      return NextResponse.json({ message: "Faltan parámetros requeridos", success: false }, { status: 400 })
    }

    // Generar los datos de simulación
    const simulationData = generateSimulationData(
      startTime,
      endTime,
      Number.parseInt(timeInterval),
      simulationDate,
      useCustomFactors ? climaFactores : undefined,
      useCustomFactors ? diaFactores : undefined,
      useCustomFactors ? descuentosDia : undefined,
    )

    // Convertir a JSON
    const jsonContent = JSON.stringify(simulationData, null, 4)
    const fileName = `simulacion_${simulationDate}_${Date.now()}.json`

    // Subir a Azure Blob Storage
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || ""
    if (!connectionString) {
      return NextResponse.json({
        message: "Simulación generada exitosamente (Azure no configurado)",
        data: simulationData,
        recordCount: simulationData.length,
        success: true,
      })
    }

    try {
      const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
      const containerName = "simulacion-datos"
      const containerClient = blobServiceClient.getContainerClient(containerName)

      // Verificar si el contenedor existe, si no, crearlo
      const containerExists = await containerClient.exists()
      if (!containerExists) {
        await containerClient.create()
      }

      const blobName = fileName
      const blockBlobClient = containerClient.getBlockBlobClient(blobName)

      await blockBlobClient.upload(jsonContent, jsonContent.length, {
        blobHTTPHeaders: { blobContentType: "application/json" },
      })

      const fileUrl = `https://${blobServiceClient.accountName}.blob.core.windows.net/${containerName}/${blobName}`

      return NextResponse.json({
        message: "Simulación generada exitosamente y guardada en Azure",
        data: simulationData,
        recordCount: simulationData.length,
        url: fileUrl,
        success: true,
      })
    } catch (azureError) {
      console.error("Error al interactuar con Azure:", azureError)
      return NextResponse.json({
        message: "Simulación generada pero hubo un error al guardarla en Azure",
        data: simulationData,
        recordCount: simulationData.length,
        error: azureError instanceof Error ? azureError.message : "Error desconocido con Azure",
        success: true,
      })
    }
  } catch (error) {
    console.error("Error al generar simulación:", error)
    return NextResponse.json(
      {
        message: `Error al generar simulación: ${error instanceof Error ? error.message : "Error desconocido"}`,
        success: false,
      },
      { status: 500 },
    )
  }
}

// Función para generar datos de simulación
function generateSimulationData(
  startTimeStr: string,
  endTimeStr: string,
  timeIntervalMinutes: number,
  simulationDateStr: string,
  customClimaFactores?: Record<string, number>,
  customDiaFactores?: Record<string, number>,
  customDescuentosDia?: Record<string, number>,
) {
  const zones = {
    Entrada: ["Norte", "Sur", "Oeste", "Noreste"],
    Tiendas: ["ADOC", "Siman", "XIMI", "Adidas", "Puma"],
    Cine: ["Cinemark", "Cineplus", "Cinepolis"],
    Restaurantes: ["Burger King", "McDonald's", "La Calaca", "Buffalo Wings", "Pollo Campero"],
    Salidas: ["Norte", "Sur", "Oeste", "Noreste"],
  }

  const climaFactores = customClimaFactores || { Soleado: 1.0, Lluvioso: 0.7, Nublado: 0.9 }
  const diaFactores = customDiaFactores || {
    Lunes: 0.8,
    Martes: 0.9,
    Miércoles: 1.0,
    Jueves: 1.1,
    Viernes: 1.2,
    Sábado: 1.5,
    Domingo: 1.3,
  }

  const descuentosDia = customDescuentosDia || {
    Lunes: 0,
    Martes: 10,
    Miércoles: 0,
    Jueves: 15,
    Viernes: 0,
    Sábado: 0,
    Domingo: 20,
  }

  // Crear fechas a partir de strings
  const [year, month, day] = simulationDateStr.split("-").map(Number)
  const [startHour, startMinute] = startTimeStr.split(":").map(Number)
  const [endHour, endMinute] = endTimeStr.split(":").map(Number)

  const startTime = new Date(year, month - 1, day, startHour, startMinute)
  const endTime = new Date(year, month - 1, day, endHour, endMinute)

  const data = []

  // Generar intervalos de tiempo
  for (let time = new Date(startTime); time <= endTime; time = new Date(time.getTime() + timeIntervalMinutes * 60000)) {
    // Obtener condiciones aleatorias
    const clima = Object.keys(climaFactores)[Math.floor(Math.random() * Object.keys(climaFactores).length)]
    const dia = Object.keys(diaFactores)[Math.floor(Math.random() * Object.keys(diaFactores).length)]
    const descuento = descuentosDia[dia]

    // Para cada categoría y zona
    for (const [categoria, subzonas] of Object.entries(zones)) {
      for (const zona of subzonas) {
        // Generar afluencia
        let baseMin = 1,
          baseMax = 50

        if (categoria === "Entrada") {
          baseMin = 20
          baseMax = 100
        } else if (categoria === "Tiendas") {
          baseMin = 5
          baseMax = 60
        } else if (categoria === "Cine") {
          baseMin = 10
          baseMax = 80
        } else if (categoria === "Restaurantes") {
          baseMin = 5
          baseMax = 50
        } else if (categoria === "Salidas") {
          baseMin = 5
          baseMax = 40
        }

        // Ajustar por hora del día
        const hour = time.getHours()
        if ((hour >= 12 && hour <= 14) || (hour >= 18 && hour <= 21)) {
          baseMin *= 1.5
          baseMax *= 1.5
        } else if (hour >= 9 && hour <= 11) {
          baseMin *= 0.7
          baseMax *= 0.7
        }

        // Aplicar factores externos
        const factorTotal = climaFactores[clima] * diaFactores[dia]
        let personas = Math.floor(Math.random() * (baseMax - baseMin + 1) + baseMin) * factorTotal

        // Aplicar descuentos
        if (categoria === "Cine" || categoria === "Restaurantes") {
          personas = Math.floor(personas * (1 + descuento / 100))
        }

        personas = Math.max(Math.floor(personas), 0)

        // Agregar a los datos
        data.push({
          Timestamp: time.toISOString(),
          Categoria: categoria,
          Zona: zona,
          Personas: personas,
          Clima: clima,
          Dia: dia,
          Descuento: `${descuento}%`,
        })
      }
    }
  }

  return data
}

