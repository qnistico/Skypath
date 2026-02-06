/**
 * Airline ICAO code lookup
 * Maps 3-letter ICAO codes (from callsign prefixes) to airline names
 */

const AIRLINES = {
  // Major US Airlines
  'AAL': 'American Airlines',
  'DAL': 'Delta Air Lines',
  'UAL': 'United Airlines',
  'SWA': 'Southwest Airlines',
  'JBU': 'JetBlue Airways',
  'ASA': 'Alaska Airlines',
  'FFT': 'Frontier Airlines',
  'NKS': 'Spirit Airlines',
  'HAL': 'Hawaiian Airlines',
  'AAY': 'Allegiant Air',

  // Canada
  'ACA': 'Air Canada',
  'WJA': 'WestJet',
  'TSC': 'Air Transat',

  // Mexico & Latin America
  'AMX': 'Aeromexico',
  'VOI': 'Volaris',
  'VIV': 'Viva Aerobus',
  'LAN': 'LATAM Airlines',
  'AVA': 'Avianca',
  'GLO': 'Gol Transportes',
  'AZU': 'Azul Airlines',
  'ARG': 'Aerolineas Argentinas',
  'CMP': 'Copa Airlines',

  // UK & Ireland
  'BAW': 'British Airways',
  'EZY': 'easyJet',
  'VIR': 'Virgin Atlantic',
  'TOM': 'TUI Airways',
  'EIN': 'Aer Lingus',
  'RYR': 'Ryanair',

  // Continental Europe
  'AFR': 'Air France',
  'DLH': 'Lufthansa',
  'KLM': 'KLM Royal Dutch',
  'IBE': 'Iberia',
  'TAP': 'TAP Air Portugal',
  'AZA': 'ITA Airways',
  'VLG': 'Vueling',
  'SAS': 'Scandinavian Airlines',
  'FIN': 'Finnair',
  'NAX': 'Norwegian Air',
  'AUA': 'Austrian Airlines',
  'SWR': 'Swiss Int\'l Air',
  'BEL': 'Brussels Airlines',
  'LOT': 'LOT Polish Airlines',
  'CSA': 'Czech Airlines',
  'THY': 'Turkish Airlines',
  'AEE': 'Aegean Airlines',
  'WZZ': 'Wizz Air',

  // Russia & Eastern Europe
  'AFL': 'Aeroflot',
  'SBI': 'S7 Airlines',
  'SVR': 'Ural Airlines',

  // Middle East
  'UAE': 'Emirates',
  'QTR': 'Qatar Airways',
  'ETD': 'Etihad Airways',
  'ELY': 'El Al Israel',
  'MEA': 'Middle East Airlines',
  'GFA': 'Gulf Air',
  'SVA': 'Saudia',
  'KAC': 'Kuwait Airways',
  'RJA': 'Royal Jordanian',
  'OMA': 'Oman Air',

  // East Asia
  'CCA': 'Air China',
  'CES': 'China Eastern',
  'CSN': 'China Southern',
  'CHH': 'Hainan Airlines',
  'JAL': 'Japan Airlines',
  'ANA': 'All Nippon Airways',
  'KAL': 'Korean Air',
  'AAR': 'Asiana Airlines',
  'EVA': 'EVA Air',
  'CAL': 'China Airlines',
  'CPA': 'Cathay Pacific',
  'HKE': 'Hong Kong Express',

  // Southeast Asia
  'SIA': 'Singapore Airlines',
  'THA': 'Thai Airways',
  'MAS': 'Malaysia Airlines',
  'GIA': 'Garuda Indonesia',
  'PAL': 'Philippine Airlines',
  'VJC': 'VietJet Air',
  'HVN': 'Vietnam Airlines',
  'AXM': 'AirAsia',

  // South Asia
  'AIC': 'Air India',
  'IGO': 'IndiGo',
  'SEJ': 'SpiceJet',
  'ALK': 'SriLankan Airlines',
  'BGB': 'Biman Bangladesh',
  'PIA': 'Pakistan Int\'l',

  // Oceania
  'QFA': 'Qantas',
  'JST': 'Jetstar',
  'VOZ': 'Virgin Australia',
  'ANZ': 'Air New Zealand',
  'FJI': 'Fiji Airways',

  // Africa
  'SAA': 'South African Airways',
  'ETH': 'Ethiopian Airlines',
  'RAM': 'Royal Air Maroc',
  'MSR': 'EgyptAir',
  'KQA': 'Kenya Airways',
  'NGL': 'Nigeria Air',

  // Cargo (sometimes visible)
  'FDX': 'FedEx Express',
  'UPS': 'UPS Airlines',
  'GTI': 'Atlas Air',
  'CLX': 'Cargolux',
};

/**
 * Get airline name from callsign
 * @param {string} callsign - Flight callsign (e.g., "JBU583")
 * @returns {string|null} - Airline name or null if not found
 */
export function getAirlineName(callsign) {
  if (!callsign) return null;

  // Extract first 3 characters as ICAO code
  const icaoCode = callsign.substring(0, 3).toUpperCase();
  return AIRLINES[icaoCode] || null;
}

/**
 * Get airline ICAO code from callsign
 * @param {string} callsign - Flight callsign
 * @returns {string|null} - ICAO code or null
 */
export function getAirlineCode(callsign) {
  if (!callsign) return null;
  return callsign.substring(0, 3).toUpperCase();
}

/**
 * Format squawk code with meaning
 * @param {string} squawk - 4-digit squawk code
 * @returns {object} - { code, meaning, isEmergency }
 */
export function formatSquawk(squawk) {
  if (!squawk) return null;

  const emergencyCodes = {
    '7500': 'Hijack',
    '7600': 'Radio Failure',
    '7700': 'Emergency',
  };

  const meaning = emergencyCodes[squawk];

  return {
    code: squawk,
    meaning: meaning || null,
    isEmergency: !!meaning
  };
}
