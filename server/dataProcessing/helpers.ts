/**
 * Re-export from shared utils so server code can keep importing from @/server/dataProcessing/helpers.
 * The canonical implementation lives in utils/dataProcessing/ for use by both server and client (269).
 */
export {
  getRandomColor,
  capitalizeFirstLetter,
  isValidCoordinate,
  hasValidCoordinates,
  calculateCentroid,
  formatDate,
} from "@/utils/dataProcessing/helpers";
