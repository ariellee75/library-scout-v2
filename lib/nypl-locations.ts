// NYPL Library Locations by Borough

export interface NYPLLibrary {
  name: string
  description: string
  borough: string
  address: string
}

export const BOROUGHS = ["Manhattan", "Bronx", "Staten Island"] as const
export type Borough = typeof BOROUGHS[number]

export const NYPL_LIBRARIES: NYPLLibrary[] = [
  // Manhattan
  { name: "Jefferson Market Library", description: "A beloved Greenwich Village branch housed in a stunning Victorian Gothic landmark building.", borough: "Manhattan", address: "425 Avenue of the Americas, New York, NY 10011" },
  { name: "Stavros Niarchos Foundation Library (SNFL)", description: "NYPL's largest circulating branch, a state-of-the-art facility renovated with support from the Stavros Niarchos Foundation.", borough: "Manhattan", address: "455 5th Avenue, New York, NY 10016" },
  { name: "67th Street Library", description: "A neighborhood branch serving the Upper East Side community since 1905.", borough: "Manhattan", address: "328 E 67th Street, New York, NY 10065" },
  { name: "Bloomingdale Library", description: "A welcoming Upper West Side branch offering books, programs, and community resources.", borough: "Manhattan", address: "150 W 100th Street, New York, NY 10025" },
  { name: "Kips Bay Library", description: "A Midtown East branch serving the Kips Bay neighborhood with a broad collection of materials.", borough: "Manhattan", address: "446 3rd Avenue, New York, NY 10016" },
  { name: "58th Street Library", description: "A Midtown branch conveniently located near major transit hubs in Midtown Manhattan.", borough: "Manhattan", address: "127 E 58th Street, New York, NY 10022" },
  { name: "53rd Street Library", description: "A Midtown branch located in the heart of Manhattan serving office workers and residents alike.", borough: "Manhattan", address: "18 W 53rd Street, New York, NY 10019" },
  { name: "George Bruce Library", description: "A Harlem branch offering extensive programs and services for the West Harlem community.", borough: "Manhattan", address: "518 W 125th Street, New York, NY 10027" },
  { name: "Countee Cullen Library", description: "A Harlem branch named for the celebrated Harlem Renaissance poet, serving the Central Harlem community.", borough: "Manhattan", address: "104 W 136th Street, New York, NY 10030" },
  { name: "Hamilton Grange Library", description: "A Washington Heights branch named for a nearby historic house associated with Alexander Hamilton.", borough: "Manhattan", address: "503 W 145th Street, New York, NY 10031" },
  { name: "Fort Washington Library", description: "A northern Manhattan branch serving the Fort Washington neighborhood with diverse programming.", borough: "Manhattan", address: "535 W 179th Street, New York, NY 10033" },
  { name: "Washington Heights Library", description: "A community branch serving the vibrant Washington Heights neighborhood of upper Manhattan.", borough: "Manhattan", address: "1000 St Nicholas Avenue, New York, NY 10032" },
  { name: "Inwood Library", description: "The northernmost Manhattan branch, serving the culturally diverse Inwood community.", borough: "Manhattan", address: "4790 Broadway, New York, NY 10034" },
  { name: "Macomb's Bridge Library", description: "A Harlem branch serving the community around Macomb's Bridge in northern Manhattan.", borough: "Manhattan", address: "2650 Adam Clayton Powell Jr Blvd, New York, NY 10039" },
  { name: "125th Street Library", description: "A central Harlem branch on the iconic 125th Street corridor.", borough: "Manhattan", address: "224 E 125th Street, New York, NY 10035" },
  { name: "Harry Belafonte 115th Street Library", description: "A Harlem branch renamed to honor legendary entertainer and activist Harry Belafonte.", borough: "Manhattan", address: "203 W 115th Street, New York, NY 10026" },
  { name: "Harlem Library", description: "A branch serving the East Harlem community with bilingual resources and programming.", borough: "Manhattan", address: "9 W 124th Street, New York, NY 10027" },
  { name: "Schomburg Center for Research in Black Culture", description: "A world-renowned research center dedicated to the African diaspora, housing one of the largest collections of Black cultural materials.", borough: "Manhattan", address: "515 Malcolm X Blvd, New York, NY 10037" },
  { name: "Yorkville Library", description: "An Upper East Side branch serving the Yorkville neighborhood with programs for all ages.", borough: "Manhattan", address: "222 E 79th Street, New York, NY 10075" },
  { name: "96th Street Library", description: "An Upper East Side branch at the gateway to East Harlem, serving a diverse community.", borough: "Manhattan", address: "112 E 96th Street, New York, NY 10128" },
  { name: "Riverside Library", description: "An Upper West Side branch on Amsterdam Avenue offering reading and community programs.", borough: "Manhattan", address: "127 Amsterdam Avenue, New York, NY 10023" },
  { name: "Morningside Heights Library", description: "A branch serving the Columbia University area and surrounding Morningside Heights neighborhood.", borough: "Manhattan", address: "2900 Broadway, New York, NY 10025" },
  { name: "Muhlenberg Library", description: "A Chelsea branch serving the vibrant Muhlenberg neighborhood with a strong community focus.", borough: "Manhattan", address: "209 W 23rd Street, New York, NY 10011" },
  { name: "Tompkins Square Library", description: "An East Village branch named for the nearby Tompkins Square Park.", borough: "Manhattan", address: "331 E 10th Street, New York, NY 10009" },
  { name: "Ottendorfer Library", description: "A historic East Village branch, one of the city's oldest Carnegie-era libraries, serving the community since 1884.", borough: "Manhattan", address: "135 2nd Avenue, New York, NY 10003" },
  { name: "Mulberry Street Library", description: "A SoHo/Nolita branch serving Lower Manhattan with books and programs for the community.", borough: "Manhattan", address: "10 Jersey Street, New York, NY 10012" },
  { name: "Chatham Square Library", description: "A Lower East Side branch with a notable Chinese Heritage Collection serving the Chinatown community.", borough: "Manhattan", address: "33 E Broadway, New York, NY 10002" },
  { name: "Seward Park Library", description: "A Lower East Side branch named for the park of the same name, serving a historically immigrant community.", borough: "Manhattan", address: "192 E Broadway, New York, NY 10002" },
  { name: "Battery Park City Library", description: "A branch serving the Battery Park City residential community in Lower Manhattan.", borough: "Manhattan", address: "175 North End Avenue, New York, NY 10282" },
  { name: "New Amsterdam Library", description: "A branch in Lower Manhattan's Financial District serving residents and workers in the downtown area.", borough: "Manhattan", address: "9 Murray Street, New York, NY 10007" },
  { name: "Hudson Park Library", description: "A West Village branch serving the Hudson Square and West Village communities.", borough: "Manhattan", address: "66 Leroy Street, New York, NY 10014" },
  { name: "St. Agnes Library", description: "An Upper West Side branch serving the community between the 70s and 90s on Amsterdam Avenue.", borough: "Manhattan", address: "444 Amsterdam Avenue, New York, NY 10024" },
  { name: "Andrew Heiskell Braille and Talking Book Library", description: "A specialized branch providing accessible library services including braille and audio materials for people with print disabilities.", borough: "Manhattan", address: "40 W 20th Street, New York, NY 10011" },
  { name: "Stephen A. Schwarzman Building", description: "NYPL's iconic Beaux-Arts flagship research library on Fifth Avenue, housing millions of rare and historical items.", borough: "Manhattan", address: "476 5th Avenue, New York, NY 10018" },
  { name: "New York Public Library for the Performing Arts", description: "A world-class research library at Lincoln Center dedicated to dance, music, and theater collections.", borough: "Manhattan", address: "40 Lincoln Center Plaza, New York, NY 10023" },
  { name: "Webster Library", description: "An Upper East Side branch on York Avenue serving the Lenox Hill and Yorkville neighborhoods.", borough: "Manhattan", address: "1465 York Avenue, New York, NY 10075" },
  { name: "Roosevelt Island Library", description: "A branch serving the unique planned community of Roosevelt Island in the East River.", borough: "Manhattan", address: "504 Main St, New York, NY 10044" },
  { name: "Thomas Yoseloff Business Center at SNFL", description: "A specialized research center within SNFL offering business and career resources by appointment.", borough: "Manhattan", address: "455 5th Avenue, New York, NY 10016" },
  
  // Bronx
  { name: "Clason's Point Library", description: "A South Bronx branch serving the Clason Point and Soundview communities.", borough: "Bronx", address: "1215 Morrison Avenue, Bronx, NY 10472" },
  { name: "Throg's Neck Library", description: "A branch serving the Throggs Neck peninsula community in the eastern Bronx.", borough: "Bronx", address: "2180 Antin Place, Bronx, NY 10465" },
  { name: "Bronx Library Center", description: "The Bronx's flagship library, a modern hub offering comprehensive collections, computer labs, and community programs.", borough: "Bronx", address: "310 E Kingsbridge Road, Bronx, NY 10458" },
  { name: "Belmont Library and Enrico Fermi Cultural Center", description: "An Arthur Avenue branch serving the Little Italy neighborhood of the Bronx, named for Nobel Prize-winning physicist Enrico Fermi.", borough: "Bronx", address: "610 E 186th Street, Bronx, NY 10458" },
  { name: "Parkchester Library", description: "A branch serving the large Parkchester residential development community in the Bronx.", borough: "Bronx", address: "1985 Westchester Avenue, Bronx, NY 10462" },
  { name: "Van Cortlandt Library", description: "A northwest Bronx branch near Van Cortlandt Park serving the Woodlawn and Norwood communities.", borough: "Bronx", address: "3882 Cannon Place, Bronx, NY 10463" },
  { name: "Melrose Library", description: "A South Bronx branch serving the Melrose neighborhood with educational and cultural programs.", borough: "Bronx", address: "910 Morris Avenue, Bronx, NY 10451" },
  { name: "Soundview Library", description: "A branch serving the Soundview community in the southeastern Bronx.", borough: "Bronx", address: "50 Metcalfe Avenue, Bronx, NY 10473" },
  { name: "Morrisania Library", description: "A historic South Bronx branch serving the Morrisania neighborhood.", borough: "Bronx", address: "610 E 169th Street, Bronx, NY 10456" },
  { name: "Eastchester Library", description: "A northeast Bronx branch serving the Eastchester and Baychester communities.", borough: "Bronx", address: "1385 E Gun Hill Road, Bronx, NY 10469" },
  { name: "Jerome Park Library", description: "A northwest Bronx branch near Jerome Park Reservoir serving the Kingsbridge Heights area.", borough: "Bronx", address: "118 Eames Place, Bronx, NY 10468" },
  { name: "Grand Concourse Library", description: "A branch on the Grand Concourse serving the heart of the Bronx's central boulevard corridor.", borough: "Bronx", address: "155 E 173rd Street, Bronx, NY 10457" },
  { name: "Morris Park Library", description: "A branch serving the Morris Park neighborhood in the central Bronx.", borough: "Bronx", address: "985 Morris Park Avenue, Bronx, NY 10462" },
  { name: "Tremont Library", description: "A branch serving the Tremont neighborhood in the central Bronx.", borough: "Bronx", address: "1866 Washington Avenue, Bronx, NY 10457" },
  { name: "Riverdale Library", description: "A branch serving the upscale Riverdale neighborhood in the northwest Bronx.", borough: "Bronx", address: "5540 Mosholu Avenue, Bronx, NY 10471" },
  { name: "Allerton Library", description: "A northeast Bronx branch serving the Allerton and Pelham Parkway communities.", borough: "Bronx", address: "2740 Barnes Avenue, Bronx, NY 10467" },
  { name: "Mosholu Library", description: "A branch near Mosholu Parkway serving the Norwood and Bedford Park neighborhoods.", borough: "Bronx", address: "285 E 205th Street, Bronx, NY 10467" },
  { name: "Wakefield Library", description: "A far northeast Bronx branch serving the Wakefield community near the Westchester border.", borough: "Bronx", address: "4100 Napier Avenue, Bronx, NY 10466" },
  { name: "Sedgwick Library", description: "A branch serving the University Heights and Fordham communities in the west Bronx.", borough: "Bronx", address: "1701 Martin Luther King Jr Blvd, Bronx, NY 10453" },
  { name: "Hunts Point Library", description: "A branch serving the Hunts Point community, one of the Bronx's busiest industrial neighborhoods.", borough: "Bronx", address: "877 Southern Boulevard, Bronx, NY 10459" },
  { name: "West Farms Library", description: "A branch serving the West Farms neighborhood in the south-central Bronx.", borough: "Bronx", address: "2085 Honeywell Avenue, Bronx, NY 10460" },
  { name: "Woodstock Library", description: "A South Bronx branch serving the Morrisania and Woodstock communities.", borough: "Bronx", address: "761 E 160th Street, Bronx, NY 10456" },
  { name: "High Bridge Library", description: "A branch serving the High Bridge neighborhood, named for the historic aqueduct nearby.", borough: "Bronx", address: "78 W 168th Street, Bronx, NY 10452" },
  { name: "Kingsbridge Library", description: "A northwest Bronx branch serving the Kingsbridge and Marble Hill communities.", borough: "Bronx", address: "291 W 231st Street, Bronx, NY 10463" },
  { name: "Spuyten Duyvil Library", description: "A branch in the Spuyten Duyvil neighborhood near the northernmost tip of the Bronx.", borough: "Bronx", address: "650 W 235th Street, Bronx, NY 10463" },
  { name: "Francis Martin Library", description: "A branch serving the University Heights community in the west Bronx.", borough: "Bronx", address: "2150 University Avenue, Bronx, NY 10453" },
  { name: "Pelham Bay Library", description: "A branch serving the Pelham Bay neighborhood in the far eastern Bronx.", borough: "Bronx", address: "3060 Middletown Road, Bronx, NY 10461" },
  { name: "Edenwald Library", description: "A far northeast Bronx branch serving the Edenwald neighborhood.", borough: "Bronx", address: "1255 E 233rd Street, Bronx, NY 10466" },
  { name: "Woodlawn Heights Library", description: "A small branch serving the Woodlawn Heights community near the northern Bronx border.", borough: "Bronx", address: "4355 Katonah Avenue, Bronx, NY 10470" },
  { name: "Mott Haven Library", description: "A South Bronx branch serving the Mott Haven neighborhood, one of the Bronx's oldest communities.", borough: "Bronx", address: "168 E 168th Street, Bronx, NY 10452" },
  
  // Staten Island
  { name: "Dongan Hills Library", description: "A Staten Island branch serving the Dongan Hills neighborhood on Richmond Road.", borough: "Staten Island", address: "1617 Richmond Road, Staten Island, NY 10304" },
  { name: "Great Kills Library", description: "A branch serving the Great Kills neighborhood in the southeastern area of Staten Island.", borough: "Staten Island", address: "56 Giffords Lane, Staten Island, NY 10308" },
  { name: "Todt Hill-Westerleigh Library", description: "A mid-island Staten Island branch serving the Todt Hill and Westerleigh communities.", borough: "Staten Island", address: "2550 Victory Boulevard, Staten Island, NY 10314" },
  { name: "Tottenville Library", description: "A branch at the southernmost tip of Staten Island—and all of New York City—serving the Tottenville community.", borough: "Staten Island", address: "7430 Amboy Road, Staten Island, NY 10307" },
  { name: "Charleston Library", description: "A southwestern Staten Island branch serving the Charleston and Richmond Valley communities.", borough: "Staten Island", address: "489 Veltri Lane, Staten Island, NY 10309" },
  { name: "Richmondtown Library", description: "A branch near the Historic Richmond Town site serving central Staten Island.", borough: "Staten Island", address: "200 Clarke Avenue, Staten Island, NY 10306" },
  { name: "South Beach Library", description: "A branch serving the South Beach and Midland Beach communities on Staten Island's eastern shore.", borough: "Staten Island", address: "21 Robin Road, Staten Island, NY 10305" },
  { name: "St. George Library Center", description: "Staten Island's flagship library located near the St. George Ferry Terminal, offering comprehensive services.", borough: "Staten Island", address: "5 Central Avenue, Staten Island, NY 10301" },
  { name: "Huguenot Park Library", description: "A branch serving the Huguenot Park community in southwestern Staten Island.", borough: "Staten Island", address: "830 Huguenot Avenue, Staten Island, NY 10312" },
  { name: "West New Brighton Library", description: "A branch in Staten Island's West New Brighton neighborhood serving north shore residents.", borough: "Staten Island", address: "976 Castleton Avenue, Staten Island, NY 10310" },
  { name: "Stapleton Library", description: "A branch in the Stapleton neighborhood, one of Staten Island's most historically diverse communities.", borough: "Staten Island", address: "132 Canal Street, Staten Island, NY 10304" },
  { name: "Port Richmond Library", description: "A north shore Staten Island branch serving the Port Richmond community, with a long history dating to 1905.", borough: "Staten Island", address: "75 Bennett Street, Staten Island, NY 10302" },
]

