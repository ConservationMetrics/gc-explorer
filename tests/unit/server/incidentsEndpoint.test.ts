import { beforeEach, describe, expect, it, vi } from "vitest";

import incidentsListHandler from "@/server/api/incidents/index.get";
import incidentByIdHandler from "@/server/api/incidents/[id].get";
import incidentsCreateHandler from "@/server/api/incidents/index.post";
import collectionsListHandler from "@/server/api/collections/index.get";
import collectionsCreateHandler from "@/server/api/collections/index.post";
import collectionByIdHandler from "@/server/api/collections/[id].get";
import collectionsUpdateHandler from "@/server/api/collections/[id].put";
import collectionsDeleteHandler from "@/server/api/collections/[id].delete";
import collectionsEntriesHandler from "@/server/api/collections/[id]/entries.post";

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
    handleUpdateCollection: vi.fn(),
    handleDeleteCollection: vi.fn(),
    handleAddEntriesToCollection: vi.fn(),
    validatePermissions: vi.fn(),
    getUserSession: globalThis.getUserSession as ReturnType<typeof vi.fn>,
    readBody: globalThis.readBody as ReturnType<typeof vi.fn>,
  };
});

vi.mock("@/server/annotatedCollections/handlers", () => ({
  handleListCollections: hoisted.handleListCollections,
  handleGetCollection: hoisted.handleGetCollection,
  handleCreateCollection: hoisted.handleCreateCollection,
  handleUpdateCollection: hoisted.handleUpdateCollection,
  handleDeleteCollection: hoisted.handleDeleteCollection,
  handleAddEntriesToCollection: hoisted.handleAddEntriesToCollection,
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
const handleCollectionsList = collectionsListHandler as unknown as EventHandler;
const handleCollectionsCreate =
  collectionsCreateHandler as unknown as EventHandler;
const handleCollectionById = collectionByIdHandler as unknown as EventHandler;
const handleCollectionsUpdate =
  collectionsUpdateHandler as unknown as EventHandler;
const handleCollectionsDelete =
  collectionsDeleteHandler as unknown as EventHandler;
const handleCollectionsEntries =
  collectionsEntriesHandler as unknown as EventHandler;

const memberGuardedEndpoints: Array<
  [string, EventHandler, () => ReturnType<typeof vi.fn>]
> = [
  ["list incidents", handleIncidentsList, () => hoisted.handleListCollections],
  ["fetch an incident", handleIncidentById, () => hoisted.handleGetCollection],
  [
    "create an incident",
    handleIncidentsCreate,
    () => hoisted.handleCreateCollection,
  ],
  [
    "list collections",
    handleCollectionsList,
    () => hoisted.handleListCollections,
  ],
  [
    "create a collection",
    handleCollectionsCreate,
    () => hoisted.handleCreateCollection,
  ],
  [
    "fetch a collection",
    handleCollectionById,
    () => hoisted.handleGetCollection,
  ],
  [
    "update a collection",
    handleCollectionsUpdate,
    () => hoisted.handleUpdateCollection,
  ],
  [
    "delete a collection",
    handleCollectionsDelete,
    () => hoisted.handleDeleteCollection,
  ],
  [
    "add collection entries",
    handleCollectionsEntries,
    () => hoisted.handleAddEntriesToCollection,
  ],
];

describe("incidents and collections endpoint auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.validatePermissions.mockResolvedValue(undefined);
    hoisted.getUserSession.mockResolvedValue({
      user: { auth0: "auth0|1", email: "member@example.com" },
    });
    hoisted.readBody.mockResolvedValue({ name: "Test incident" });
    hoisted.handleListCollections.mockResolvedValue({
      collections: [],
      total: 0,
      limit: 20,
      offset: 0,
    });
    hoisted.handleGetCollection.mockResolvedValue({
      collection: { id: "inc-1", created_at: "2024-01-01" },
      incident: {},
      entries: [],
    });
    hoisted.handleCreateCollection.mockResolvedValue({ id: "inc-1" });
    hoisted.handleUpdateCollection.mockResolvedValue({ id: "inc-1" });
    hoisted.handleDeleteCollection.mockResolvedValue({ success: true });
    hoisted.handleAddEntriesToCollection.mockResolvedValue({ entries: [] });
  });

  it.each(memberGuardedEndpoints)(
    "requires member permission to %s",
    async (_label, handler, getDataHandler) => {
      const event = {};
      await handler(event);

      expect(hoisted.validatePermissions).toHaveBeenCalledWith(event, "member");
      expect(getDataHandler()).toHaveBeenCalled();
    },
  );

  it.each(memberGuardedEndpoints)(
    "does not %s when permission checks fail",
    async (_label, handler, getDataHandler) => {
      hoisted.validatePermissions.mockRejectedValue(
        Object.assign(new Error("Forbidden"), { statusCode: 403 }),
      );

      await expect(handler({})).rejects.toMatchObject({ statusCode: 403 });
      expect(getDataHandler()).not.toHaveBeenCalled();
    },
  );

  it("lists incidents filtered by incident collection type", async () => {
    const event = {};
    await handleIncidentsList(event);

    expect(hoisted.handleListCollections).toHaveBeenCalledWith(
      event,
      "incident",
    );
  });

  it("creates incidents as incident collections", async () => {
    const event = {};
    await handleIncidentsCreate(event);

    expect(hoisted.handleCreateCollection).toHaveBeenCalledWith(
      event,
      "incident",
    );
  });
});
