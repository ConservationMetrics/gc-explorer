import { describe, expect, it } from "vitest";

import {
  camelToSnake,
  replaceUnderscoreWithSpace,
  snakeToTitleCase,
  titleToCamelCase,
  titleToSnakeCase,
  toCamelCase,
} from "@/utils/identifierUtils";

describe("camelToSnake", () => {
  it("converts typical camelCase keys used in statistics exports", () => {
    expect(camelToSnake("rowType")).toBe("row_type");
    expect(camelToSnake("alertsMonthly")).toBe("alerts_monthly");
    expect(camelToSnake("alertsCumulative")).toBe("alerts_cumulative");
    expect(camelToSnake("hectaresMonthly")).toBe("hectares_monthly");
    expect(camelToSnake("hectaresCumulative")).toBe("hectares_cumulative");
    expect(camelToSnake("alertsTotal")).toBe("alerts_total");
    expect(camelToSnake("hectaresTotal")).toBe("hectares_total");
  });

  it("leaves single-word and already-lowercase segments unchanged aside from lowercasing", () => {
    expect(camelToSnake("period")).toBe("period");
    expect(camelToSnake("monthly")).toBe("monthly");
  });

  it("handles consecutive capitals before a final lowercase segment (acronyms)", () => {
    expect(camelToSnake("XMLParser")).toBe("xml_parser");
    expect(camelToSnake("HTTPResponse")).toBe("http_response");
  });

  it("matches gc-scripts-hub-style MyProjectName example", () => {
    expect(camelToSnake("MyProjectName")).toBe("my_project_name");
  });

  it("returns empty string for empty input", () => {
    expect(camelToSnake("")).toBe("");
  });
});

describe("toCamelCase", () => {
  it("converts SCREAMING_SNAKE to camelCase", () => {
    expect(toCamelCase("MEDIA_BASE_PATH")).toBe("mediaBasePath");
  });
});

describe("replaceUnderscoreWithSpace", () => {
  it("replaces underscores with spaces", () => {
    expect(replaceUnderscoreWithSpace("my_table_name")).toBe("my table name");
  });
});

describe("titleToSnakeCase", () => {
  it("converts spaced title text to snake_case", () => {
    expect(titleToSnakeCase("Illegal Logging")).toBe("illegal_logging");
  });
});

describe("snakeToTitleCase", () => {
  it("converts snake_case to Title Case", () => {
    expect(snakeToTitleCase("illegal_logging")).toBe("Illegal Logging");
  });
});

describe("titleToCamelCase", () => {
  it("converts spaced title text to camelCase", () => {
    expect(titleToCamelCase("Illegal Logging")).toBe("illegalLogging");
  });
});
