import murmurhash from 'murmurhash';

const getRandomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};
const capitalizeFirstLetter = (string) => {
  return string.split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
};
const isValidCoordinate = (coord) => {
  return coord != null && !isNaN(coord) && coord >= -180 && coord <= 180;
};
const hasValidCoordinates = (obj) => {
  return Object.keys(obj).some((key) => {
    if (key.toLowerCase().includes("coordinates")) {
      const rawCoordinates = obj[key];
      if (!rawCoordinates) {
        console.warn("Null or undefined coordinates:", key);
        return false;
      }
      let parsedCoordinates = [];
      if (typeof rawCoordinates === "string") {
        const trimmed = rawCoordinates.replace(/\s+/g, "");
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
          try {
            parsedCoordinates = JSON.parse(trimmed);
          } catch (e) {
            console.warn("Error parsing JSON coordinates:", rawCoordinates, e);
            return false;
          }
        } else {
          const splitCoordinates = trimmed.split(",");
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
      if (Array.isArray(parsedCoordinates) && parsedCoordinates.length > 0) {
        return parsedCoordinates.length % 2 === 0 && parsedCoordinates.every(isValidCoordinate);
      }
      console.warn("Coordinates array is empty or invalid:", parsedCoordinates);
      return false;
    }
    return false;
  });
};
const calculateCentroid = (coords) => {
  const allCoords = JSON.parse(coords);
  let totalLat = 0;
  let totalLng = 0;
  let numCoords = 0;
  const processCoord = (coord) => {
    totalLng += coord[0];
    totalLat += coord[1];
    numCoords++;
  };
  const processLineString = (lineString) => {
    lineString.forEach(processCoord);
  };
  const processPolygon = (polygon) => {
    polygon.forEach(processLineString);
  };
  if (Array.isArray(allCoords[0]) && Array.isArray(allCoords[0][0]) && Array.isArray(allCoords[0][0][0])) {
    allCoords.forEach(processPolygon);
  } else if (Array.isArray(allCoords[0]) && Array.isArray(allCoords[0][0])) {
    processPolygon(allCoords);
  } else if (Array.isArray(allCoords[0])) {
    processLineString(allCoords);
  } else if (Array.isArray(allCoords) && typeof allCoords[0] === "number" && typeof allCoords[1] === "number") {
    processCoord(allCoords);
  } else {
    console.error("Invalid input format");
    return "";
  }
  const avgLng = (totalLng / numCoords).toFixed(6);
  const avgLat = (totalLat / numCoords).toFixed(6);
  return `${avgLat}, ${avgLng}`;
};
const formatDate = (date) => {
  const dateRegex = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}).*/;
  const dateMatch = date.match(dateRegex);
  if (dateMatch) {
    date = (/* @__PURE__ */ new Date(
      `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}T${dateMatch[4]}:${dateMatch[5]}:${dateMatch[6]}`
    )).toLocaleDateString();
  }
  return date;
};

