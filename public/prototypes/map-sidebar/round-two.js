const months = ["2026-07", "2026-08", "2026-09", "2026-10"];
const fixtures = Array.from({ length: 31 }, (_, index) => ({
  id: String(index + 1).padStart(3, "0"),
  x: 420 + ((index * 113) % 690),
  y: 130 + ((index * 79) % 570),
  size: 15 + ((index * 7) % 28),
  recent: index % 3 !== 0,
  date: index % 3 !== 0 ? "2026-10" : "2026-08",
}));

const proposal = createApp({
  components: { Icon, CurrentPanel, CurrentSlider },
  setup() {
    const params = new URLSearchParams(location.search);
    const isMobile = ref(innerWidth < 640);
    const expanded = ref(params.get("panel") !== "collapsed");
    const drawerHeight = ref(Math.round(innerHeight * 0.5));
    const drawerMaximum = ref(innerHeight - 76);
    const range = ref([
      months.includes(params.get("from")) ? params.get("from") : months[0],
      months.includes(params.get("to")) ? params.get("to") : months[3],
    ]);
    if (range.value[0] > range.value[1]) range.value = [months[0], months[3]];
    const selected = ref(
      fixtures.find((point) => point.id === params.get("feature")) || null,
    );
    const filtersOpen = ref(false);
    const legendOpen = ref(false);
    const recentVisible = ref(true);
    const previousVisible = ref(true);
    const zoom = ref(10);
    const pan = ref({ x: 0, y: 0 });
    const notice = ref("");
    const content = ref(null);
    let mapDrag;
    let drawerDrag = false;

    const rangeActive = computed(
      () => range.value[0] !== months[0] || range.value[1] !== months[3],
    );
    const visiblePoints = computed(() =>
      fixtures.filter(
        (point) =>
          point.date >= range.value[0] &&
          point.date <= range.value[1] &&
          (point.recent ? recentVisible.value : previousVisible.value),
      ),
    );
    const dateLabel = computed(() => {
      const format = (month) =>
        new Date(month + "-01T00:00:00Z").toLocaleDateString("en", {
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        });
      return `${format(range.value[0])} – ${format(range.value[1])}`;
    });
    const statistics = computed(() => ({
      territory: "Test Territory 130",
      alertsTotal: visiblePoints.value.length,
      typeOfAlerts: ["Forest disturbance"],
      dataProviders: ["Synthetic data"],
      alertDetectionRange: dateLabel.value,
      recentAlertsDate: "2026-10-15",
      recentAlertsNumber: visiblePoints.value.filter((point) => point.recent)
        .length,
      alertsPerMonth: Object.fromEntries(
        months.map((month) => [
          month,
          visiblePoints.value.filter((point) => point.date === month).length,
        ]),
      ),
      hectaresPerMonth: null,
    }));
    const tiles = Array.from({ length: 48 }, (_, index) => ({
      x: 524 + (index % 8),
      y: 345 + Math.floor(index / 8),
      left: (index % 8) * 256,
      top: Math.floor(index / 8) * 256,
    }));
    const mapTransform = computed(
      () =>
        `translate(calc(-50% + ${pan.value.x}px),calc(-50% + ${pan.value.y}px)) scale(${Math.pow(1.25, zoom.value - 10)})`,
    );
    const setParam = (key, value) => {
      const url = new URL(location);
      if (value === null) url.searchParams.delete(key);
      else url.searchParams.set(key, value);
      history.replaceState(null, "", url);
    };
    watch(range, (value) => {
      setParam("from", value[0] === months[0] ? null : value[0]);
      setParam("to", value[1] === months[3] ? null : value[1]);
    });
    const clearFilters = () => {
      range.value = [months[0], months[3]];
    };
    const select = (point) => {
      selected.value = point;
      filtersOpen.value = false;
      expanded.value = true;
      setParam("feature", point.id);
      nextTick(() => {
        if (content.value) content.value.scrollTop = 0;
      });
    };
    const closeFeature = () => {
      selected.value = null;
      filtersOpen.value = false;
      setParam("feature", null);
      nextTick(() => {
        if (content.value) content.value.scrollTop = 0;
      });
    };
    const togglePanel = () => {
      expanded.value = !expanded.value;
      nextTick(() =>
        document
          .getElementById(expanded.value ? "collapse-panel" : "expand-panel")
          ?.focus(),
      );
    };
    const openFilters = () => {
      expanded.value = true;
      filtersOpen.value = Boolean(selected.value) && !filtersOpen.value;
      nextTick(() => {
        const filterSection = content.value?.querySelector(".date-slider");
        filterSection?.scrollIntoView({ block: "center" });
      });
    };
    const resetMap = () => {
      zoom.value = 10;
      pan.value = { x: 0, y: 0 };
    };
    const beginMap = (event) => {
      if (event.target.closest("button")) return;
      mapDrag = { x: event.clientX, y: event.clientY, pan: { ...pan.value } };
      event.currentTarget.setPointerCapture(event.pointerId);
    };
    const moveMap = (event) => {
      if (mapDrag)
        pan.value = {
          x: mapDrag.pan.x + event.clientX - mapDrag.x,
          y: mapDrag.pan.y + event.clientY - mapDrag.y,
        };
    };
    const stopMap = () => {
      mapDrag = null;
    };
    const beginDrawer = (event) => {
      drawerDrag = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    };
    const moveDrawer = (event) => {
      if (!drawerDrag) return;
      const height = innerHeight - event.clientY;
      expanded.value = height > 160;
      drawerHeight.value = Math.min(innerHeight - 76, Math.max(180, height));
    };
    const stopDrawer = () => {
      drawerDrag = false;
    };
    const drawerKey = (event) => {
      if (!["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      if (event.key === "End") expanded.value = false;
      else {
        expanded.value = true;
        drawerHeight.value =
          event.key === "Home"
            ? innerHeight - 76
            : Math.min(
                innerHeight - 76,
                Math.max(
                  180,
                  drawerHeight.value + (event.key === "ArrowUp" ? 40 : -40),
                ),
              );
      }
    };
    const resize = () => {
      isMobile.value = innerWidth < 640;
      drawerMaximum.value = innerHeight - 76;
      drawerHeight.value = Math.min(
        innerHeight - 76,
        Math.max(180, drawerHeight.value),
      );
    };
    const saveFile = (filename, data, type) => {
      const url = URL.createObjectURL(new Blob([data], { type }));
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    };
    const download = () =>
      saveFile(
        "synthetic-alerts.geojson",
        JSON.stringify({
          type: "FeatureCollection",
          features: visiblePoints.value.map((point) => ({
            type: "Feature",
            properties: { id: point.id, date: point.date },
            geometry: {
              type: "Point",
              coordinates: [
                5 + (point.x - 420) / 10000,
                50 + (point.y - 130) / 10000,
              ],
            },
          })),
        }),
        "application/geo+json",
      );
    const downloadSummary = () =>
      saveFile(
        "synthetic-monthly-summary.csv",
        "month,alerts\n" +
          Object.entries(statistics.value.alertsPerMonth)
            .map(([month, count]) => month + "," + count)
            .join("\n"),
        "text/csv",
      );
    const copyLocation = async () => {
      await navigator.clipboard.writeText(location.href);
      notice.value = "Link copied";
    };
    const escape = (event) => {
      if (event.key === "Escape") {
        legendOpen.value = false;
        filtersOpen.value = false;
      }
    };
    onMounted(() => {
      window.addEventListener("resize", resize);
      document.addEventListener("keydown", escape);
    });
    onBeforeUnmount(() => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("keydown", escape);
    });
    return {
      months,
      isMobile,
      expanded,
      drawerHeight,
      drawerMaximum,
      range,
      selected,
      filtersOpen,
      legendOpen,
      recentVisible,
      previousVisible,
      zoom,
      pan,
      notice,
      content,
      rangeActive,
      visiblePoints,
      dateLabel,
      statistics,
      tiles,
      mapTransform,
      clearFilters,
      select,
      closeFeature,
      togglePanel,
      openFilters,
      resetMap,
      beginMap,
      moveMap,
      stopMap,
      beginDrawer,
      moveDrawer,
      stopDrawer,
      drawerKey,
      download,
      downloadSummary,
      copyLocation,
    };
  },
  template: `
  <section class="absolute inset-0" aria-label="Revised sidebar proposal" :style="{'--drawer-height':drawerHeight+'px'}">
    <div class="map-scene" aria-label="Synthetic alert map. Drag to pan; use map controls to zoom." @pointerdown="beginMap" @pointermove="moveMap" @pointerup="stopMap" @pointercancel="stopMap">
      <div class="absolute left-1/2 top-1/2 w-[2048px] h-[1536px] origin-center" :style="{transform:mapTransform}">
        <img v-for="tile in tiles" :key="tile.left+'-'+tile.top" :src="'tiles/'+tile.x+'-'+tile.y+'.png'" width="256" height="256" alt="" draggable="false" class="absolute pointer-events-none select-none" :style="{left:tile.left+'px',top:tile.top+'px'}">
        <div class="absolute" style="left:324px;top:314px;width:1400px;height:850px">
          <button v-for="point in visiblePoints" :key="point.id" class="alert-marker" :class="{previous:!point.recent,selected:selected?.id===point.id}" :aria-label="'View synthetic alert '+point.id" :style="{left:point.x+'px',top:point.y+'px',width:point.size+'px',height:point.size+'px'}" @click="select(point)"></button>
        </div>
      </div>
    </div>

    <aside v-if="!isMobile && !expanded" class="compact-rail" aria-label="Collapsed sidebar">
      <button id="expand-panel" class="icon-button" aria-label="Expand sidebar" aria-controls="map-panel" :aria-expanded="false" @click="togglePanel"><Icon name="PanelLeftOpen"/></button>
      <button class="icon-button" :class="{'active-filter':rangeActive}" :aria-label="rangeActive?'Date filters active. Open date filters':'Open date filters'" @click="openFilters"><Icon name="CalendarDays"/><span v-if="rangeActive" class="filter-dot" aria-hidden="true"></span></button>
      <div class="mt-auto text-center"><div class="text-lg font-semibold tabular-nums">{{visiblePoints.length}}</div><div class="text-[11px] text-gray-500">alerts</div></div>
    </aside>

    <aside v-if="expanded || isMobile" id="map-panel" class="panel" :class="{peek:!expanded}" aria-label="Map panel">
      <button class="mobile-grip" aria-label="Resize sidebar" role="separator" aria-orientation="horizontal" :aria-valuenow="expanded?drawerHeight:120" :aria-valuemin="120" :aria-valuemax="drawerMaximum" @pointerdown="beginDrawer" @pointermove="moveDrawer" @pointerup="stopDrawer" @pointercancel="stopDrawer" @keydown="drawerKey"></button>
      <header class="panel-header">
        <div v-if="isMobile && !expanded" class="min-w-0"><div class="text-base font-semibold">{{selected?'Alert '+selected.id:'Change Detection Alerts'}}</div><div class="text-sm text-gray-500 mt-0.5">Test Territory 130</div></div>
        <div v-else class="flex items-center gap-2 text-sm font-semibold"><Icon :name="selected?'MapPin':'PanelLeft'" :size="18"/><span>{{selected?'Alert details':'Overview'}}</span></div>
        <div class="flex items-center gap-1">
          <button class="icon-button" :class="{'active-filter':rangeActive}" :aria-label="rangeActive?'Date filters active. Open date filters':'Open date filters'" @click="openFilters"><Icon name="CalendarDays" :size="19"/><span v-if="rangeActive" class="filter-dot" aria-hidden="true"></span></button>
          <button :id="expanded?'collapse-panel':'expand-panel'" class="icon-button" :aria-label="expanded?'Collapse sidebar':'Expand sidebar'" :aria-expanded="expanded" aria-controls="panel-content" @click="togglePanel"><Icon :name="isMobile?(expanded?'ChevronDown':'ChevronUp'):'PanelLeftClose'"/></button>
        </div>
      </header>
      <div v-if="expanded" id="panel-content" ref="content" class="panel-content">
        <section v-if="selected && filtersOpen" class="card mb-4"><CurrentSlider :date-options="months" :initial-range="range" @date-range-changed="range=$event" @clear-filters="clearFilters"/></section>
        <CurrentPanel v-if="!selected" :alerts-statistics="statistics" :initial-range="range" @date-range-changed="range=$event" @clear-filters="clearFilters" @download="download" @download-summary="downloadSummary"/>
        <section v-else class="card">
          <div class="flex items-start justify-between gap-3"><div><div class="text-sm font-medium text-violet-700 mb-2">{{selected.recent?'Recent alert':'Previous alert'}}</div><h2>Alert {{selected.id}}</h2></div><button class="icon-button !rounded-full !bg-white/80" aria-label="Close selected alert" @click="closeFeature"><Icon name="X" :size="19"/></button></div>
          <dl class="mt-6 text-sm space-y-5"><div><dt class="font-semibold mb-1">Territory</dt><dd>Test Territory 130</dd></div><div><dt class="font-semibold mb-1">Detection date</dt><dd>{{selected.recent?'15 October 2026':'15 August 2026'}}</dd></div><div><dt class="font-semibold mb-1">Type of alerts</dt><dd>Forest disturbance</dd></div><div><dt class="font-semibold mb-1">Alert area</dt><dd>0.42 hectares</dd></div><div><dt class="font-semibold mb-1">Data provider</dt><dd>Synthetic data</dd></div></dl>
        </section>
      </div>
    </aside>

    <button class="absolute right-[66px] top-3.5 icon-button !bg-violet-100 !text-violet-800 shadow-sm" aria-label="Copy map location" @click="copyLocation"><Icon name="Copy" :size="19"/></button>
    <div class="absolute top-3 right-3 flex flex-col items-end gap-3">
      <div class="surface p-0.5"><button class="icon-button" aria-label="Zoom in" :disabled="zoom===14" @click="zoom=Math.min(14,zoom+1)"><Icon name="Plus"/></button><div class="border-t border-gray-100 mx-2"></div><button class="icon-button" aria-label="Zoom out" :disabled="zoom===8" @click="zoom=Math.max(8,zoom-1)"><Icon name="Minus"/></button></div>
      <button class="control reset-control" aria-label="Reset map view" title="Reset map view" @click="resetMap"><Icon name="LocateFixed" :size="19"/><span class="reset-label">Reset map view</span></button>
    </div>
    <div class="legend-control absolute right-3" :style="{bottom:isMobile?(expanded?drawerHeight+12:132)+'px':'30px',zIndex:10}">
      <button v-if="!legendOpen" class="icon-button !bg-violet-100 !text-violet-800 shadow-sm" aria-label="Map legend" @click="legendOpen=true"><Icon name="Layers"/></button>
      <section v-else class="surface w-64 p-4"><div class="flex items-center justify-between"><h2 class="font-semibold">Map legend</h2><button class="icon-button" aria-label="Close legend" @click="legendOpen=false"><Icon name="X" :size="18"/></button></div><label class="flex gap-3 items-center py-3 text-sm"><input type="checkbox" v-model="recentVisible"><span class="w-3 h-3 bg-red-500 rounded-full"></span>Most recent alerts</label><label class="flex gap-3 items-center py-3 text-sm"><input type="checkbox" v-model="previousVisible"><span class="w-3 h-3 bg-orange-400 rounded-full"></span>Previous alerts</label></section>
    </div>
    <output class="mock-state absolute bottom-1 px-2 py-1 bg-white/90 rounded text-xs text-gray-600 tabular-nums" :style="{left:isMobile?'8px':(expanded?'412px':'76px'),bottom:isMobile?(expanded?drawerHeight+8:128)+'px':'4px'}">Zoom {{zoom}} · Offset {{Math.round(pan.x)}}, {{Math.round(pan.y)}} · {{visiblePoints.length}} alerts</output>
    <div class="absolute bottom-0 right-0 bg-white/85 px-2 py-1 text-[10px] text-gray-600"><a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a></div>
    <div v-if="notice" role="status" class="absolute top-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white rounded-lg px-4 py-3 text-sm" style="z-index:30">{{notice}}<button class="ml-4 min-w-11 min-h-11" aria-label="Dismiss message" @click="notice=''">×</button></div>
  </section>`,
});
proposal.config.globalProperties.$t = (key) => translations[key] || key;
proposal.config.globalProperties.$n = (value) =>
  new Intl.NumberFormat("en").format(value);
proposal.mount("#app");
