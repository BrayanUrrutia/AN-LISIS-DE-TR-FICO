import { NextResponse } from "next/server"
import { BlobServiceClient } from "@azure/storage-blob"

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const deleteAll = searchParams.get("deleteAll") === "true"

    if (!deleteAll) {
      return NextResponse.json(
        {
          message: "Solo se admite la eliminación de todos los archivos",
          success: false,
        },
        { status: 400 },
      )
    }

    // Intentar eliminar datos de Azure
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || ""
    if (!connectionString) {
      return NextResponse.json({
        message: "No se encontró la cadena de conexión de Azure, pero se eliminaron los datos locales",
        success: true,
      })
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
    const containerName = "simulacion-datos"
    const containerClient = blobServiceClient.getContainerClient(containerName)

    // Verificar si el contenedor existe
    const containerExists = await containerClient.exists()
    if (!containerExists) {
      return NextResponse.json({
        message: "No se encontró el contenedor en Azure, pero se eliminaron los datos locales",
        success: true,
      })
    }

    // Obtener todos los blobs
    const blobs = []
    for await (const blob of containerClient.listBlobsFlat()) {
      blobs.push(blob)
    }

    let deletedCount = 0
    for (const blob of blobs) {
      await containerClient.deleteBlob(blob.name)
      deletedCount++
    }

    return NextResponse.json({
      message: `Se eliminaron ${deletedCount} archivos de Azure`,
      deletedCount,
      success: true,
    })
  } catch (error) {
    console.error("Error al eliminar datos:", error)
    return NextResponse.json(
      {
        message: `Error al eliminar datos: ${error instanceof Error ? error.message : "Error desconocido"}`,
        success: false,
      },
      { status: 500 },
    )
  }
}
