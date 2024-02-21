<template>
  <el-cascader-panel
    ref="panel"
    class="h100p"
    :props="config"
    :border="false"
    @expand-change="onExpand"
    @change="onCheck"
  >
    <!-- node,  -->
    <div
      class="tree-node-item pr-2"
      slot-scope="{ node, data }"
      @click="onNode(data, node)"
    >
      <list-node
        :data="{ ...data, curName, curMarker, curRefresh }"
        :node="node"
        :expanded="curExpand.includes(data.name)"
        @refresh="onRefresh"
      />
    </div>
  </el-cascader-panel>
</template>

<script>
import mixin from "./mixin";

export default {
  mixins: [mixin],
  props: {
    showCheckbox: Boolean,
  },
  data() {
    return {
      isCascader: true,
      curExpand: [],
    };
  },
  computed: {
    config() {
      return {
        multiple: this.showCheckbox,
        label: "label",
        value: "name",
        children: "subs",
        isLeaf: "leaf",
        lazy: true,
        lazyLoad: this.onLoad,
      };
    },
  },
  watch: {},
  methods: {
    onCheck() {
      const checkedNodes = this.$refs.panel
        .getCheckedNodes()
        .map((it) => it.data);
      const dirArr = checkedNodes.filter((it) => it.isDir).map((it) => it.name);
      this.onCheckedEmit(dirArr, checkedNodes);
    },
    onExpand(e) {
      this.curExpand = e;
      this.onFile(null);
    },
    appendNodes(list, node) {
      const panel = this.$refs.panel;
      // console.log(panel.store);
      panel.store.appendNodes(list, node);
      panel.handleExpand(node);
      this.$nextTick(() => {
        panel.clearCheckedNodes();
      });
    },
    async onNode(data, node) {
      const { parent } = node;
      if (data.marker) {
        if (this.curMarker == data.marker) return;
        try {
          this.curMarker = data.marker;
          const list = await this.getFiles(parent.data.name, data.marker);
          parent.children.pop();
          this.appendNodes(list, parent);
        } catch (error) {
          console.log(error);
        }
        this.curMarker = null;
      } else if (data.leaf) {
        // console.log(node);
        this.curParent = parent;
        this.$refs.panel.handleExpand(node);
        setTimeout(() => {
          this.onFile(data);
        }, 10);
      } else {
        this.curParent = node;
      }
    },
  },
};
</script>