// Create a map for quick library lookup by name
export const LIBRARY_MAP = new Map(NYPL_LIBRARIES.map(lib => [lib.name, lib]))

// Get libraries grouped by borough
export function getLibrariesByBorough(): Record<Borough, NYPLLibrary[]> {
  const grouped: Record<Borough, NYPLLibrary[]> = {
    "Manhattan": [],
    "Bronx": [],
    "Staten Island": [],
  }
  
  for (const lib of NYPL_LIBRARIES) {
    if (lib.borough in grouped) {
      grouped[lib.borough as Borough].push(lib)
    }
  }
  
  // Sort libraries alphabetically within each borough
  for (const borough of BOROUGHS) {
    grouped[borough].sort((a, b) => a.name.localeCompare(b.name))
  }
  
  return grouped
}

// Get library info by name (fuzzy match)
export function findLibrary(locationName: string): NYPLLibrary | undefined {
  // First try exact match
  const exact = LIBRARY_MAP.get(locationName)
  if (exact) return exact
  
  // Try partial match
  const normalized = locationName.toLowerCase().trim()
  return NYPL_LIBRARIES.find(lib => 
    lib.name.toLowerCase().includes(normalized) ||
    normalized.includes(lib.name.toLowerCase())
  )
}

// Get Google Maps URL for an address
export function getGoogleMapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}

// Get library names as a flat array
export function getLibraryNames(): string[] {
  return NYPL_LIBRARIES.map(lib => lib.name).sort()
}
