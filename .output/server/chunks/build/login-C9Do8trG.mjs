import { _ as _sfc_main$2 } from './LanguagePicker-DpNzWwT6.mjs';
import { defineComponent, ref, unref, mergeProps, useSSRContext } from 'vue';
import { ssrRenderComponent, ssrRenderAttrs, ssrInterpolate } from 'vue/server-renderer';
import { e as useUserSession, f as useI18n } from './server.mjs';
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
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'unhead/plugins';

const _sfc_main$1 = {
  __name: "Auth0Login",
  __ssrInlineRender: true,
  props: {
    errorMessage: { type: String, required: true }
  },
  setup(__props) {
    const props = __props;
    return (_ctx, _push, _parent, _attrs) => {
      const _component_LanguagePicker = _sfc_main$2;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "container relative" }, _attrs))}><div class="absolute top-0 right-0 flex justify-end space-x-4 mt-4 mr-4 mb-4">`);
      _push(ssrRenderComponent(_component_LanguagePicker, null, null, _parent));
      _push(`</div><div class="flex flex-col items-center justify-center h-screen"><p class="italic">${ssrInterpolate(_ctx.$t("authMessage"))}.</p><button class="px-4 py-2 mt-4 mb-4 bg-blue-500 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50">${ssrInterpolate(_ctx.$t("loginButton"))}</button>`);
      if (props.errorMessage) {
        _push(`<p class="text-red-500 text-xs italic">${ssrInterpolate(_ctx.$t("yourAccessIsPending"))}</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/gc-shared-resources@1.1.8_magicast@0.3.5/node_modules/gc-shared-resources/dist/runtime/components/Auth0Login.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "login",
  __ssrInlineRender: true,
  setup(__props) {
    const { loggedIn } = useUserSession();
    const errorMessage = ref("");
    const { t } = useI18n();
    useHead({
      title: "GuardianConnector Explorer: " + t("login")
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Auth0Login = _sfc_main$1;
      if (unref(loggedIn) === false) {
        _push(ssrRenderComponent(_component_Auth0Login, mergeProps({ "error-message": unref(errorMessage) }, _attrs), null, _parent));
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/login.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=login-C9Do8trG.mjs.map
