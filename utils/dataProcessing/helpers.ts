/**
 * Generates a random hex color code (e.g. "#A3F2B1").
 * @returns A 6-digit hex color string including the leading "#".
 */
export const getRandomColor = (): string => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

/**
 * Capitalizes the first letter of each word in a string.
 * @param string - Input string (e.g. "hello world").
 * @returns String with each word capitalized (e.g. "Hello World").
 */
export const capitalizeFirstLetter = (string: string): string => {
  return string
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

/**
 * Checks if a number is a valid geographic longitude/latitude value.
 * @param coord - Numeric value to check.
 * @returns True if coord is in [-180, 180] and not NaN.
 */
export const isValidCoordinate = (coord: number): boolean => {
  return coord != null && !isNaN(coord) && coord >= -180 && coord <= 180;
};

/**
 * Determines if an object contains valid coordinate data under any key whose name
 * includes "coordinates" (case-insensitive). Supports JSON arrays and CSV-style strings.
 * @param obj - Object with string/number/null values (e.g. record properties).
 * @returns True if at least one coordinates-like key has parseable, valid coordinates.
 */
export const hasValidCoordinates = (
  obj: Record<string, string | number | null>,
): boolean => {
  return Object.keys(obj).some((key) => {
    if (key.toLowerCase().includes("coordinates")) {
      const rawCoordinates = obj[key];

      if (!rawCoordinates) {
        console.warn("Null or undefined coordinates:", key);
        return false; // skip if coordinates are null or undefined
      }

      let parsedCoordinates: number[] = [];

      // Filter out data with null or empty coordinates
      if (typeof rawCoordinates === "string") {
        const trimmed = rawCoordinates.replace(/\s+/g, "");

        // Check if it's a JSON-like array or a simple CSV
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
          try {
            parsedCoordinates = JSON.parse(trimmed);
          } catch (e) {
            console.warn("Error parsing JSON coordinates:", rawCoordinates, e);
            return false;
          }
        } else {
          // Try splitting as CSV string
          const splitCoordinates = trimmed.split(",");
          // Ensure each part can be converted to a valid number
          if (splitCoordinates.every((coord) => !isNaN(Number(coord)))) {
            parsedCoordinates = splitCoordinates.map(Number);
          } else {
            console.warn("Invalid CSV coordinates:", rawCoordinates);
            return false;
          }
        }
      } else if (Array.isArray(rawCoordinates)) {
        parsedCoordinates = rawCoordinates.flat().map(Number);
      }

      // If we have a valid array, check if all elements are valid coordinates
      if (Array.isArray(parsedCoordinates) && parsedCoordinates.length > 0) {
        return (
          parsedCoordinates.length % 2 === 0 &&
          parsedCoordinates.every(isValidCoordinate)
        );
      }

      console.warn("Coordinates array is empty or invalid:", parsedCoordinates);
      return false;
    }
    return false;
  });
};

/**
 * Calculates the centroid (average lat/lng) of a GeoJSON-style coordinate string.
 * Supports Point, LineString, Polygon, and MultiPolygon.
 * @param coords - JSON string of coordinates (e.g. "[lng, lat]" or "[[lng, lat], ...]").
 * @returns Centroid as "lat, lng" (6 decimal places), or "" if format is invalid.
 */
export const calculateCentroid = (coords: string): string => {
  type Coordinate = [number, number];
  type LineString = Coordinate[];
  type Polygon = LineString[];
  type MultiPolygon = Polygon[];

  const allCoords: MultiPolygon | Polygon | LineString | Coordinate =
    JSON.parse(coords);

  let totalLat = 0;
  let totalLng = 0;
  let numCoords = 0;

  const processCoord = (coord: Coordinate) => {
    totalLng += coord[0];
    totalLat += coord[1];
    numCoords++;
  };

  const processLineString = (lineString: LineString) => {
    lineString.forEach(processCoord);
  };

  const processPolygon = (polygon: Polygon) => {
    polygon.forEach(processLineString);
  };

  if (
    Array.isArray(allCoords[0]) &&
    Array.isArray(allCoords[0][0]) &&
    Array.isArray(allCoords[0][0][0])
  ) {
    // It's a MultiPolygon
    (allCoords as MultiPolygon).forEach(processPolygon);
  } else if (Array.isArray(allCoords[0]) && Array.isArray(allCoords[0][0])) {
    // It's a Polygon
    processPolygon(allCoords as Polygon);
  } else if (Array.isArray(allCoords[0])) {
    // It's a LineString
    processLineString(allCoords as LineString);
  } else if (
    Array.isArray(allCoords) &&
    typeof allCoords[0] === "number" &&
    typeof allCoords[1] === "number"
  ) {
    // It's a Point
    processCoord(allCoords as Coordinate);
  } else {
    console.error("Invalid input format");
    return "";
  }

  const avgLng = (totalLng / numCoords).toFixed(6);
  const avgLat = (totalLat / numCoords).toFixed(6);

  return `${avgLat}, ${avgLng}`;
};

/**
 * Formats an ISO-like date string to a locale date string.
 * @param date - Date string (e.g. "2024-01-15T12:00:00.000Z").
 * @returns Locale-formatted date string, or the original string if it doesn't match expected format.
 */
export const formatDate = (date: string): string => {
  // First let's ensure the date is in the correct format
  const dateRegex = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}).*/;
  const dateMatch = date.match(dateRegex);
  if (dateMatch) {
    date = new Date(
      `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}T${dateMatch[4]}:${dateMatch[5]}:${dateMatch[6]}`,
    ).toLocaleDateString();
  }
  return date;
};
