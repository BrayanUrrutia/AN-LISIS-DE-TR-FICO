// Configuración para Azure Storage
export const azureConfig = {
  containerName: "simulacion-datos",
  // Verificamos si la variable de entorno está disponible
  isConfigured:
    typeof process !== "undefined" && process.env && process.env.AZURE_STORAGE_CONNECTION_STRING ? true : false,
}

// Esta función solo debe usarse en el servidor (API routes)
export function getAzureConnectionString() {
  return process.env.AZURE_STORAGE_CONNECTION_STRING || ""
}

// Función para verificar si Azure está configurado
export function checkAzureConfig() {
  return azureConfig.isConfigured
}
