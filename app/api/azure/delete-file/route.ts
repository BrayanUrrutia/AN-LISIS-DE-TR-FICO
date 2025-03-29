import { NextResponse } from "next/server"
import { BlobServiceClient } from "@azure/storage-blob"

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const fileName = searchParams.get("fileName")

    if (!fileName) {
      return NextResponse.json({ message: "Nombre de archivo no válido" }, { status: 400 })
    }

    // Intentar eliminar archivo de Azure
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

    // Eliminar el blob
    await blobClient.delete()

    return NextResponse.json({
      message: `Archivo ${fileName} eliminado exitosamente`,
      success: true,
    })
  } catch (error) {
    console.error("Error al eliminar archivo:", error)
    return NextResponse.json(
      {
        message: `Error al eliminar archivo: ${error instanceof Error ? error.message : "Error desconocido"}`,
        success: false,
      },
      { status: 500 },
    )
  }
}

