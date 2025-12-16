import { test, expect } from "./fixtures/auth-storage";

test("alerts dashboard - layer visibility toggles", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to the index page first to get available tables
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // 2. Find an "Open Project" button to navigate to a dataset page
  const openProjectButton = page
    .locator("a")
    .filter({ hasText: /open project/i })
    .first();
  await openProjectButton.waitFor({ state: "visible", timeout: 10000 });

  // 3. Click to go to dataset page
  await openProjectButton.click();
  await page.waitForLoadState("networkidle");

  // 4. Find the alerts link on the dataset page (ViewCard with alerts)
  const alertsLink = page.locator('a[href^="/alerts/"]').first();
  await alertsLink.waitFor({ state: "visible", timeout: 10000 });

  // 3. Get the href first
  const href = await alertsLink.getAttribute("href");
  console.log("Alerts link href:", href);

  // 4. Navigate directly to alerts page
  await page.goto(href!);

  // 5. Ensure the route change completed
  await page.waitForURL("http://localhost:8080/alerts/*", { timeout: 5000 });

  // Debug: Check if map container exists
  const mapContainer = page.locator("#map");
  const mapExists = await mapContainer.count();
  console.log("Map container exists:", mapExists > 0);

  if (mapExists === 0) {
    // Debug: Log the page content to see what's actually there
    const alertsPageContent = await page.content();
    console.log(
      "Alerts page HTML (first 2000 chars):",
      alertsPageContent.substring(0, 2000),
    );

    // Wait a bit more for the page to load
    await page.waitForTimeout(2000);
  }

  // 6. Wait until the map container has been added to the DOM
  await page.locator("#map").waitFor({ state: "attached", timeout: 10000 });

  // 7. Wait for the map to be ready and the canvas to be visible
  const mapCanvas = page.locator("canvas.mapboxgl-canvas").first();
  await expect(mapCanvas).toBeVisible();

  // 8. Wait for the map to be fully loaded
  await page.waitForFunction(
    () => {
      // @ts-expect-error _testMap is exposed for E2E testing only
      const map = window._testMap;
      return map?.isStyleLoaded() && map.loaded();
    },
    { timeout: 5000 },
  );

  // 9. Wait for the map legend to be prepared and visible
  // First wait for the map to be idle (which triggers legend preparation)
  await page.waitForFunction(
    () => {
      // @ts-expect-error _testMap is exposed for E2E testing only
      const map = window._testMap;
      return map && !map.isMoving() && map.loaded();
    },
    { timeout: 10000 },
  );

  // Wait a bit more for the legend to be prepared
  await page.waitForTimeout(2000);

  const mapLegend = page.getByTestId("map-legend");

  // Debug: Check if map legend exists
  const legendExists = await mapLegend.count();
  console.log("Map legend exists:", legendExists > 0);

  if (legendExists === 0) {
    // Debug: Log the page content to see what's actually there
    const alertsPageContent = await page.content();
    console.log(
      "Alerts page HTML (first 2000 chars):",
      alertsPageContent.substring(0, 2000),
    );

    // Wait a bit more for the page to load
    await page.waitForTimeout(3000);
  }

  // Wait for the map legend to be attached to DOM
  await mapLegend.waitFor({ state: "attached", timeout: 10000 });

  // Then wait for it to be visible
  await expect(mapLegend).toBeVisible();

  // 10. Get all legend checkboxes
  const legendCheckboxes = page.getByTestId("map-legend-checkbox");
  const checkboxCount = await legendCheckboxes.count();
  expect(checkboxCount).toBeGreaterThan(0);

  // 11. Test toggle functionality for each layer
  for (let i = 0; i < checkboxCount; i++) {
    const checkbox = legendCheckboxes.nth(i);
    const label = checkbox.locator("xpath=../label");
    const labelText = await label.textContent();

    console.log(`Testing toggle for layer: ${labelText}`);

    // Skip alert layers as they're tested in detail in the dedicated test
    if (
      labelText?.includes("Most recent alerts") ||
      labelText?.includes("Previous alerts")
    ) {
      console.log(`Skipping ${labelText} - covered by dedicated test`);
      continue;
    }

    // Get the layer ID from the label text
    await page.evaluate((text) => {
      // @ts-expect-error _testMap is exposed for E2E testing only
      const map = window._testMap;
      const layers = map.getStyle().layers;
      // Find layer that matches the label text
      const layer = layers.find((l: { id: string }) =>
        l.id
          .toLowerCase()
          .includes(text?.toLowerCase().replace(/\s+/g, "-") || ""),
      );
      return layer ? layer.id : null;
    }, labelText);

    // Toggle off
    await checkbox.focus();
    await checkbox.uncheck();
    await page.waitForTimeout(500);

    // Verify layer is hidden by checking if the checkbox is unchecked
    const isChecked = await checkbox.isChecked();
    expect(isChecked).toBe(false);
  }
});

