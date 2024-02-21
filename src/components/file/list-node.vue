<style lang="scss">
</style>

<template>
  <div class="al-c">
    <span class="node-plat scale-9" v-if="data.prefix">
      {{ data.prefix }}
    </span>
    <i
      :class="expanded ? 'el-icon-folder-opened' : 'el-icon-folder'"
      v-else-if="!data.leaf"
    ></i>
    <i
      class="mr-2 color-1"
      :class="
        data.curMarker == data.marker
          ? 'el-icon-loading'
          : 'el-icon-refresh-right'
      "
      v-if="data.marker"
    ></i>
    <span
      class="ml-2 fz-14 fs-node-label"
      :class="{
        'color-1': data.marker || data.name == data.curName,
      }"
      >{{ data.label.cutStr(15, 8) }}</span
    >
    <i
      @click.stop="$emit('refresh', node)"
      class="ml-auto color-1 node-refresh"
      :class="
        data.curRefresh == data.name
          ? 'el-icon-loading d-b'
          : 'el-icon-refresh-right ' + (expanded ? 'd-n' : 'hide')
      "
      v-if="!data.leaf && node.loaded"
    ></i>
  </div>
</template>

<script>
export default {
  props: {
    data: Object,
    node: Object,
    expanded: Boolean,
  },
};
</script>