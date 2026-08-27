import { useAppConfig } from "#imports";
import type { H3Event } from "h3";

import type {
  CreateViewBody,
  UpdateViewBody,
  ViewConfig,
  ViewType,
} from "@/types";

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Parses a positive integer view ID from the route.
 *
 * @param event - Request event with a view_id route parameter.
 * @returns {number} Valid view ID.
 */
export const parseViewId = (event: H3Event): number => {
  const rawViewId = event.context.params?.view_id;
  if (
    typeof rawViewId !== "string" ||
    !/^\d+$/.test(rawViewId) ||
    rawViewId === "0"
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "view_id must be a positive integer",
    });
  }

  return parseInt(rawViewId, 10);
};

/**
 * Validates a request body for view creation.
 *
 * @param value - Parsed request body.
 * @returns {CreateViewBody} Valid creation fields.
 */
export const parseCreateViewBody = (value: unknown): CreateViewBody => {
  if (!isObject(value)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Request body must be an object",
    });
  }

  const primaryDataset = value.primaryDataset;
  const viewType = value.viewType;
  const secondaryDataset = value.secondaryDataset;
  const viewConfig = value.viewConfig;
  const viewTypes = useAppConfig().viewTypes as readonly string[];

  if (typeof primaryDataset !== "string" || primaryDataset.trim() === "") {
    throw createError({
      statusCode: 400,
      statusMessage: "primaryDataset is required",
    });
  }
  if (typeof viewType !== "string" || !viewTypes.includes(viewType)) {
    throw createError({
      statusCode: 400,
      statusMessage: `viewType must be one of: ${viewTypes.join(", ")}`,
    });
  }
  if (
    secondaryDataset !== undefined &&
    secondaryDataset !== null &&
    typeof secondaryDataset !== "string"
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "secondaryDataset must be a string or null",
    });
  }
  if (viewConfig !== undefined && !isObject(viewConfig)) {
    throw createError({
      statusCode: 400,
      statusMessage: "viewConfig must be an object",
    });
  }

  return {
    primaryDataset,
    secondaryDataset,
    viewConfig: viewConfig as ViewConfig | undefined,
    viewType: viewType as ViewType,
  };
};

/**
 * Validates a request body for view updates.
 *
 * @param value - Parsed request body.
 * @returns {UpdateViewBody} Valid update fields.
 */
export const parseUpdateViewBody = (value: unknown): UpdateViewBody => {
  if (!isObject(value) || !isObject(value.viewConfig)) {
    throw createError({
      statusCode: 400,
      statusMessage: "viewConfig is required and must be an object",
    });
  }

  const secondaryDataset = value.secondaryDataset;
  if (
    secondaryDataset !== undefined &&
    secondaryDataset !== null &&
    typeof secondaryDataset !== "string"
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "secondaryDataset must be a string or null",
    });
  }

  return {
    secondaryDataset,
    viewConfig: value.viewConfig as ViewConfig,
  };
};
