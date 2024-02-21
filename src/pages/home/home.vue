<style lang="scss">
.add-bucket-form {
  .el-form-item__label {
    padding-right: 18px;
  }
}
</style>

<template>
  <div>
    <div class="pa-2 bdb-1 pos-r main-wrap">
      <div class="al-c">
        <add-bucket />
        <div class="ml-auto">
          <a href="https://github.com/shuqianji/query-s3" target="_blank">
            <img src="img/github.svg" width="20" class="d-b pa-1" />
          </a>
        </div>
      </div>
      <div class="pos-center">
        <h2 class="fz-18">
          <span>Query S3</span>
        </h2>
      </div>
    </div>

    <div class="pa-4 m-auto main-wrap">
      <el-table
        empty-text="No data available"
        size="small"
        :data="bucketList"
        @row-click="onRow"
      >
        <el-table-column
          v-for="(it, i) in fields"
          :key="i"
          :prop="it.field"
          :label="it.label"
          :width="it.width"
        >
          <template slot-scope="scope">
            <div class="al-c" v-if="it.field == 'bucket'">
              <span class="node-plat d-ib shrink-0">{{
                scope.row.prefix
              }}</span>
              <span class="ml-2 fz-4">{{ scope.row.bucket.cutStr(8, 6) }}</span>
            </div>

            <div v-else-if="it.field == 'act'">
              <el-button
                type="text"
                size="mini"
                @click.stop="onDel(scope.$index)"
                >Remove</el-button
              >
            </div>
            <div v-else-if="it.field == 'plat'">
              <div class="d-flex lh-12">
                <el-tooltip
                  :content="
                    `${scope.row.import ? 'Imported' : 'Added'} at ` +
                    new Date(scope.row.createAt).toNiceTime(nowDate)
                  "
                  v-if="scope.row.createAt"
                  placement="right"
                >
                  <div>
                    <span class="gray-a">
                      {{ scope.row.accessKeyId.cutStr(5, 5) }}
                    </span>
                  </div>
                </el-tooltip>

                <i
                  v-clipboard="scope.row.accessKeyId"
                  @success="$message.success('Copied')"
                  class="el-icon-document-copy pa-1 pt-0 ml-1 hover-1"
                  @click.stop
                ></i>
              </div>
            </div>
            <div v-else>
              {{ scope.row[it.field] }}
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import AddBucket from "./add-bucket.vue";

export default {
  components: {
    AddBucket,
  },
  computed: {
    ...mapState({
      nowDate: (s) => s.nowDate,
      bucketList: (s) => s.bucketList,
    }),
  },
  data() {
    return {
      fields: [
        {
          field: "bucket",
          label: "Bucket",
        },
        {
          field: "plat",
          label: "API Key",
        },
        {
          field: "act",
          label: "Action",
          width: "60px",
        },
      ],
    };
  },
  watch: {
    bucketList(val) {
      this.$setStore({
        bucketList: val,
      });
    },
  },
  mounted() {},
  methods: {
    async onDel(i) {
      const it = this.bucketList[i];
      try {
        await this.$confirm(`Are you sure to remove ${it.bucket} ?`);
        this.bucketList.splice(i, 1);
      } catch (error) {
        //
      }
    },
    onRow(it) {
      // console.log(it);
      this.$router.replace(`/list/${it.prefix}/${it.accessKeyId}/${it.bucket}`);
    },
  },
};
</script>