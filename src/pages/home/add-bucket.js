import { mapState } from "vuex";
const initForm = {
  plat: "aws3",
  accessKeyId: "",
  secretAccessKey: "",
  region: "",
  endpoint: "",
  bucket: "",
};

export default {
  computed: {
    ...mapState({
      bucketList: (s) => s.bucketList,
      asMobile: (s) => s.asMobile,
    }),
    configParse() {
      try {
        return JSON.parse(this.jsonVal);
      } catch (error) {
        return null;
      }
    },
    configForm() {
      if (this.asJson) {
        return {
          ...this.form,
          ...this.configParse,
        };
      }
      return this.form;
    },
  },
  data() {
    return {
      showAdd: false,
      form: {
        ...initForm,
      },
      checkBuckets: [],
      apiBuckets: [],
      apiChecking: false,
      apiChecked: false,
      posting: false,
      asJson: true,
      jsonVal: "",
    };
  },
  watch: {
    configParse(val) {
      if (!val) {
        this.$alert("Invalid JSON format: " + this.jsonVal);
        this.initJsonVal();
      } else {
        this.form = {
          ...this.form,
          ...val,
        };
      }
    },
    "form.plat"() {
      this.resetBuckets();
      this.initJsonVal();
    },
    "form.accessKeyId"() {
      this.resetBuckets();
    },
  },
  mounted() {
    this.initJsonVal();
  },
  methods: {
    resetBuckets() {
      this.apiChecked = false;
      this.checkBuckets = [];
      this.apiBuckets = [];
    },
    initJsonVal() {
      const form = { ...this.form };
      if (form.plat == "aws3") {
        delete form.bucket;
      } else {
        delete form.endpoint;
      }
      delete form.plat;
      this.jsonVal = JSON.stringify(form, "", "  ");
    },
    async onSubmit() {
      const form = {
        ...this.configForm,
      };
      // console.log(form);
      try {
        this.posting = true;
        await this.checkApi();
        if (!this.apiChecked) throw new Error("Test failed");
        const added = [],
          oldArr = [];
        const buckets = [...this.bucketList];
        for (const bucket of this.checkBuckets) {
          const old = buckets.filter(
            (it) => it.plat == form.plat && it.bucket == bucket
          )[0];
          if (old) {
            oldArr.push(bucket);
            continue;
          }
          added.push(bucket);
          buckets.push({
            ...form,
            prefix: form.plat.replace("aws3", "s3"),
            bucket,
            createAt: Date.now(),
          });
          this.$setStore({
            bucketList: buckets,
          });
        }
        if (added.length) {
          this.showAdd = false;
          this.form = {
            ...initForm,
          };
          this.initJsonVal();
          this.checkBuckets = [];
        } else if (oldArr.length) {
          this.$message("Already exist：" + oldArr.join(", "));
        }
      } catch (error) {
        console.log(error);
      }
      this.posting = false;
    },
    async checkApi() {
      let msg = "";
      try {
        const form = { ...this.configForm };
        if (!form.accessKeyId) msg = "API Key required";
        else if (!form.secretAccessKey) msg = "API Secret required";
        else if (!form.region) msg = "Region required";
        if (msg) throw new Error(msg);
        if (!this.posting) this.apiChecking = true;

        if (form.plat == "aws3") {
          const qs3 = new window.QS3(form);
          const data = await qs3.listBuckets({});
          this.apiBuckets = data.map((it) => {
            return it.Name;
          });
          if (
            !this.posting ||
            this.apiBuckets.filter((name) => this.checkBuckets.includes(name))
              .length == 0
          ) {
            this.checkBuckets = [...this.apiBuckets];
          }
          if (this.checkBuckets.length) {
            this.apiChecked = true;
          } else {
            throw new Error("No Bucket found");
          }
        } else {
          if (!form.bucket) throw new Error("Bucket required");
          // if (!this.posting) this.stsChecking = true;
          const buckets = form.bucket.split(/,|，/);
          const apiBuckets = [];
          const failBuckets = [];
          for (let bkname of buckets) {
            bkname = bkname.trim();
            if (!bkname) continue;
            console.log(bkname);
            try {
              const qs3 = new window.QS3({
                ...form,
                bucket: bkname,
              });
              await qs3.getList({});
              apiBuckets.push(bkname);
            } catch (error) {
              msg = error.message;
              failBuckets.push(bkname);
            }
          }
          this.apiBuckets = apiBuckets;
          if (!apiBuckets.length) {
            throw new Error(msg);
          } else {
            this.apiChecked = true;
            this.checkBuckets = [...apiBuckets];
            if (failBuckets.length && !this.posting)
              this.$alert("Invalid Bucket Name：" + failBuckets.join(", "));
          }
        }
      } catch (error) {
        this.apiChecked = false;
        if (error) {
          let msg = error.message || "error";
          if (msg.length > 30) this.$alert(msg);
          else this.$message.warning(msg);
        }
      }
      this.apiChecking = false;
    },
  },
};
