import { computed, ref, mergeProps, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderList } from 'vue/server-renderer';
import { f as useI18n } from './server.mjs';

const _sfc_main = {
  __name: "LanguagePicker",
  __ssrInlineRender: true,
  setup(__props) {
    const { locale, locales, setLocale } = useI18n();
    const availableLocales = computed(() => locales.value);
    const currentLocaleName = computed(() => {
      const currentLocale = locales.value.find(
        (lang) => lang.code === locale.value
      );
      return currentLocale ? currentLocale.name : "";
    });
    const dropdownOpen = ref(false);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "relative inline-block text-left" }, _attrs))}><div><button class="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">${ssrInterpolate(currentLocaleName.value)} <svg class="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg></button></div>`);
      if (dropdownOpen.value) {
        _push(`<div class="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"><div class="py-1"><!--[-->`);
        ssrRenderList(availableLocales.value, (locale2) => {
          _push(`<a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">${ssrInterpolate(locale2.name)}</a>`);
        });
        _push(`<!--]--></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/gc-shared-resources@1.1.8_magicast@0.3.5/node_modules/gc-shared-resources/dist/runtime/components/LanguagePicker.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as _ };
//# sourceMappingURL=LanguagePicker-DpNzWwT6.mjs.map
