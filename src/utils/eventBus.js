import { ref } from 'vue'

const musicVolume = ref(0.7)
const originalVolume = ref(0.7)
const isHoveringUI = ref(false)
let aplayerInstance = null

export const setAPlayerInstance = (instance) => {
  aplayerInstance = instance
}

export const getAPlayerInstance = () => aplayerInstance

const suppressVolumeSave = (duration = 500) => {
  if (!aplayerInstance) return
  aplayerInstance._mikuSuppressVolumeSaveUntil = Math.max(
    aplayerInstance._mikuSuppressVolumeSaveUntil || 0,
    Date.now() + duration
  )
}

export const fadeVolume = (targetVolume, duration = 500) => {
  return new Promise((resolve) => {
    if (!aplayerInstance) {
      resolve()
      return
    }

    suppressVolumeSave(duration + 200)
    const startVolume = aplayerInstance.audio.volume
    const volumeDiff = targetVolume - startVolume
    const steps = 20
    const stepDuration = duration / steps
    let currentStep = 0

    const interval = setInterval(() => {
      currentStep++
      const progress = currentStep / steps
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      const newVolume = startVolume + volumeDiff * easeProgress
      aplayerInstance.audio.volume = Math.max(0, Math.min(1, newVolume))

      if (currentStep >= steps) {
        clearInterval(interval)
        aplayerInstance.audio.volume = targetVolume
        resolve()
      }
    }, stepDuration)
  })
}

let duckRestoreTimer = null

export const duckMusicForNotification = async (notificationDuration = 3000) => {
  if (!aplayerInstance) return
  if (aplayerInstance.audio.volume <= 0) return
  if (aplayerInstance.audio.paused) return

  if (duckRestoreTimer) {
    clearTimeout(duckRestoreTimer)
    duckRestoreTimer = null
  }

  originalVolume.value = aplayerInstance.audio.volume
  const duckedVolume = originalVolume.value * 0.2

  await fadeVolume(duckedVolume, 300)

  if (aplayerInstance.audio.paused) return

  duckRestoreTimer = setTimeout(async () => {
    duckRestoreTimer = null
    if (!aplayerInstance || aplayerInstance.audio.paused) return
    await fadeVolume(originalVolume.value, 300)
  }, notificationDuration)
}

export const cancelDuck = () => {
  if (duckRestoreTimer) {
    clearTimeout(duckRestoreTimer)
    duckRestoreTimer = null
  }
}

export const setHoveringUI = (value) => {
  isHoveringUI.value = value
}

export const getHoveringUI = () => isHoveringUI

export { musicVolume, originalVolume, isHoveringUI }