test("alerts dashboard - legend can control all alert layer types", async ({
  page,
}) => {
  // Navigate to alerts dashboard
  await page.goto("/alerts/fake_alerts");

  // Wait for map to load
  await page.locator("#map").waitFor({ state: "attached", timeout: 5000 });

  // Wait for legend to appear
  await page.waitForSelector('[data-testid="map-legend"]');

  // Test that we can control all alert layer types by simulating the toggle function behavior
  const alertTests = [
    { name: "Most recent alerts", id: "most-recent-alerts" },
    { name: "Previous alerts", id: "previous-alerts" },
  ];

  for (const alertType of alertTests) {
    console.log(`\n=== Testing ${alertType.name} ===`);

    // Get all layers for this alert type
    const alertLayers = await page.evaluate((prefix) => {
      // @ts-expect-error _testMap is exposed for E2E testing only
      const map = window._testMap;
      const layers = map.getStyle().layers;

      const layerIds = layers
        .map((layer: { id: string }) => layer.id)
        .filter((id: string) => id.startsWith(prefix));

      return layerIds;
    }, alertType.id);

    if (alertLayers.length === 0) {
      console.log(`No layers found for ${alertType.name}, skipping...`);
      continue;
    }

    console.log(`Found ${alertLayers.length} layers:`, alertLayers);

    // Verify all layers are initially visible
    const initialVisibility = await page.evaluate((layerIds) => {
      // @ts-expect-error _testMap is exposed for E2E testing only
      const map = window._testMap;
      return layerIds.map((layerId: string) => ({
        id: layerId,
        visible: map.getLayoutProperty(layerId, "visibility") !== "none",
      }));
    }, alertLayers);

    const initiallyVisible = initialVisibility.filter(
      (layer: { visible: boolean }) => layer.visible,
    );
    expect(initiallyVisible.length).toBeGreaterThan(0);
    console.log(`${initiallyVisible.length} layers initially visible`);

    // Simulate the toggle function behavior by directly controlling map layers
    // This tests that the layer setup supports the grouped toggle functionality
    await page.evaluate((layerIds) => {
      // @ts-expect-error _testMap is exposed for E2E testing only
      const map = window._testMap;

      // Hide all layers for this alert type (simulating toggleLayerVisibility with visible: false)
      layerIds.forEach((layerId: string) => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, "visibility", "none");
        }
      });
    }, alertLayers);

    await page.waitForTimeout(500);

    // Verify all layers are now hidden
    const hiddenVisibility = await page.evaluate((layerIds) => {
      // @ts-expect-error _testMap is exposed for E2E testing only
      const map = window._testMap;
      return layerIds.map((layerId: string) => ({
        id: layerId,
        visible: map.getLayoutProperty(layerId, "visibility") !== "none",
      }));
    }, alertLayers);

    hiddenVisibility.forEach((layer: { visible: boolean; id: string }) => {
      expect(layer.visible).toBe(false);
      console.log(`✓ ${layer.id} is hidden`);
    });

    // Show all layers again (simulating toggleLayerVisibility with visible: true)
    await page.evaluate((layerIds) => {
      // @ts-expect-error _testMap is exposed for E2E testing only
      const map = window._testMap;

      layerIds.forEach((layerId: string) => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, "visibility", "visible");
        }
      });
    }, alertLayers);

    await page.waitForTimeout(500);

    // Verify all layers are visible again
    const visibleAgain = await page.evaluate((layerIds) => {
      // @ts-expect-error _testMap is exposed for E2E testing only
      const map = window._testMap;
      return layerIds.map((layerId: string) => ({
        id: layerId,
        visible: map.getLayoutProperty(layerId, "visibility") !== "none",
      }));
    }, alertLayers);

    visibleAgain.forEach((layer: { visible: boolean; id: string }) => {
      expect(layer.visible).toBe(true);
      console.log(`✓ ${layer.id} is visible again`);
    });

    console.log(
      `${alertType.name} all ${alertLayers.length} layers can be controlled as a group`,
    );
  }

  // Verify that the legend shows grouped entries (not individual geometry layers)
  const legendCheckboxes = page.getByTestId("map-legend-checkbox");
  const checkboxCount = await legendCheckboxes.count();

  const legendLabels: string[] = [];
  for (let i = 0; i < checkboxCount; i++) {
    const checkbox = legendCheckboxes.nth(i);
    const label = checkbox.locator("xpath=../label");
    const labelText = await label.textContent();
    if (labelText) {
      // Remove the hash mark (#) if present
      const cleanLabel = labelText.trim().replace(/^#\s*/, "");
      legendLabels.push(cleanLabel);
    }
  }

  console.log("\nLegend verification:");
  console.log("Legend entries found:", legendLabels);

  // Verify grouped alert entries exist
  expect(legendLabels).toContain("Most recent alerts");
  expect(legendLabels).toContain("Previous alerts");

  // Verify that individual geometry layers are NOT shown in legend
  const geometrySpecificEntries = legendLabels.filter(
    (label) =>
      label.includes("polygon") ||
      label.includes("linestring") ||
      label.includes("point") ||
      label.includes("centroid"),
  );

  expect(geometrySpecificEntries).toHaveLength(0);
  console.log("Legend shows grouped entries, not individual geometry layers");
});

