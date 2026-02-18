const EARTH_RADIUS_KM = 6371

const toRadians = (degrees: number): number => degrees * (Math.PI / 180)

export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_KM * c
}

export const formatDistance = (km: number): string => {
  if (km < 1) return `${Math.round(km * 1000)}m away`
  if (km < 10) return `${km.toFixed(1)} km away`
  return `${Math.round(km)} km away`
}
