<style lang="scss">
.e-file-info {
  max-width: 600px;
  .media {
    min-width: 300px;
    min-height: 150px;
    img,
    video {
      display: block;
      max-height: 390px;
      max-width: 100%;
    }
    img {
      min-height: 80px;
      background: url(../../assets/bg-trans.svg);
      background-size: 20px;
    }
    .el-image:hover {
      box-shadow: 0 0 5px #9995;
    }
  }
  label {
    min-width: 80px;
  }
}
</style>

<template>
  <div class="e-file-info" v-if="file">
    <div class="pa-4">
      <div class="al-c f-center media" v-loading="loading">
        <div v-if="!src"></div>
        <iframe
          v-else-if="isFrame"
          :src="
            `https://preview.4everland.org/${isTxt ? 'code' : ''}?type=${
              info.suffix
            }&src=` + encodeURIComponent(src)
          "
          frameborder="0"
          class="w100p"
          style="height: 400px"
          @load="loading = false"
        ></iframe>
        <el-image
          class="trans-200"
          @load="onImgLoad"
          :src="src"
          :preview-src-list="[src]"
          v-else-if="isImg"
          fit="contain"
        />
        <video
          ref="video"
          v-else-if="isVideo"
          :src="src"
          controls
          webkit-playsinline
          playsinline
          preload="metadata"
        />
        <audio ref="audio" v-else-if="isAudio" :src="src" controls />
        <div class="fz-14 gray pt-5 pb-5" v-else>{{ info.name }}</div>
      </div>
      <div class="mt-5">
        <p class="al-c">
          <span class="fz-18">{{ info.name }}</span>
        </p>
        <div v-if="info.etag" class="mt-2">
          <el-link
            :href="src"
            type="primary"
            target="_blank"
            icon="el-icon-bottom"
            >Download</el-link
          >
          <el-dropdown @command="onCommand">
            <span
              ><el-link
                class="ml-6"
                type="text"
                :icon="actLoading ? 'el-icon-loading' : 'el-icon-more'"
              >
              </el-link
            ></span>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item
                v-clipboard="resData"
                @success="$message.success('Copied')"
                v-if="isTxt && resData"
                command="copy"
                icon="el-icon-copy-document"
                >Copy</el-dropdown-item
              >
              <el-dropdown-item command="rename" icon="el-icon-edit"
                >Rename</el-dropdown-item
              >
              <el-dropdown-item
                command="delete"
                icon="el-icon-delete"
                class="red-1"
                >Delete</el-dropdown-item
              >
            </el-dropdown-menu>
          </el-dropdown>
        </div>
      </div>
      <div class="mt-6">
        <h3 class="fz-14 op-8">Info</h3>
        <div class="fz-13 mt-3">
          <div
            class="d-flex"
            :class="it.cls || 'mt-3'"
            v-for="(it, i) in infoList"
            :key="i"
          >
            <label class="gray">{{ it.label }}：</label>
            <span class="wb-all">{{ it.value }}</span>
            <i
              v-clipboard="it.value"
              @success="$message.success('Copied')"
              class="el-icon-document-copy color-1 pa-1 hover-1"
              v-if="it.paste"
            ></i>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import { calcGCD } from "../../utils/helper";
import mixin from "./file-info";

export default {
  mixins: [mixin],
  props: {
    file: null,
  },
  data() {
    return {
      src: null,
      loadMeta: {},
      resType: null,
      resData: null,
      loading: false,
      actLoading: false,
    };
  },
  computed: {
    ...mapState({
      qs3: (s) => s.qs3,
    }),
    info() {
      if (!this.file) return {};
      let { name, url, size, type, lastModified, etag } = this.file;
      const key = name;
      let arr = name.split("/");
      if (arr.length > 1) {
        name = arr[arr.length - 1];
      }
      if (this.src) {
        type = this.resType || "";
      }
      let suffix = "";
      arr = name.split(".");
      if (arr.length > 1) {
        suffix = arr[arr.length - 1];
      }
      return {
        key,
        name,
        size,
        type,
        lastModified,
        suffix,
        etag,
        url: url || this.src,
        ...this.loadMeta,
      };
    },
    infoList() {
      const info = this.info;
      const list = [
        {
          label: "File Size",
          value: this.$utils.getFileSize(info.size),
        },
        {
          label: "File Type",
          value: !/\//.test(info.type) ? info.suffix : info.type,
        },
      ];
      if (info.width) {
        list.push({
          label: "Dimension",
          value: `${info.width} × ${info.height} px`,
        });
        const gcd = calcGCD(info.width, info.height);
        list.push({
          label: "Ratio",
          value: `${info.width / gcd}:${info.height / gcd}`,
        });
      }
      if (info.duration) {
        list.push({
          label: "Duration",
          value: info.duration.toFixed(1) + "s",
        });
      }
      if (info.etag) {
        list.push({
          label: "Last Modified",
          value: info.lastModified.toDate().TZ0toLocal().format(),
          cls: "mt-5",
        });

        list.push({
          label: "ETag",
          value: info.etag,
        });
      }
      if (info.url)
        list.push({
          label: "URL",
          value: info.url.replace(/\?.+/, ""),
          paste: true,
        });
      return list;
    },
    isOctet() {
      const { type } = this.info;
      return type == "application/octet-stream" || !/\//.test(type);
    },
    isFrame() {
      if (this.isTxt) return true;
      const { suffix } = this.info;
      return ["docx", "pdf", "xlsx"].includes(suffix);
    },
    isImg() {
      const { type, suffix } = this.info;
      return (
        /image/.test(type) ||
        (this.isOctet && /ico|png|jpg|jpeg|gif|svg|webp/i.test(suffix))
      );
    },
    isAudio() {
      const { type, suffix } = this.info;
      return /audio/.test(type) || (this.isOctet && /mp3|wav/i.test(suffix));
    },
    isVideo() {
      const { type, suffix } = this.info;
      return (
        /video/.test(type) ||
        (this.isOctet && /mp4|avi|rmvb|flv|mov/i.test(suffix))
      );
    },
    isTxt() {
      return this.resType && /text|json|javascript|subrip/i.test(this.resType);
    },
  },
};
</script>