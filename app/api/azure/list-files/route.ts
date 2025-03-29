import { NextResponse } from "next/server"
import { BlobServiceClient } from "@azure/storage-blob"

export async function GET() {
  try {
    // Intentar obtener lista de archivos de Azure
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || ""
    if (!connectionString) {
      return NextResponse.json({ files: [] })
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
    const containerName = "simulacion-datos"
    const containerClient = blobServiceClient.getContainerClient(containerName)

    // Verificar si el contenedor existe
    const containerExists = await containerClient.exists()
    if (!containerExists) {
      return NextResponse.json({ files: [] })
    }

    // Obtener todos los blobs
    const blobs = []
    for await (const blob of containerClient.listBlobsFlat()) {
      const blobClient = containerClient.getBlobClient(blob.name)
      blobs.push({
        name: blob.name,
        url: blobClient.url,
        createdOn: blob.properties.createdOn,
        size: blob.properties.contentLength,
        contentType: blob.properties.contentType,
      })
    }

    // Ordenar por fecha de creación (más reciente primero)
    blobs.sort((a, b) => {
      const dateA = new Date(a.createdOn || 0)
      const dateB = new Date(b.createdOn || 0)
      return dateB.getTime() - dateA.getTime()
    })

    return NextResponse.json({ files: blobs })
  } catch (error) {
    console.error("Error al obtener lista de archivos:", error)
    return NextResponse.json(
      {
        message: `Error al obtener lista de archivos: ${error instanceof Error ? error.message : "Error desconocido"}`,
        files: [],
      },
      { status: 500 },
    )
  }
}

