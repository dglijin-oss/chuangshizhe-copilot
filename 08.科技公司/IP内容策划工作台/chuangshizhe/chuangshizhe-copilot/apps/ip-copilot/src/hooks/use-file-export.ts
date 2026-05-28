// Unified file export hook — adapts to Tauri, Capacitor, or browser.
// Usage: const { exportFile } = useFileExport();
//        exportFile("plan.json", JSON.stringify(data), "application/json")

import { useCallback } from "react"

export function useFileExport() {
  const isTauri = typeof window !== "undefined" && "__TAURI__" in window
  const isCapacitor = typeof window !== "undefined" && "Capacitor" in window

  const exportFile = useCallback(
    async (filename: string, content: string, mime: string) => {
      if (isTauri) {
        try {
          const { save } = await import("@tauri-apps/plugin-dialog")
          const { writeTextFile } = await import("@tauri-apps/plugin-fs")
          const ext = filename.split(".").pop() || "txt"
          const path = await save({
            filters: [{ name: ext.toUpperCase(), extensions: [ext] }],
          })
          if (path) {
            await writeTextFile(path, content)
          }
        } catch {
          // Tauri plugins not available — fallback to browser download
          fallbackDownload(filename, content, mime)
        }
      } else if (isCapacitor) {
        try {
          const { Filesystem, Directory } = await import("@capacitor/filesystem")
          await Filesystem.writeFile({
            path: `Download/${filename}`,
            data: content,
            directory: Directory.Documents,
          })
        } catch {
          // Capacitor Filesystem not available — fallback
          fallbackDownload(filename, content, mime)
        }
      } else {
        fallbackDownload(filename, content, mime)
      }
    },
    [isTauri, isCapacitor]
  )

  return { exportFile, isTauri, isCapacitor }
}

function fallbackDownload(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