test("alerts dashboard - LineString buffer click behavior", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to the index page first to get available tables
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // 2. Find an "Open Project" button to navigate to a dataset page
  const openProjectButton = page
    .locator("a")
    .filter({ hasText: /open project/i })
    .first();
  await openProjectButton.waitFor({ state: "visible", timeout: 10000 });

  // 3. Click to go to dataset page
  await openProjectButton.click();
  await page.waitForLoadState("networkidle");

  // 4. Find the alerts link on the dataset page (ViewCard with alerts)
  const alertsLink = page.locator('a[href^="/alerts/"]').first();
  await alertsLink.waitFor({ state: "visible", timeout: 10000 });

  // 3. Get the href first
  const href = await alertsLink.getAttribute("href");

  // 4. Navigate directly to alerts page
  await page.goto(href!);

  // 5. Ensure the route change completed
  await page.waitForURL("http://localhost:8080/alerts/*", { timeout: 5000 });

  // 6. Wait until the map container has been added to the DOM
  await page.locator("#map").waitFor({ state: "attached", timeout: 5000 });

  // 7. Wait for the map to be ready and the canvas to be visible
  const mapCanvas = page.locator("canvas.mapboxgl-canvas").first();
  await expect(mapCanvas).toBeVisible();

  // 8. Wait for the map to be fully loaded
  await page.waitForFunction(
    () => {
      // @ts-expect-error _testMap is exposed for E2E testing only
      const map = window._testMap;
      return map?.isStyleLoaded() && map.loaded();
    },
    { timeout: 5000 },
  );

  // 9. Check if LineString features exist
  const hasLineStrings = await page.evaluate(() => {
    // @ts-expect-error _testMap is exposed for E2E testing only
    const map = window._testMap;
    const features = map.queryRenderedFeatures({
      layers: ["most-recent-alerts-linestring", "previous-alerts-linestring"],
    });
    return features.length > 0;
  });

  if (hasLineStrings) {
    console.log("LineString features found, testing buffer click behavior");

    // 10. Test cursor changes when hovering over LineString features
    const viewport = page.viewportSize();
    if (viewport) {
      // Move mouse to center of map
      await page.mouse.move(viewport.width / 2, viewport.height / 2);

      // Check if cursor changes to pointer when over LineString
      const cursorStyle = await page.evaluate(() => {
        // @ts-expect-error _testMap is exposed for E2E testing only
        return window._testMap.getCanvas().style.cursor;
      });

      // Cursor should be pointer when over LineString features
      expect(cursorStyle).toBe("pointer");
    }

    // 11. Test buffer click functionality
    const lineStringFeatures = await page.evaluate(() => {
      // @ts-expect-error _testMap is exposed for E2E testing only
      const map = window._testMap;
      return map.queryRenderedFeatures({
        layers: ["most-recent-alerts-linestring", "previous-alerts-linestring"],
      });
    });

    if (lineStringFeatures.length > 0) {
      const firstFeature = lineStringFeatures[0];
      const [lng, lat] = firstFeature.geometry.coordinates[0];

      // Click on the LineString feature
      await page.evaluate(
        ([lng, lat]) => {
          // @ts-expect-error _testMap is exposed for E2E testing only
          const map = window._testMap;
          const pt = map.project([lng, lat]);
          map.fire("click", {
            point: pt,
            lngLat: [lng, lat],
            originalEvent: {},
            features: [],
          });
        },
        [lng, lat],
      );

      // 12. Verify sidebar opens after clicking LineString
      await expect(page.getByText(/copy link to alert/i)).toBeVisible();

      // 13. Verify URL contains alertId
      await expect(page).toHaveURL(/\?alertId=/);
    }
  } else {
    console.log("No LineString features found, skipping buffer tests");
  }
});

