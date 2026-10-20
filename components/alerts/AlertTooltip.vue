<script setup lang="ts">
import Tooltip from "@/components/shared/Tooltip.vue";
import { alertFieldTooltipKey } from "@/utils/alertFieldTooltips";

const props = defineProps<{
  alertType?: string;
  dataProvider?: string;
  fieldKey: string;
  fieldValue?: string;
}>();

const { t } = useI18n();

const tooltipContent = computed(() => {
  const key = alertFieldTooltipKey(props.fieldKey, {
    alertType: props.alertType,
    dataProvider: props.dataProvider,
    value: props.fieldValue,
  });
  return key ? t(key) : "";
});
</script>

<template>
  <Tooltip :content="tooltipContent" test-id="alert-field-tooltip" />
</template>
