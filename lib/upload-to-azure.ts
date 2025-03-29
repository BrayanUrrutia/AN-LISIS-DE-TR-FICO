// Asegurarnos de que la importación del SDK de Azure sea dinámica
import { BlobServiceClient } from "@azure/storage-blob"

// Nota: Este archivo solo debe ser importado desde rutas API con runtime = 'nodejs'
// No debe ser importado desde componentes del cliente

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || ""

/**
 * Sube un archivo a Azure Blob Storage.
 * @param fileName Nombre del archivo
 * @param fileContent Contenido del archivo en formato string o Buffer
 * @param contentType Tipo MIME del archivo
 * @returns URL del archivo subido o null si hay un error
 */
export async function uploadFileToAzure(fileName: string, fileContent: string | Buffer, contentType: string) {
  try {
    if (!connectionString) {
      console.warn("No se encontró la cadena de conexión de Azure en las variables de entorno")
      return null
    }

    // Importante: Este código solo se ejecutará en un entorno Node.js
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
    const containerName = "simulacion-datos" // Usamos el mismo contenedor que hemos estado usando
    const containerClient = blobServiceClient.getContainerClient(containerName)

    // Verificar si el contenedor existe, si no, crearlo
    const containerExists = await containerClient.exists()
    if (!containerExists) {
      await containerClient.create()
    }

    const blobName = `${Date.now()}-${fileName}`
    const blockBlobClient = containerClient.getBlockBlobClient(blobName)

    await blockBlobClient.upload(fileContent, fileContent.length, {
      blobHTTPHeaders: { blobContentType: contentType },
    })

    return `https://${blobServiceClient.accountName}.blob.core.windows.net/${containerName}/${blobName}`
  } catch (error) {
    console.error("Error al subir archivo a Azure:", error)
    return null
  }
}

/**
 * Obtiene los datos más recientes de Azure Blob Storage.
 * @returns Datos obtenidos o null si hay un error
 */
export async function getLatestDataFromAzure() {
  try {
    if (!connectionString) {
      console.warn("No se encontró la cadena de conexión de Azure en las variables de entorno")
      return null
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
    const containerName = "simulacion-datos"
    const containerClient = blobServiceClient.getContainerClient(containerName)

    // Verificar si el contenedor existe
    const containerExists = await containerClient.exists()
    if (!containerExists) {
      return null
    }

    // Obtener todos los blobs
    const blobs = []
    for await (const blob of containerClient.listBlobsFlat()) {
      blobs.push(blob)
    }

    if (blobs.length === 0) {
      return null
    }

    // Ordenar por fecha de creación (más reciente primero)
    blobs.sort((a, b) => {
      const dateA = new Date(a.properties.createdOn || 0)
      const dateB = new Date(b.properties.createdOn || 0)
      return dateB.getTime() - dateA.getTime()
    })

    // Obtener el blob más reciente
    const blobClient = containerClient.getBlobClient(blobs[0].name)
    const downloadResponse = await blobClient.download(0)

    // Leer el contenido del blob
    const downloaded = await streamToString(downloadResponse.readableStreamBody)

    // Parsear el contenido según el tipo de archivo
    const isJson = blobs[0].name.endsWith(".json")
    if (isJson) {
      return JSON.parse(downloaded)
    } else {
      // Parsear CSV
      return parseCSV(downloaded)
    }
  } catch (error) {
    console.error("Error al obtener datos de Azure:", error)
    return null
  }
}

/**
 * Elimina todos los archivos de Azure Blob Storage.
 * @returns Número de archivos eliminados o -1 si hay un error
 */
export async function deleteAllFilesFromAzure() {
  try {
    if (!connectionString) {
      console.warn("No se encontró la cadena de conexión de Azure en las variables de entorno")
      return -1
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
    const containerName = "simulacion-datos"
    const containerClient = blobServiceClient.getContainerClient(containerName)

    // Verificar si el contenedor existe
    const containerExists = await containerClient.exists()
    if (!containerExists) {
      return 0
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

    return deletedCount
  } catch (error) {
    console.error("Error al eliminar archivos de Azure:", error)
    return -1
  }
}

// Función para convertir un stream a string
async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = []
    readableStream.on("data", (data) => {
      chunks.push(data.toString())
    })
    readableStream.on("end", () => {
      resolve(chunks.join(""))
    })
    readableStream.on("error", reject)
  })
}

// Función para parsear CSV
function parseCSV(csvContent) {
  const lines = csvContent.split("\n")
  const headers = lines[0].split(",").map((header) => header.trim().replace(/^"(.*)"$/, "$1"))

  return lines
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
          if (!isNaN(value) && value !== "") {
            value = Number(value)
          }
        }
        entry[header] = value
      })

      return entry
    })
}

