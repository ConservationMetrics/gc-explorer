/**
 * Re-export from shared utils so server code can keep importing from @/server/dataProcessing/transformData.
 * The canonical implementation lives in utils/dataProcessing/ for use by both server and client (269).
 */
export {
  transformSurveyData,
  prepareMapData,
  prepareAlertData,
  prepareAlertsStatistics,
  prepareMapStatistics,
  transformToGeojson,
} from "@/utils/dataProcessing/transformData";
