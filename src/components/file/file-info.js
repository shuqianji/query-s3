export default {
  watch: {
    file: {
      handler() {
        this.onFile();
      },
      immediate: true,
    },
    async src() {
      setTimeout(() => {
        this.$emit("render");
      }, 20);
      if (this.isVideo || this.isAudio)
        this.$nextTick(() => {
          this.onMeta();
        });
    },
  },
  methods: {
    onCommand(val) {
      if (val == "rename") this.onRename();
      else if (val == "delete") this.onDelete();
    },
    async onRename() {
      const { name, key } = this.info;
      try {
        const { value } = await this.$prompt("New name", "Rename", {
          inputValue: name,
          inputValidator(val) {
            if (!val) return "not null";
            if (/\//.test(val)) return "not allowed /";
            if (val.length > 1017) return "max length 1017";
          },
        });
        if (value == name) return;
        this.actLoading = true;
        const newKey = key.replace(new RegExp(name + "$"), value);
        await this.qs3.copy({
          Key: newKey,
          srcKey: key,
        });
        await this.qs3.delete(key);
        this.$emit("refresh", newKey);
      } catch (error) {
        this.onError(error);
      }
      this.actLoading = false;
    },
    onError(error) {
      let msg = error.message;
      if (msg) this.$alert(msg);
    },
    async onDelete() {
      try {
        await this.$confirm("Are you sure to delete this file？");
        this.actLoading = true;
        await this.qs3.delete(this.info.key);
        this.$emit("refresh");
        this.$message.success("Deleted successfully");
      } catch (error) {
        this.onError(error);
      }
      this.actLoading = false;
    },
    onImgLoad(e) {
      this.loading = false;
      const { width, height } = e.target || e.path[0];
      this.loadMeta = {
        width,
        height,
      };
    },
    onMeta() {
      const ref = this.isVideo ? "video" : "audio";
      const el = this.$refs[ref];
      if (!el) return;
      el.onloadedmetadata = (e) => {
        const { duration, videoWidth: width, videoHeight: height } = e.target;
        this.loadMeta = {
          duration,
          width,
          height,
        };
      };
    },
    async onFile() {
      this.src = null;
      this.loadMeta = {};
      this.resType = null;
      this.resData = null;
      if (!this.file) return;
      if (this.file.size > 100 * Math.pow(1024, 2)) {
        return;
      }
      const { src, etag, name } = this.file;
      // console.log(this.file);
      if (src) {
        this.src = src;
      } else if (etag) {
        const url = await this.qs3.signatureUrl({
          name,
          opt: {
            expires: 3600,
          },
        });
        this.src = url.replace(/^http:/, "https:");
      }
      this.loading = true;
      if (!this.src) {
        const reader = new FileReader();
        reader.readAsDataURL(this.file);
        reader.onload = (e) => {
          // console.log(e);
          this.loading = false;
          this.src = e.target.result;
        };
        return;
      }
      try {
        const res = await this.qs3.headObject(name);
        this.resType = res.headers["content-type"];
        console.log(this.resType);
        if (!(this.isFrame || this.isImg)) {
          this.loading = false;
        }
      } catch (error) {
        this.$message(error.message);
      }
    },
  },
};
