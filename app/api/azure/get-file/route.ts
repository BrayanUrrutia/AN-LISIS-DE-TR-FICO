import { NextResponse } from "next/server"
import { BlobServiceClient } from "@azure/storage-blob"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const fileName = searchParams.get("fileName")

    if (!fileName) {
      return NextResponse.json({ message: "Nombre de archivo no válido" }, { status: 400 })
    }

    // Intentar obtener archivo de Azure
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || ""
    if (!connectionString) {
      return NextResponse.json({ message: "Azure no configurado" }, { status: 404 })
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
    const containerName = "simulacion-datos"
    const containerClient = blobServiceClient.getContainerClient(containerName)

    // Verificar si el contenedor existe
    const containerExists = await containerClient.exists()
    if (!containerExists) {
      return NextResponse.json({ message: "Contenedor no encontrado" }, { status: 404 })
    }

    // Obtener el blob
    const blobClient = containerClient.getBlobClient(fileName)
    const exists = await blobClient.exists()

    if (!exists) {
      return NextResponse.json({ message: "Archivo no encontrado" }, { status: 404 })
    }

    const downloadResponse = await blobClient.download(0)
    const downloaded = await streamToString(downloadResponse.readableStreamBody)

    // Parsear el contenido según el tipo de archivo
    const isJson = fileName.endsWith(".json")
    let data

    if (isJson) {
      data = JSON.parse(downloaded)
    } else {
      // Parsear CSV
      data = parseCSV(downloaded)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error al obtener archivo:", error)
    return NextResponse.json(
      {
        message: `Error al obtener archivo: ${error instanceof Error ? error.message : "Error desconocido"}`,
      },
      { status: 500 },
    )
  }
}

// Función para convertir un stream a string
async function streamToString(readableStream: any) {
  return new Promise<string>((resolve, reject) => {
    const chunks: string[] = []
    readableStream.on("data", (data: Buffer) => {
      chunks.push(data.toString())
    })
    readableStream.on("end", () => {
      resolve(chunks.join(""))
    })
    readableStream.on("error", reject)
  })
}

// Función para parsear CSV
function parseCSV(csvContent: string) {
  const lines = csvContent.split("\n")
  const headers = lines[0].split(",").map((header) => header.trim().replace(/^"(.*)"$/, "$1"))

  return lines
    .slice(1)
    .filter((line) => line.trim())
    .map((line) => {
      const values = line.split(",")
      const entry: Record<string, string | number> = {}

      headers.forEach((header, index) => {
        let value = values[index]
        if (value) {
          // Limpiar comillas
          value = value.trim().replace(/^"(.*)"$/, "$1")

          // Convertir a número si es posible
          if (!isNaN(Number(value)) && value !== "") {
            value = Number(value)
          }
        }
        entry[header] = value
      })

      return entry
    })
}