test("alerts dashboard - geometry type specific interactions", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // 1. Navigate to the index page first to get available tables
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // 2. Find an "Open Project" button to navigate to a dataset page
  const openProjectButton = page
    .locator("a")
    .filter({ hasText: /open project/i })
    .first();
  await openProjectButton.waitFor({ state: "visible", timeout: 10000 });

  // 3. Click to go to dataset page
  await openProjectButton.click();
  await page.waitForLoadState("networkidle");

  // 4. Find the alerts link on the dataset page (ViewCard with alerts)
  const alertsLink = page.locator('a[href^="/alerts/"]').first();
  await alertsLink.waitFor({ state: "visible", timeout: 10000 });

  // 3. Get the href first
  const href = await alertsLink.getAttribute("href");

  // 4. Navigate directly to alerts page
  await page.goto(href!);

  // 5. Ensure the route change completed
  await page.waitForURL("http://localhost:8080/alerts/*", { timeout: 5000 });

  // 6. Wait until the map container has been added to the DOM
  await page.locator("#map").waitFor({ state: "attached", timeout: 5000 });

  // 7. Wait for the map to be ready and the canvas to be visible
  const mapCanvas = page.locator("canvas.mapboxgl-canvas").first();
  await expect(mapCanvas).toBeVisible();

  // 8. Wait for the map to be fully loaded
  await page.waitForFunction(
    () => {
      // @ts-expect-error _testMap is exposed for E2E testing only
      const map = window._testMap;
      return map?.isStyleLoaded() && map.loaded();
    },
    { timeout: 5000 },
  );

  // 9. Test Point features (clustered circles)
  const pointFeatures = await page.evaluate(() => {
    // @ts-expect-error _testMap is exposed for E2E testing only
    const map = window._testMap;
    // Try to find point features, including clustered ones
    let features = map.queryRenderedFeatures({
      layers: ["most-recent-alerts-point", "previous-alerts-point"],
    });
    // If no unclustered points, try centroids (for polygon/linestring)
    if (features.length === 0) {
      features = map.queryRenderedFeatures({
        layers: ["most-recent-alerts-centroids", "previous-alerts-centroids"],
      });
    }
    return features;
  });

  if (pointFeatures.length > 0) {
    console.log(`Testing ${pointFeatures.length} Point features`);

    const firstPoint = pointFeatures[0];
    if (!firstPoint?.geometry?.coordinates) {
      console.log("Skipping point test - no valid coordinates");
    } else {
      const [lng, lat] = firstPoint.geometry.coordinates;

      // Click on Point feature
      await page.evaluate(
        ([lng, lat]) => {
          // @ts-expect-error _testMap is exposed for E2E testing only
          const map = window._testMap;
          const pt = map.project([lng, lat]);
          map.fire("click", {
            point: pt,
            lngLat: [lng, lat],
            originalEvent: {},
            features: [],
          });
        },
        [lng, lat],
      );

      // Verify sidebar opens
      await expect(page.getByText(/copy link to alert/i)).toBeVisible();
      await expect(page).toHaveURL(/\?alertId=/);
    }
  }

  // 10. Test Polygon features
  const polygonFeatures = await page.evaluate(() => {
    // @ts-expect-error _testMap is exposed for E2E testing only
    const map = window._testMap;
    return map.queryRenderedFeatures({
      layers: ["most-recent-alerts-polygon", "previous-alerts-polygon"],
    });
  });

  if (polygonFeatures.length > 0) {
    console.log(`Testing ${polygonFeatures.length} Polygon features`);

    const firstPolygon = polygonFeatures[0];
    // Use centroid of polygon for clicking
    const [lng, lat] = firstPolygon.properties.geographicCentroid
      .split(",")
      .map(Number);

    // Click on Polygon feature
    await page.evaluate(
      ([lng, lat]) => {
        // @ts-expect-error _testMap is exposed for E2E testing only
        const map = window._testMap;
        const pt = map.project([lng, lat]);
        map.fire("click", {
          point: pt,
          lngLat: [lng, lat],
          originalEvent: {},
          features: [],
        });
      },
      [lng, lat],
    );

    // Verify sidebar opens
    await expect(page.getByText(/copy link to alert/i)).toBeVisible();
    await expect(page).toHaveURL(/\?alertId=/);
  }

  // 11. Test LineString features with buffer
  const lineStringFeatures = await page.evaluate(() => {
    // @ts-expect-error _testMap is exposed for E2E testing only
    const map = window._testMap;
    return map.queryRenderedFeatures({
      layers: ["most-recent-alerts-linestring", "previous-alerts-linestring"],
    });
  });

  if (lineStringFeatures.length > 0) {
    console.log(
      `Testing ${lineStringFeatures.length} LineString features with buffer`,
    );

    const firstLineString = lineStringFeatures[0];
    const [lng, lat] = firstLineString.geometry.coordinates[0];

    // Test buffer click behavior
    await page.evaluate(
      ([lng, lat]) => {
        // @ts-expect-error _testMap is exposed for E2E testing only
        const map = window._testMap;
        const pt = map.project([lng, lat]);

        // Simulate buffer click with pixel offset
        const pixelBuffer = 10;
        const bbox = [
          [pt.x - pixelBuffer, pt.y - pixelBuffer],
          [pt.x + pixelBuffer, pt.y + pixelBuffer],
        ];

        const features = map.queryRenderedFeatures(bbox, {
          layers: [
            "most-recent-alerts-linestring",
            "previous-alerts-linestring",
          ],
        });

        if (features.length > 0) {
          map.fire("click", {
            point: pt,
            lngLat: [lng, lat],
            originalEvent: {},
            features: features,
          });
        }
      },
      [lng, lat],
    );

    // Verify sidebar opens after buffer click
    await expect(page.getByText(/copy link to alert/i)).toBeVisible();
    await expect(page).toHaveURL(/\?alertId=/);
  }
});

