import { describe, expect, it } from "vitest";

import { VIEW_CONFIG_MISSING_COLUMNS_ERROR } from "@/types";
import { getDataLoadErrorMessage } from "@/utils/dataLoadError";

const messages: Record<string, string> = {
  missingConfiguredColumn:
    "The {field} setting refers to column {column}, which does not exist on table {table}.",
  missingConfiguredColumnItem: "{field} ({column})",
  missingConfiguredColumns:
    "These settings refer to columns that do not exist on table {table}: {list}.",
  dataLoadErrorMessage: "Something went wrong.",
};

const t = (key: string, params?: Record<string, unknown>): string => {
  const template = messages[key] ?? key;
  if (!params) return template;
  return Object.entries(params).reduce((message, [name, value]) => {
    return message.replaceAll(`{${name}}`, String(value));
  }, template);
};

describe("getDataLoadErrorMessage", () => {
  it("uses the single-column translation when one column is missing", () => {
    expect(
      getDataLoadErrorMessage(
        {
          statusCode: 422,
          statusMessage: "English fallback",
          data: {
            errorCode: VIEW_CONFIG_MISSING_COLUMNS_ERROR,
            table: "map_dataset",
            missing: [{ field: "COLOR_COLUMN", column: "gone" }],
          },
        },
        t,
      ),
    ).toBe(
      "The COLOR_COLUMN setting refers to column gone, which does not exist on table map_dataset.",
    );
  });

  it("uses the list translation when several columns are missing", () => {
    expect(
      getDataLoadErrorMessage(
        {
          data: {
            errorCode: VIEW_CONFIG_MISSING_COLUMNS_ERROR,
            table: "map_dataset",
            missing: [
              { field: "COLOR_COLUMN", column: "gone" },
              { field: "ICON_COLUMN", column: "also_gone" },
            ],
          },
        },
        t,
      ),
    ).toBe(
      "These settings refer to columns that do not exist on table map_dataset: COLOR_COLUMN (gone), ICON_COLUMN (also_gone).",
    );
  });

  it("reads the error when it is nested one level under data", () => {
    expect(
      getDataLoadErrorMessage(
        {
          data: {
            statusCode: 422,
            data: {
              errorCode: VIEW_CONFIG_MISSING_COLUMNS_ERROR,
              table: "gallery_dataset",
              missing: [{ field: "MEDIA_COLUMN", column: "photo" }],
            },
          },
        },
        t,
      ),
    ).toBe(
      "The MEDIA_COLUMN setting refers to column photo, which does not exist on table gallery_dataset.",
    );
  });

  it("uses statusMessage when the error code is unknown", () => {
    expect(
      getDataLoadErrorMessage(
        {
          statusCode: 422,
          statusMessage:
            'Alerts require columns _id in table "alerts_dataset".',
        },
        t,
      ),
    ).toBe('Alerts require columns _id in table "alerts_dataset".');
  });

  it("uses the generic translation when there is no message", () => {
    expect(getDataLoadErrorMessage(null, t)).toBe("Something went wrong.");
    expect(getDataLoadErrorMessage({}, t)).toBe("Something went wrong.");
  });
});