const transformSurveyData = (data) => {
  const transformSurveyDataKey = (key) => {
    let transformedKey = key.replace(/^g__/, "geo").replace(/^p__/, "").replace(/_/g, " ");
    if (transformedKey.toLowerCase() === "today") {
      transformedKey = "dataCollectedOn";
    } else if (transformedKey.toLowerCase().includes("categoryid")) {
      transformedKey = "category";
    } else if (transformedKey.toLowerCase() === "id") {
      transformedKey = "id";
    }
    return transformedKey.trimStart();
  };
  const transformSurveyDataValue = (key, value) => {
    if (value === null) return null;
    if (key === "g__coordinates") return value;
    let transformedValue = value;
    if (typeof transformedValue === "string") {
      transformedValue = transformedValue.replace(/_/g, " ").replace(/;/g, ", ");
      if (key.toLowerCase().includes("category")) {
        transformedValue = transformedValue.replace(/-/g, " ");
      }
      if (key.toLowerCase().includes("created") || key.toLowerCase().includes("modified") || key.toLowerCase().includes("updated")) {
        transformedValue = formatDate(transformedValue);
      }
      transformedValue = transformedValue.charAt(0).toUpperCase() + transformedValue.slice(1);
    }
    if (typeof transformedValue === "string" && transformedValue.match(/^\[.*\]$/)) {
      transformedValue = transformedValue.replace(/^\[|\]$/g, "").split(", ").map((item) => item.replace(/'/g, "")).join(", ");
    }
    return transformedValue;
  };
  const transformedData = data.map((entry) => {
    const transformedEntry = {};
    Object.entries(entry).forEach(([key, value]) => {
      const transformedKey = transformSurveyDataKey(key);
      const transformedValue = transformSurveyDataValue(key, value);
      if (transformedValue !== null) {
        transformedEntry[transformedKey] = String(transformedValue);
      }
    });
    return transformedEntry;
  });
  return transformedData;
};
const prepareMapData = (data, filterColumn) => {
  const colorMap = /* @__PURE__ */ new Map();
  const processGeolocation = (obj) => {
    if (!obj.geocoordinates || obj.geocoordinates.trim() === "") {
      return obj;
    }
    try {
      const geometryType = obj.geotype;
      let coordinates = [];
      if (!Array.isArray(obj.geocoordinates)) {
        coordinates = JSON.parse(obj.geocoordinates);
      } else {
        coordinates = obj.geocoordinates;
      }
      if (geometryType === "Point" && Array.isArray(coordinates) && coordinates.length === 2) {
        obj.geocoordinates = JSON.stringify(coordinates);
      } else if (geometryType === "LineString") {
        obj.geocoordinates = JSON.stringify(coordinates);
      } else if (geometryType === "Polygon") {
        obj.geocoordinates = JSON.stringify([coordinates]);
      }
    } catch (error) {
      console.error("Error parsing coordinates:", error);
    }
    return obj;
  };
  const processedGeoData = data.map((item) => {
    var _a, _b;
    if (!item.geotype) {
      const coordinateKey = Object.keys(item).find(
        (key) => key.toLowerCase().includes("coordinates")
      );
      if (coordinateKey) {
        const coordinates = JSON.parse(item[coordinateKey]);
        if (Array.isArray(coordinates) && coordinates.length === 2 && typeof coordinates[0] === "number" && typeof coordinates[1] === "number") {
          item.geotype = "Point";
        } else {
          item.geotype = "Polygon";
        }
      }
    }
    const filterColumnValue = filterColumn !== void 0 ? (_a = item[filterColumn]) != null ? _a : "" : "";
    if (filterColumnValue && !colorMap.has(filterColumnValue)) {
      colorMap.set(filterColumnValue, getRandomColor());
    }
    item["filter-color"] = (_b = colorMap.get(filterColumnValue)) != null ? _b : "#3333FF";
    return processGeolocation(item);
  });
  return processedGeoData;
};
const prepareAlertData = (data) => {
  const transformChangeDetectionItem = (item, formattedMonth) => {
    var _a, _b, _c, _d, _e;
    const transformedItem = {};
    Object.keys(item).forEach((key) => {
      if (key.startsWith("g__")) {
        transformedItem[key] = item[key];
      }
    });
    if (item.data_source === "Global Forest Watch") {
      transformedItem["alertID"] = item.alert_id;
      transformedItem["confidenceLevel"] = item.confidence;
      transformedItem["alertType"] = (_b = (_a = item.alert_type) == null ? void 0 : _a.replace(/_/g, " ")) != null ? _b : "";
      transformedItem["dataProvider"] = capitalizeFirstLetter(item.data_source);
      transformedItem["geographicCentroid"] = calculateCentroid(
        item.g__coordinates
      );
      transformedItem["YYYYMM"] = item.year_detec + item.month_detec;
      transformedItem["monthDetected"] = `${item.month_detec}-${item.year_detec}`;
      transformedItem["alertDetectionRange"] = `${item.date_start_t1} to ${item.date_end_t1}`;
      return transformedItem;
    }
    const satelliteLookup = {
      S1: "Sentinel-1",
      S2: "Sentinel-2",
      PS: "Planetscope",
      L8: "Landsat 8",
      L9: "Landsat 9",
      WV1: "WorldView-1",
      WV2: "WorldView-2",
      WV3: "WorldView-3",
      WV4: "WorldView-4",
      IK: "IKONOS"
    };
    transformedItem["territory"] = capitalizeFirstLetter(
      (_c = item.territory_name) != null ? _c : ""
    );
    transformedItem["alertID"] = item.alert_id;
    transformedItem["alertDetectionRange"] = `${item.date_start_t1} to ${item.date_end_t1}`;
    transformedItem["monthDetected"] = `${formattedMonth}-${item.year_detec}`;
    transformedItem["YYYYMM"] = `${item.year_detec}${formattedMonth}`;
    transformedItem["dataProvider"] = capitalizeFirstLetter(
      `${item.data_source}`
    );
    transformedItem["confidenceLevel"] = item.confidence;
    transformedItem["alertType"] = (_e = (_d = item.alert_type) == null ? void 0 : _d.replace(/_/g, " ")) != null ? _e : "";
    transformedItem["alertAreaHectares"] = typeof item.area_alert_ha === "number" ? item.area_alert_ha.toFixed(2) : item.area_alert_ha;
    transformedItem["geographicCentroid"] = calculateCentroid(
      item.g__coordinates
    );
    transformedItem["satelliteUsedForDetection"] = satelliteLookup[item.sat_detect_prefix] || item.sat_detect_prefix;
    transformedItem["t0_url"] = `alerts/${item.territory_id}/${item.year_detec}/${formattedMonth}/${item.alert_id}/images/${item.sat_viz_prefix}_T0_${item.alert_id}.jpg`;
    transformedItem["t1_url"] = `alerts/${item.territory_id}/${item.year_detec}/${formattedMonth}/${item.alert_id}/images/${item.sat_viz_prefix}_T1_${item.alert_id}.jpg`;
    transformedItem["previewImagerySource"] = satelliteLookup[item.sat_viz_prefix] || item.sat_viz_prefix;
    return transformedItem;
  };
  let latestProprietaryDate = /* @__PURE__ */ new Date(0);
  let latestProprietaryMonthStr = "";
  const validGeoData = data.filter(isValidGeolocation);
  const proprietaryAlertData = validGeoData.filter(
    (d) => d.data_source !== "Global Forest Watch"
  );
  const gfwData = validGeoData.filter(
    (d) => d.data_source === "Global Forest Watch"
  );
  proprietaryAlertData.forEach((item) => {
    const formattedMonth = item.month_detec.length === 1 ? `0${item.month_detec}` : item.month_detec;
    const monthYearStr = `${formattedMonth}-${item.year_detec}`;
    const date = new Date(
      parseInt(item.year_detec),
      parseInt(formattedMonth) - 1
    );
    if (date > latestProprietaryDate) {
      latestProprietaryDate = date;
      latestProprietaryMonthStr = monthYearStr;
    }
  });
  let latestGfwDate = /* @__PURE__ */ new Date(0);
  gfwData.forEach((item) => {
    const date = new Date(item.date_end_t1);
    if (date > latestGfwDate) latestGfwDate = date;
  });
  const mostRecentAlerts = [];
  const previousAlerts = [];
  proprietaryAlertData.forEach((item) => {
    const formattedMonth = item.month_detec.length === 1 ? `0${item.month_detec}` : item.month_detec;
    const monthYearStr = `${formattedMonth}-${item.year_detec}`;
    const transformedItem = transformChangeDetectionItem(item, formattedMonth);
    if (monthYearStr === latestProprietaryMonthStr) {
      mostRecentAlerts.push(transformedItem);
    } else {
      previousAlerts.push(transformedItem);
    }
  });
  gfwData.forEach((item) => {
    const date = new Date(item.date_end_t1);
    const transformedItem = transformChangeDetectionItem(item);
    if (date.getTime() === latestGfwDate.getTime()) {
      mostRecentAlerts.push(transformedItem);
    } else {
      previousAlerts.push(transformedItem);
    }
  });
  return { mostRecentAlerts, previousAlerts };
};
const prepareAlertsStatistics = (data, metadata) => {
  const isGFW = data.some((item) => item.data_source === "Global Forest Watch");
  const territory = isGFW ? "" : data[0].territory_name.charAt(0).toUpperCase() + data[0].territory_name.slice(1);
  const typeOfAlerts = Array.from(
    new Set(
      data.map((item) => {
        var _a;
        return (_a = item.alert_type) == null ? void 0 : _a.replace(/_/g, " ");
      }).filter((alertType) => alertType !== null)
    )
  );
  const dataProviders = isGFW ? Array.from(new Set(data.map((item) => item.data_source))) : metadata ? Array.from(new Set(metadata.map((item) => item.data_source))) : [];
  const formattedDates = data.map((item) => {
    return {
      date: /* @__PURE__ */ new Date(
        `${item.year_detec}-${item.month_detec.padStart(2, "0")}-15`
      ),
      dateString: `${item.month_detec.padStart(2, "0")}-${item.year_detec}`
    };
  });
  formattedDates.sort((a, b) => a.date.getTime() - b.date.getTime());
  let earliestDateStr, latestDateStr;
  let earliestDate, latestDate;
  if (!isGFW && metadata && metadata.length > 0) {
    metadata.sort(
      (a, b) => a.year === b.year ? a.month - b.month : a.year - b.year
    );
    const earliestMetadata = metadata[0];
    const latestMetadata = metadata[metadata.length - 1];
    earliestDate = new Date(
      earliestMetadata.year,
      earliestMetadata.month - 1,
      1
    );
    latestDate = new Date(latestMetadata.year, latestMetadata.month - 1, 28);
    earliestDateStr = `${String(earliestMetadata.month).padStart(2, "0")}-${earliestMetadata.year}`;
    latestDateStr = `${String(latestMetadata.month).padStart(2, "0")}-${latestMetadata.year}`;
  } else {
    earliestDate = formattedDates[0].date;
    earliestDate.setDate(1);
    earliestDateStr = formattedDates[0].dateString;
    latestDate = formattedDates[formattedDates.length - 1].date;
    latestDate.setDate(28);
    latestDateStr = formattedDates[formattedDates.length - 1].dateString;
  }
  const allDates = Array.from(
    new Set(formattedDates.map((item) => item.dateString))
  );
  const twelveMonthsBefore = new Date(latestDate);
  twelveMonthsBefore.setFullYear(twelveMonthsBefore.getFullYear() - 1);
  const last12MonthsData = data.filter((item) => {
    const itemDate = /* @__PURE__ */ new Date(
      `${item.year_detec}-${item.month_detec.padStart(2, "0")}-01`
    );
    return itemDate >= twelveMonthsBefore && itemDate <= latestDate;
  }).sort((a, b) => {
    const aDate = /* @__PURE__ */ new Date(
      `${a.year_detec}-${a.month_detec.padStart(2, "0")}`
    );
    const bDate = /* @__PURE__ */ new Date(
      `${b.year_detec}-${b.month_detec.padStart(2, "0")}`
    );
    return aDate.getTime() - bDate.getTime();
  });
  const twelveMonthsBeforeStr = `${twelveMonthsBefore.getMonth() + 1}-${twelveMonthsBefore.getFullYear()}`;
  const getUpTo12MonthsForChart = () => {
    const months2 = [];
    const currentDate = new Date(
      Date.UTC(latestDate.getUTCFullYear(), latestDate.getUTCMonth(), 15)
    );
    for (let i = 0; i < 12; i++) {
      if (i > 0) {
        currentDate.setMonth(currentDate.getMonth() - 1);
      }
      const month = String(currentDate.getUTCMonth() + 1).padStart(2, "0");
      const year = currentDate.getUTCFullYear();
      const monthYear = `${month}-${year}`;
      if (currentDate >= earliestDate && currentDate <= latestDate) {
        months2.push(monthYear);
      }
    }
    months2.reverse();
    return months2;
  };
  const updateCumulativeData = (dataCollection, accumulatorMap, property) => {
    let cumulativeValue = 0;
    const months2 = Object.keys(accumulatorMap);
    months2.forEach((monthYear) => {
      if (property === "alerts") {
        const monthData = dataCollection.filter((item) => {
          const itemMonthYear = `${item.month_detec.padStart(2, "0")}-${item.year_detec}`;
          return itemMonthYear === monthYear;
        });
        cumulativeValue += monthData.length;
      } else if (property === "hectares" && !isGFW) {
        dataCollection.forEach((item) => {
          const monthYearItem = `${item.month_detec.padStart(2, "0")}-${item.year_detec}`;
          if (monthYearItem === monthYear) {
            const hectares = parseFloat(item.area_alert_ha);
            cumulativeValue += isNaN(hectares) ? 0 : hectares;
          }
        });
      }
      accumulatorMap[monthYear] = parseFloat(cumulativeValue.toFixed(2));
    });
  };
  const alertsPerMonth = {};
  const hectaresPerMonth = {};
  const months = getUpTo12MonthsForChart();
  months.forEach((monthYear) => {
    alertsPerMonth[monthYear] = 0;
    hectaresPerMonth[monthYear] = 0;
  });
  updateCumulativeData(last12MonthsData, alertsPerMonth, "alerts");
  updateCumulativeData(last12MonthsData, hectaresPerMonth, "hectares");
  const recentAlertDate = last12MonthsData.length > 0 ? `${last12MonthsData[last12MonthsData.length - 1].month_detec.padStart(2, "0")}-${last12MonthsData[last12MonthsData.length - 1].year_detec}` : "N/A";
  const recentAlertsNumber = data.filter((item) => {
    const itemDateStr = `${item.month_detec.padStart(2, "0")}-${item.year_detec}`;
    return itemDateStr === recentAlertDate;
  }).length;
  const alertsTotal = data.length;
  const hectaresTotal = isGFW ? null : data.reduce(
    (total, item) => total + parseFloat(item.area_alert_ha || "0"),
    0
  ).toFixed(2);
  return {
    territory,
    typeOfAlerts,
    dataProviders,
    alertDetectionRange: `${earliestDateStr} to ${latestDateStr}`,
    allDates,
    earliestAlertsDate: earliestDateStr,
    recentAlertsDate: recentAlertDate,
    recentAlertsNumber,
    alertsTotal,
    alertsPerMonth,
    hectaresTotal,
    hectaresPerMonth: isGFW ? null : hectaresPerMonth,
    twelveMonthsBefore: twelveMonthsBeforeStr
  };
};
const transformToGeojson = (data) => {
  const features = data.map((input) => {
    const feature = {
      type: "Feature",
      id: void 0,
      properties: {},
      // Ensure properties is always an object
      geometry: {
        type: input.g__type,
        coordinates: []
      }
    };
    Object.entries(input).forEach(([key, value]) => {
      if (key === "alertID") {
        feature.id = murmurhash.v3(String(value));
        feature.properties[key] = value;
      } else if (key.startsWith("g__")) {
        const geometryKey = key.substring(3);
        if (feature.geometry) {
          if (geometryKey === "coordinates") {
            feature.geometry[geometryKey] = JSON.parse(
              String(value)
            );
          } else if (geometryKey === "type") {
            feature.geometry.type = String(value);
          }
        }
      } else {
        feature.properties[key] = value;
      }
    });
    return feature;
  });
  return {
    type: "FeatureCollection",
    features
  };
};
const isValidGeolocation = (item) => {
  const validGeoTypes = [
    "LineString",
    "MultiLineString",
    "Point",
    "Polygon",
    "MultiPolygon"
  ];
  const isValidCoordinates = (type, coordinates) => {
    if (typeof coordinates === "string") {
      try {
        coordinates = JSON.parse(coordinates);
      } catch (error) {
        console.error("Error parsing coordinates:", error);
        return false;
      }
    }
    if (type === "Point") {
      return Array.isArray(coordinates) && coordinates.length === 2 && coordinates.every(Number.isFinite);
    } else if (type === "LineString" || type === "MultiLineString") {
      return Array.isArray(coordinates) && coordinates.every(
        (coord) => Array.isArray(coord) && coord.length === 2 && coord.every(Number.isFinite)
      );
    } else if (type === "Polygon") {
      return Array.isArray(coordinates) && coordinates.every(
        (ring) => Array.isArray(ring) && ring.every(
          (coord) => Array.isArray(coord) && coord.length === 2 && coord.every(Number.isFinite)
        )
      );
    } else if (type === "MultiPolygon") {
      return Array.isArray(coordinates) && coordinates.every(
        (polygon) => Array.isArray(polygon) && polygon.every(
          (ring) => Array.isArray(ring) && ring.every(
            (coord) => Array.isArray(coord) && coord.length === 2 && coord.every(Number.isFinite)
          )
        )
      );
    }
    return false;
  };
  return validGeoTypes.includes(item.g__type) && isValidCoordinates(item.g__type, item.g__coordinates);
};

const filterUnwantedKeys = (data, columns, unwantedColumnsList, unwantedSubstringsList) => {
  const filterColumns = (originalColumns, unwantedColumns2, unwantedSubstrings2) => {
    return new Set(
      [...originalColumns].filter((column) => {
        if (unwantedColumns2.includes(column)) return true;
        if (unwantedSubstrings2.some((sub) => column.includes(sub))) return true;
        return false;
      })
    );
  };
  const unwantedColumns = unwantedColumnsList ? unwantedColumnsList.split(",") : [];
  const unwantedSubstrings = unwantedSubstringsList ? unwantedSubstringsList.split(",") : [];
  let filteredSqlColumns;
  if (columns) {
    const columnMapping = {};
    columns.forEach((column) => {
      columnMapping[column.original_column] = column.sql_column;
    });
    const originalColumnsSet = new Set(
      columns.map((column) => column.original_column)
    );
    const unwantedColumnsSet = filterColumns(
      originalColumnsSet,
      unwantedColumns,
      unwantedSubstrings
    );
    const unwantedSqlColumns = new Set(
      [...unwantedColumnsSet].map((column) => columnMapping[column])
    );
    filteredSqlColumns = new Set(
      Object.values(columnMapping).filter(
        (sqlColumn) => !unwantedSqlColumns.has(sqlColumn)
      )
    );
  } else {
    filteredSqlColumns = new Set(
      Object.keys(data[0]).filter(
        (key) => !unwantedColumns.includes(key) && !unwantedSubstrings.some((sub) => key.includes(sub))
      )
    );
  }
  const filteredData = data.map(
    (item) => Object.keys(item).filter((key) => filteredSqlColumns.has(key)).reduce((obj, key) => {
      obj[key] = item[key];
      return obj;
    }, {})
  );
  return filteredData;
};
const filterOutUnwantedValues = (data, filterByColumn, filterOutValues) => {
  if (!filterByColumn || !filterOutValues) {
    return data;
  }
  const valuesToFilterOut = new Set(filterOutValues.split(","));
  const filteredData = data.filter((item) => {
    return !valuesToFilterOut.has(item[filterByColumn]);
  });
  return filteredData;
};
const filterGeoData = (data) => {
  if (!Array.isArray(data)) {
    console.warn("Data is null, undefined, or not an array");
    return [];
  }
  const geoData = data.filter(
    (feature) => hasValidCoordinates(feature)
  );
  return geoData;
};
const filterDataByExtension = (data, extensions) => {
  return data.filter((entry) => {
    return Object.values(entry).some((value) => {
      return typeof value === "string" && (extensions.audio.some((ext) => value.toLowerCase().includes(ext)) || extensions.image.some((ext) => value.toLowerCase().includes(ext)) || extensions.video.some((ext) => value.toLowerCase().includes(ext)));
    });
  });
};

export { filterGeoData as a, transformSurveyData as b, prepareMapData as c, prepareAlertsStatistics as d, filterOutUnwantedValues as e, filterUnwantedKeys as f, filterDataByExtension as g, prepareAlertData as p, transformToGeojson as t };
//# sourceMappingURL=filterData.mjs.map
