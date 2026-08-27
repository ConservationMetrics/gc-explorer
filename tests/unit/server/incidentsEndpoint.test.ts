import { beforeEach, describe, expect, it, vi } from "vitest";

import incidentsListHandler from "@/server/api/incidents/index.get";
import incidentByIdHandler from "@/server/api/incidents/[id].get";
import incidentsCreateHandler from "@/server/api/incidents/index.post";
import collectionsDeleteHandler from "@/server/api/collections/[id].delete";

const hoisted = vi.hoisted(() => {
  Object.assign(globalThis, {
    defineEventHandler: (handler: unknown) => handler,
    getUserSession: vi.fn(),
    readBody: vi.fn(),
  });

  return {
    handleListCollections: vi.fn(),
    handleGetCollection: vi.fn(),
    handleCreateCollection: vi.fn(),
    handleDeleteCollection: vi.fn(),
    validatePermissions: vi.fn(),
    getUserSession: globalThis.getUserSession as ReturnType<typeof vi.fn>,
    readBody: globalThis.readBody as ReturnType<typeof vi.fn>,
  };
});

vi.mock("@/server/annotatedCollections/handlers", () => ({
  handleListCollections: hoisted.handleListCollections,
  handleGetCollection: hoisted.handleGetCollection,
  handleCreateCollection: hoisted.handleCreateCollection,
  handleDeleteCollection: hoisted.handleDeleteCollection,
}));

vi.mock("@/utils/accessControls", () => ({
  validatePermissions: hoisted.validatePermissions,
}));

type EventHandler = (
  event: Record<string, unknown>,
) => Promise<Record<string, unknown>>;

const handleIncidentsList = incidentsListHandler as unknown as EventHandler;
const handleIncidentById = incidentByIdHandler as unknown as EventHandler;
const handleIncidentsCreate = incidentsCreateHandler as unknown as EventHandler;
const handleCollectionsDelete =
  collectionsDeleteHandler as unknown as EventHandler;

describe("incidents and collections endpoint auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.validatePermissions.mockResolvedValue(undefined);
    hoisted.getUserSession.mockResolvedValue({ user: { auth0: "auth0|1" } });
    hoisted.readBody.mockResolvedValue({ name: "Test incident" });
    hoisted.handleListCollections.mockResolvedValue({
      collections: [],
      total: 0,
      limit: 20,
      offset: 0,
    });
    hoisted.handleGetCollection.mockResolvedValue({
      collection: { id: "inc-1" },
      incident: {},
      entries: [],
    });
    hoisted.handleCreateCollection.mockResolvedValue({ id: "inc-1" });
    hoisted.handleDeleteCollection.mockResolvedValue({ success: true });
  });

  it("requires member permission to list incidents", async () => {
    const event = {};
    await handleIncidentsList(event);

    expect(hoisted.validatePermissions).toHaveBeenCalledWith(event, "member");
    expect(hoisted.handleListCollections).toHaveBeenCalledWith(
      event,
      "incident",
    );
  });

  it("requires member permission to fetch an incident", async () => {
    const event = {};
    await handleIncidentById(event);

    expect(hoisted.validatePermissions).toHaveBeenCalledWith(event, "member");
    expect(hoisted.handleGetCollection).toHaveBeenCalledWith(event);
  });

  it("requires member permission to create an incident", async () => {
    const event = {};
    await handleIncidentsCreate(event);

    expect(hoisted.validatePermissions).toHaveBeenCalledWith(event, "member");
    expect(hoisted.handleCreateCollection).toHaveBeenCalledWith(
      event,
      "incident",
    );
  });

  it("requires member permission to delete a collection", async () => {
    const event = {};
    await handleCollectionsDelete(event);

    expect(hoisted.validatePermissions).toHaveBeenCalledWith(event, "member");
    expect(hoisted.handleDeleteCollection).toHaveBeenCalledWith(event);
  });

  it("does not list incidents when permission checks fail", async () => {
    hoisted.validatePermissions.mockRejectedValue(
      Object.assign(new Error("Forbidden"), { statusCode: 403 }),
    );

    await expect(handleIncidentsList({})).rejects.toMatchObject({
      statusCode: 403,
    });
    expect(hoisted.handleListCollections).not.toHaveBeenCalled();
  });
});
