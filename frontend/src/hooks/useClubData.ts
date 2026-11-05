import { useEffect, useSyncExternalStore } from 'react'
import * as clubStore from '../data/clubStore'

/**
 * Hook de acceso a los contenidos del club.
 *
 * `useSyncExternalStore` garantiza que todas las páginas y el panel de
 * administración compartan exactamente el mismo estado y se actualicen al
 * instante cuando se crea, edita o elimina un contenido.
 *
 * Al montarse descarga el contenido publicado en el backend, de modo que
 * cualquier dispositivo ve lo mismo que se guardó desde el panel.
 */
export function useClubData() {
  const data = useSyncExternalStore(
    clubStore.subscribe,
    clubStore.getSnapshot,
    clubStore.getSnapshot,
  )

  const sincronizacion = useSyncExternalStore(
    clubStore.subscribeSync,
    clubStore.getSyncSnapshot,
    clubStore.getSyncSnapshot,
  )

  useEffect(() => {
    void clubStore.cargarContenidoRemoto()
  }, [])

  return {
    ...data,
    sincronizacion,
    recargarContenido: clubStore.cargarContenidoRemoto,
    guardarEnServidor: clubStore.guardarEnServidor,
    addNoticia: clubStore.addNoticia,
    updateNoticia: clubStore.updateNoticia,
    deleteNoticia: clubStore.deleteNoticia,
    addPartido: clubStore.addPartido,
    updatePartido: clubStore.updatePartido,
    deletePartido: clubStore.deletePartido,
    addPlantel: clubStore.addPlantel,
    renamePlantel: clubStore.renamePlantel,
    deletePlantel: clubStore.deletePlantel,
    addJugador: clubStore.addJugador,
    updateJugador: clubStore.updateJugador,
    deleteJugador: clubStore.deleteJugador,
    addFoto: clubStore.addFoto,
    updateFoto: clubStore.updateFoto,
    deleteFoto: clubStore.deleteFoto,
    addProducto: clubStore.addProducto,
    updateProducto: clubStore.updateProducto,
    deleteProducto: clubStore.deleteProducto,
    addVideo: clubStore.addVideo,
    updateVideo: clubStore.updateVideo,
    deleteVideo: clubStore.deleteVideo,
    addPedido: clubStore.addPedido,
    updatePedido: clubStore.updatePedido,
    deletePedido: clubStore.deletePedido,
    addAbonado: clubStore.addAbonado,
    updateAbonado: clubStore.updateAbonado,
    deleteAbonado: clubStore.deleteAbonado,
    exportClubData: clubStore.exportClubData,
    importClubData: clubStore.importClubData,
    resetClubData: clubStore.resetClubData,
  }
}
