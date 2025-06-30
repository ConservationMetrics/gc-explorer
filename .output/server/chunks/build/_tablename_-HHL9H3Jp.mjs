import { i as useRoute, u as useRuntimeConfig, f as useI18n, g as __nuxt_component_0$1 } from './server.mjs';
import { defineComponent, ref, withAsyncContext, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent } from 'vue/server-renderer';
import { r as replaceUnderscoreWithSpace } from './index-DAZvuhut.mjs';
import { u as useFetch } from './fetch-C_Jallq0.mjs';
import { u as useHead } from './v3-Bz-xr_Io.mjs';
import 'node:http';
import 'node:https';
import 'node:zlib';
import 'node:stream';
import 'node:buffer';
import 'node:util';
import 'node:url';
import 'node:net';
import 'node:fs';
import 'node:path';
import '../nitro/nitro.mjs';
import 'node:crypto';
import 'node:events';
import 'pg';
import 'ipx';
import 'vue-router';
import 'perfect-debounce';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'unhead/plugins';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[tablename]",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const route = useRoute();
    const tableRaw = route.params.tablename;
    const table = Array.isArray(tableRaw) ? tableRaw.join("/") : tableRaw;
    const allowedFileExtensions = ref();
    const dataFetched = ref(false);
    const filterColumn = ref();
    const galleryData = ref();
    const mediaBasePath = ref();
    const {
      public: { appApiKey }
    } = useRuntimeConfig();
    const headers = {
      "x-api-key": appApiKey
    };
    const { data, error } = ([__temp, __restore] = withAsyncContext(() => useFetch(`/api/${table}/gallery`, {
      headers
    }, "$3OpiiufVrw")), __temp = await __temp, __restore(), __temp);
    if (data.value && !error.value) {
      allowedFileExtensions.value = data.value.allowedFileExtensions;
      dataFetched.value = true;
      filterColumn.value = data.value.filterColumn;
      galleryData.value = data.value.data;
      mediaBasePath.value = data.value.mediaBasePath;
    } else {
      console.error("Error fetching data:", error.value);
    }
    const { t } = useI18n();
    useHead({
      title: "GuardianConnector Explorer " + t("gallery") + " - " + replaceUnderscoreWithSpace(table)
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ClientOnly = __nuxt_component_0$1;
      _push(`<div${ssrRenderAttrs(_attrs)}>`);
      _push(ssrRenderComponent(_component_ClientOnly, null, {}, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/gallery/[tablename].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_tablename_-HHL9H3Jp.mjs.map
