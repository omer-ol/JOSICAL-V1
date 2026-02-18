export type Location = {
  readonly city: string
  readonly neighborhoods: readonly string[]
  readonly lat: number
  readonly lng: number
}

export const LOCATIONS: readonly Location[] = [
  { city: 'Tel Aviv', neighborhoods: ['Florentin', 'Neve Tzedek', 'Rothschild', 'Dizengoff', 'Sarona', 'Jaffa', 'Ramat Aviv', 'Old North', "Lev Ha'Ir", 'HaTikva', "Neve Sha'anan"], lat: 32.0853, lng: 34.7818 },
  { city: 'Jerusalem', neighborhoods: ['Rehavia', 'German Colony', 'Baka', 'Talpiot', 'Katamon', 'Ein Kerem', 'Mahane Yehuda', 'City Center'], lat: 31.7683, lng: 35.2137 },
  { city: 'Haifa', neighborhoods: ['Carmel Center', 'German Colony', 'Downtown', 'Bat Galim', "Neve Sha'anan", 'Ahuza'], lat: 32.7940, lng: 34.9896 },
  { city: 'Rishon LeZion', neighborhoods: ['City Center', 'Nahalat Yehuda', 'Neve Hof', 'Kiryat Rishon'], lat: 31.9500, lng: 34.8000 },
  { city: 'Petah Tikva', neighborhoods: ['City Center', 'Kfar Ganim', 'Em HaMoshavot', 'Neve Oz'], lat: 32.0868, lng: 34.8876 },
  { city: 'Ashdod', neighborhoods: ['City Center', 'Rova Yud', 'Marina', 'Rova Alef'], lat: 31.8014, lng: 34.6435 },
  { city: 'Netanya', neighborhoods: ['City Center', 'South Beach', 'Kiryat Nordau', 'Ir Yamim'], lat: 32.3215, lng: 34.8532 },
  { city: 'Beersheba', neighborhoods: ['Old City', 'Neve Noy', 'Ramot', "Neve Ze'ev"], lat: 31.2530, lng: 34.7915 },
  { city: 'Holon', neighborhoods: ['City Center', 'Neve Rabin', 'Kiryat Sharet', 'Jesse Cohen'], lat: 32.0114, lng: 34.7748 },
  { city: 'Ramat Gan', neighborhoods: ['City Center', 'Diamond Exchange', 'Neve Yehoshua', 'Kiryat Krinitzi'], lat: 32.0700, lng: 34.8243 },
  { city: 'Herzliya', neighborhoods: ['Herzliya Pituach', 'City Center', 'Neve Amal', 'Nof Yam'], lat: 32.1629, lng: 34.8447 },
  { city: "Ra'anana", neighborhoods: ['City Center', 'Neve Zemer', "North Ra'anana"], lat: 32.1849, lng: 34.8709 },
  { city: 'Kfar Saba', neighborhoods: ['City Center', 'Green', 'Neve Yerek'], lat: 32.1780, lng: 34.9066 },
  { city: 'Rehovot', neighborhoods: ['City Center', 'Neve Amal', 'Kiryat Weizmann'], lat: 31.8928, lng: 34.8113 },
  { city: 'Modiin', neighborhoods: ['Buchman', 'Moriah', 'Avnei Tan', 'Yehalom'], lat: 31.8969, lng: 35.0104 },
  { city: 'Bat Yam', neighborhoods: ['City Center', 'Beach Area', 'Pardes'], lat: 32.0236, lng: 34.7510 },
  { city: 'Givatayim', neighborhoods: ['City Center', 'Borochov', 'Neve Golan'], lat: 32.0718, lng: 34.8103 },
  { city: 'Eilat', neighborhoods: ['City Center', 'North Beach', 'Arava'], lat: 29.5577, lng: 34.9519 },
] as const

export const getCityNames = (): readonly string[] => LOCATIONS.map((loc) => loc.city)

export const getNeighborhoods = (city: string): readonly string[] => {
  const location = LOCATIONS.find((loc) => loc.city === city)
  return location?.neighborhoods ?? []
}

export const getLocationCoords = (city: string): { lat: number; lng: number } | null => {
  const location = LOCATIONS.find((loc) => loc.city === city)
  return location ? { lat: location.lat, lng: location.lng } : null
}
