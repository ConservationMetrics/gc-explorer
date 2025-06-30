import { _ as _sfc_main$1 } from './LanguagePicker-DpNzWwT6.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-zEzgWqVg.mjs';
import { defineComponent, ref, withAsyncContext, computed, mergeProps, unref, withCtx, createTextVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderAttr, ssrInterpolate, ssrRenderList } from 'vue/server-renderer';
import { p as publicAssetsURL } from '../nitro/nitro.mjs';
import { u as useRuntimeConfig } from './server.mjs';
import { u as useFetch } from './fetch-C_Jallq0.mjs';
import { u as useHead } from './v3-Bz-xr_Io.mjs';
import 'node:http';
import 'node:https';
import 'node:crypto';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'pg';
import 'node:url';
import 'ipx';
import 'node:zlib';
import 'node:stream';
import 'node:util';
import 'node:net';
import 'vue-router';
import 'perfect-debounce';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'unhead/plugins';

const _imports_0 = publicAssetsURL("/gcexplorer.png");
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const viewsConfig = ref({});
    const {
      public: { appApiKey }
    } = useRuntimeConfig();
    const headers = {
      "x-api-key": appApiKey
    };
    const { data, error } = ([__temp, __restore] = withAsyncContext(() => useFetch("/api/config", {
      headers
    }, "$77hSeXQoip")), __temp = await __temp, __restore(), __temp);
    if (data.value && !error.value) {
      const fetchedViewsData = data.value[0];
      viewsConfig.value = fetchedViewsData;
    } else {
      console.error("Error fetching data:", error.value);
    }
    const filteredSortedViewsConfig = computed(() => {
      return Object.keys(viewsConfig.value).filter((key) => Object.keys(viewsConfig.value[key]).length > 0).sort().reduce((accumulator, key) => {
        accumulator[key] = viewsConfig.value[key];
        return accumulator;
      }, {});
    });
    useHead({
      title: "GuardianConnector Explorer"
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_LanguagePicker = _sfc_main$1;
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "container flex flex-col items-center mt-8 relative" }, _attrs))}><div class="absolute top-0 right-0 flex justify-end space-x-4 mb-4">`);
      _push(ssrRenderComponent(_component_LanguagePicker, null, null, _parent));
      _push(`</div><img${ssrRenderAttr("src", _imports_0)} alt="Guardian Connector Explorer Logo" class="w-48 h-auto mb-4 mx-auto" loading="eager"><h1 class="text-4xl font-black text-gray-800 mb-4">${ssrInterpolate(_ctx.$t("availableViews"))}</h1>`);
      if (unref(viewsConfig)) {
        _push(`<div class="w-1/2"><!--[-->`);
        ssrRenderList(unref(filteredSortedViewsConfig), (config, tableName) => {
          _push(`<div class="table-item bg-gray-100 rounded p-4 mb-4"><h2 class="text-gray-800 mb-2"><strong>${ssrInterpolate(_ctx.$t("table"))}:</strong> ${ssrInterpolate(tableName)}</h2><ul class="list-none p-0"><!--[-->`);
          ssrRenderList(config.VIEWS ? config.VIEWS.split(",") : [], (view) => {
            _push(`<li class="mb-2">`);
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: `/${view}/${tableName}`,
              class: "text-blue-500 no-underline hover:text-blue-700 hover:underline"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`${ssrInterpolate(_ctx.$t(view))}`);
                } else {
                  return [
                    createTextVNode(toDisplayString(_ctx.$t(view)), 1)
                  ];
                }
              }),
              _: 2
            }, _parent));
            _push(`</li>`);
          });
          _push(`<!--]--></ul></div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-BFlOUFED.mjs.map
