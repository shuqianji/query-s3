<style lang="scss">
</style>

<template>
  <div>
    <el-tree
      ref="tree"
      node-key="name"
      :default-expanded-keys="['']"
      :props="props"
      :showCheckbox="showCheckbox"
      lazy
      :load="onLoad"
      @node-click="onNode"
      @check="onCheck"
    >
      <!-- node,  -->
      <div class="flex-1 pr-2 tree-node-item" slot-scope="{ node, data }">
        <list-node
          :data="{
            ...data,
            curName,
            curMarker,
            curRefresh,
          }"
          :expanded="node.expanded"
          :node="node"
          @refresh="onRefresh"
        />
      </div>
    </el-tree>
  </div>
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
      props: {
        label: "name",
        children: "subs",
        isLeaf: "leaf",
      },
    };
  },
  methods: {
    onCheck() {
      // const { checkedNodes, halfCheckedNodes } = obj;
      const p = this.$refs.tree;
      const checkedNodes = p.getCheckedNodes();
      const halfCheckedNodes = p.getHalfCheckedNodes();
      let dirArr = checkedNodes
        .filter((it) => {
          return (
            it.isDir &&
            !halfCheckedNodes.filter((hf) => hf.name == it.name).length
          );
        })
        .map((it) => it.name);
      this.onCheckedEmit(dirArr, checkedNodes);
    },
    async onNode(data, node) {
      const { parent } = node;
      if (data.marker) {
        // console.log(node);
        if (this.curMarker == data.marker) return;
        try {
          this.curMarker = data.marker;
          const list = await this.getFiles(parent.data.name, data.marker);
          const subs = parent.childNodes.map((it) => it.data);
          subs.pop();
          parent.setData({
            ...parent.data,
            subs: [...subs, ...list],
          });
          parent.setChecked(false);
          this.onCheck();
        } catch (error) {
          console.log(error);
        }
        this.curMarker = null;
      } else if (data.leaf) {
        this.curParent = parent;
        this.onFile(data);
      } else {
        this.curParent = node;
      }
    },
  },
};
</script>