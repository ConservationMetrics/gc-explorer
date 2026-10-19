type AlertFieldTooltipContext = {
  alertType?: string;
  dataProvider?: string;
  value?: string;
};

type ConfidenceTooltip = {
  alertType: string;
  dataProvider: string;
  key: string;
};

const confidenceTooltips: ConfidenceTooltip[] = [
  {
    dataProvider: "Global Forest Watch",
    alertType: "nasa viirs fire alerts",
    key: "confidenceLevelNasaVIIRSFireAlerts",
  },
  {
    dataProvider: "Global Forest Watch",
    alertType: "gfw integrated alerts",
    key: "confidenceLevelGFWIntegratedAlerts",
  },
  {
    dataProvider: "Global Forest Watch",
    alertType: "gfw_glad_alerts",
    key: "confidenceLevelGFWGladAlerts",
  },
  {
    dataProvider: "Imazon",
    alertType: "gold mining",
    key: "confidenceLevelTerrasImazonGoldMining",
  },
  {
    dataProvider: "Terras",
    alertType: "gold mining",
    key: "confidenceLevelTerrasImazonGoldMining",
  },
];

const tierValidationTooltips: Record<string, string> = {
  "1": "tierValidation1",
  "2": "tierValidation2",
  "3": "tierValidation3",
  "4": "tierValidation4",
};

/**
 * Canonical tier label. Numeric `3.0` matches the tooltip table as `3`.
 *
 * @param {unknown} value - The stored tier validation value.
 * @returns {string} The display tier, such as `1` or `3`.
 */
export const normalizeTierValidation = (value: unknown): string => {
  const raw = String(value ?? "").trim();
  const asNumber = Number(raw);
  if (raw !== "" && Number.isInteger(asNumber)) return String(asNumber);
  return raw.toUpperCase();
};

const tooltipKeyForField: Record<
  string,
  (context: AlertFieldTooltipContext) => string | undefined
> = {
  confidencelevel: ({ alertType, dataProvider }) =>
    confidenceTooltips.find(
      (entry) =>
        entry.dataProvider === dataProvider && entry.alertType === alertType,
    )?.key,
  tiervalidation: ({ value }) =>
    tierValidationTooltips[normalizeTierValidation(value)],
};

/**
 * Returns the i18n key for an alert field tooltip.
 *
 * @param {string} fieldKey - The display field key, such as `confidenceLevel`.
 * @param {AlertFieldTooltipContext} [context] - Provider, alert type, and value.
 * @returns {string | undefined} The translation key, when this field has an explanation.
 */
export const alertFieldTooltipKey = (
  fieldKey: string,
  context: AlertFieldTooltipContext = {},
): string | undefined => tooltipKeyForField[fieldKey.toLowerCase()]?.(context);
