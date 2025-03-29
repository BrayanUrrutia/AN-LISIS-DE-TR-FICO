import { NextResponse } from "next/server"
import { BlobServiceClient } from "@azure/storage-blob"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ message: "No se proporcionó ningún archivo válido" }, { status: 400 })
    }

    // Verificar tipo de archivo
    const fileName = file.name
    const isJson = fileName.endsWith(".json")
    const isCsv = fileName.endsWith(".csv")

    if (!isJson && !isCsv) {
      return NextResponse.json(
        { message: "Tipo de archivo no válido. Solo se aceptan archivos JSON o CSV" },
        { status: 400 },
      )
    }

    // Leer el contenido del archivo directamente en memoria
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileContent = buffer.toString("utf8")

    // Subir a Azure Blob Storage
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || ""
    if (!connectionString) {
      return NextResponse.json({ message: "No se encontró la cadena de conexión de Azure" }, { status: 500 })
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
    const containerName = "simulacion-datos"
    const containerClient = blobServiceClient.getContainerClient(containerName)

    // Verificar si el contenedor existe, si no, crearlo
    const containerExists = await containerClient.exists()
    if (!containerExists) {
      await containerClient.create()
    }

    const blobName = `${Date.now()}-${fileName}`
    const blockBlobClient = containerClient.getBlockBlobClient(blobName)

    await blockBlobClient.upload(fileContent, fileContent.length, {
      blobHTTPHeaders: {
        blobContentType: isJson ? "application/json" : "text/csv",
      },
    })

    const fileUrl = `https://${blobServiceClient.accountName}.blob.core.windows.net/${containerName}/${blobName}`

    // Procesar el archivo para devolverlo al cliente
    let data
    try {
      if (isJson) {
        data = JSON.parse(fileContent)
      } else {
        // Parsear CSV
        const lines = fileContent.split("\n")
        const headers = lines[0].split(",").map((header) => header.trim().replace(/^"(.*)"$/, "$1"))

        data = lines
          .slice(1)
          .filter((line) => line.trim())
          .map((line) => {
            const values = line.split(",")
            const entry = {}

            headers.forEach((header, index) => {
              let value = values[index]
              if (value) {
                // Limpiar comillas
                value = value.trim().replace(/^"(.*)"$/, "$1")

                // Convertir a número si es posible
                if (!isNaN(value as any) && value !== "") {
                  value = Number(value)
                }
              }
              entry[header] = value
            })

            return entry
          })
      }

      return NextResponse.json({
        message: "Archivo subido exitosamente a Azure",
        fileName,
        fileSize: file.size,
        fileType: isJson ? "application/json" : "text/csv",
        url: fileUrl,
        data,
      })
    } catch (parseError) {
      console.error("Error al parsear el archivo:", parseError)
      return NextResponse.json(
        {
          message: `Error al parsear el archivo: ${
            parseError instanceof Error ? parseError.message : "Error desconocido"
          }`,
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Error al procesar la solicitud:", error)
    return NextResponse.json(
      {
        message: `Error al procesar la solicitud: ${error instanceof Error ? error.message : "Error desconocido"}`,
      },
      { status: 500 },
    )
  }
}