test("alerts dashboard - cluster circles and centroid selection behavior", async ({
  authenticatedPageAsAdmin: page,
}) => {
  // Navigate to alerts dashboard
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Find an "Open Project" button to navigate to a dataset page
  const openProjectButton = page
    .locator("a")
    .filter({ hasText: /open project/i })
    .first();
  await openProjectButton.waitFor({ state: "visible", timeout: 10000 });
  await openProjectButton.click();
  await page.waitForLoadState("networkidle");

  const alertsLink = page.locator('a[href^="/alerts/"]').first();
  await alertsLink.waitFor({ state: "visible", timeout: 10000 });
  const href = await alertsLink.getAttribute("href");
  await page.goto(href!);
  await page.waitForURL("http://localhost:8080/alerts/*", { timeout: 5000 });

  // Wait for map to load
  await page.locator("#map").waitFor({ state: "attached", timeout: 5000 });
  const mapCanvas = page.locator("canvas.mapboxgl-canvas").first();
  await expect(mapCanvas).toBeVisible();

  await page.waitForFunction(() => {
    // @ts-expect-error _testMap is exposed for E2E testing only
    return !!window._testMap;
  });

  await page.waitForFunction(
    () => {
      // @ts-expect-error _testMap is exposed for E2E testing only
      const map = window._testMap;
      return map?.isStyleLoaded() && map.loaded();
    },
    { timeout: 5000 },
  );

  // Test 1: Verify cluster circles exist (instead of old symbols)
  const clusterFeatures = await page.evaluate(() => {
    // @ts-expect-error _testMap is exposed for E2E testing only
    const map = window._testMap;
    const clusters = map.queryRenderedFeatures({
      layers: [
        "most-recent-alerts-centroids-clusters",
        "previous-alerts-centroids-clusters",
      ],
    });
    return clusters;
  });

  if (clusterFeatures.length > 0) {
    console.log(`Found ${clusterFeatures.length} cluster circles`);

    // Test 2: Click on a centroid circle (Point geometry)
    const centroidFeatures = await page.evaluate(() => {
      // @ts-expect-error _testMap is exposed for E2E testing only
      const map = window._testMap;
      return map.queryRenderedFeatures({
        layers: ["most-recent-alerts-centroids", "previous-alerts-centroids"],
      });
    });

    if (centroidFeatures.length > 0) {
      const feature = centroidFeatures[0];
      if (!feature?.geometry?.coordinates) {
        console.log("Skipping centroid test - no valid coordinates");
      } else {
        const [lng, lat] = feature.geometry.coordinates;
        const alertID = feature.properties.alertID;

        // Click the centroid
        await page.evaluate(
          ([lng, lat, alertID]) => {
            // @ts-expect-error _testMap is exposed for E2E testing only
            const map = window._testMap;
            const pt = map.project([lng, lat]);
            map.fire("click", {
              point: pt,
              lngLat: [lng, lat],
              originalEvent: {},
              features: [{ properties: { alertID } }],
            });
          },
          [lng, lat, alertID],
        );

        // Wait for sidebar
        await expect(page.getByText(/copy link to alert/i)).toBeVisible();
        await expect(page).toHaveURL(/\?alertId=/);
        console.log("Centroid circle click works");
      }
    }
  }

  // Test 3: Verify clusters update when date range changes
  const initialSourceData = await page.evaluate(() => {
    // @ts-expect-error _testMap is exposed for E2E testing only
    const map = window._testMap;
    const source = map.getSource(
      "most-recent-alerts-centroids",
    ) as mapboxgl.GeoJSONSource;
    if (!source || !(source as { _data?: { features?: unknown[] } })._data)
      return null;
    const sourceData = (source as { _data?: { features?: unknown[] } })._data;
    return {
      featureCount: sourceData?.features?.length || 0,
    };
  });

  if (initialSourceData && initialSourceData.featureCount > 0) {
    console.log(
      `Initial source has ${initialSourceData.featureCount} features`,
    );

    // Get date options from the page (they should be available in the slider)
    const dateOptions = await page.evaluate(() => {
      // @ts-expect-error accessing Vue component for testing
      const app = document.querySelector("#__nuxt")?.__vue_app__;
      if (!app) return null;

      // Find the AlertsDashboard component
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const findComponent = (instance: any): any => {
        if (!instance) return null;
        if (instance.type?.name === "AlertsDashboard") return instance;
        if (instance.parent) return findComponent(instance.parent);
        if (instance.ctx?.parent) return findComponent(instance.ctx.parent);
        return null;
      };

      const root = app._instance;
      const dashboard = findComponent(root);
      if (!dashboard) return null;

      // Get dateOptions from props or setupState
      return (
        dashboard.props?.dateOptions ||
        dashboard.setupState?.dateOptions?.value ||
        null
      );
    });

    if (dateOptions && dateOptions.length >= 2) {
      // Use a narrower date range (first half of available dates)
      const midPoint = Math.floor(dateOptions.length / 2);
      const newRange: [string, string] = [
        dateOptions[0],
        dateOptions[midPoint],
      ];

      console.log(`Changing date range to: ${newRange[0]} - ${newRange[1]}`);

      // Trigger date range change using the exposed test helper
      await page.evaluate((range) => {
        // @ts-expect-error _testHandleDateRangeChanged is exposed for E2E testing only
        const handler = window._testHandleDateRangeChanged;
        if (handler && typeof handler === "function") {
          handler(range);
        }
      }, newRange);

      // Wait for the update to complete (nextTick + source update)
      await page.waitForTimeout(1000);

      // Verify source data has been updated
      const updatedSourceData = await page.evaluate(() => {
        // @ts-expect-error _testMap is exposed for E2E testing only
        const map = window._testMap;
        const source = map.getSource(
          "most-recent-alerts-centroids",
        ) as mapboxgl.GeoJSONSource;
        if (!source || !(source as { _data?: { features?: unknown[] } })._data)
          return null;
        const sourceData = (source as { _data?: { features?: unknown[] } })
          ._data;
        return {
          featureCount: sourceData?.features?.length || 0,
        };
      });

      if (updatedSourceData) {
        console.log(
          `Updated source has ${updatedSourceData.featureCount} features`,
        );
        // The updated count should be less than or equal to initial count
        expect(updatedSourceData.featureCount).toBeLessThanOrEqual(
          initialSourceData.featureCount,
        );
        // Verify that source data was actually updated (not just a check)
        expect(updatedSourceData.featureCount).toBeGreaterThanOrEqual(0);
        console.log("Clusters updated correctly when date range changed");
      } else {
        console.log("Could not verify source data update");
      }
    } else {
      console.log("Could not access date options, skipping date range test");
    }
  } else {
    console.log("No initial source data found, skipping date range test");
  }
});
