<template>
  <div>
    <el-dialog
      title="Add Bucket"
      :visible.sync="showAdd"
      append-to-body
      :width="asMobile ? '90%' : '600px'"
    >
      <div class="pa-1 add-bucket-form">
        <el-form :model="form" ref="form" size="small" label-width="100px">
          <el-form-item label="Platform">
            <el-radio v-model="form.plat" label="aws3">S3</el-radio>
            <el-radio v-model="form.plat" label="oss">OSS</el-radio>
            <el-radio v-model="form.plat" label="cos">COS</el-radio>
          </el-form-item>
          <!-- v-if="form.plat == 'aws3'" -->
          <template>
            <el-form-item label="API Key">
              <el-input v-model="form.accessKeyId" clearable></el-input>
            </el-form-item>
            <el-form-item label="API Secrect">
              <el-input v-model="form.secretAccessKey" clearable></el-input>
            </el-form-item>
            <el-form-item label="Region">
              <el-input v-model="form.region" clearable></el-input>
            </el-form-item>
            <el-form-item label="Endpoint" v-if="form.plat == 'aws3'">
              <el-input v-model="form.endpoint" clearable></el-input>
            </el-form-item>
            <el-form-item label="Bucket" v-else>
              <el-input v-model="form.bucket" clearable></el-input>
            </el-form-item>
          </template>

          <el-form-item label="Bucket" v-show="apiBuckets.length">
            <el-checkbox-group v-model="checkBuckets">
              <el-checkbox
                :label="name"
                v-for="name in apiBuckets"
                :key="name"
              ></el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-form-item class="mt-7">
            <el-button
              size="small"
              :loading="apiChecking"
              @click="checkApi()"
              :disabled="posting"
              >{{ apiChecked ? "Checked" : "Check" }}</el-button
            >
            <el-button
              size="small"
              type="primary"
              :disabled="!apiChecked || !checkBuckets.length"
              :loading="posting"
              @click="onSubmit"
              >Confirm</el-button
            >
          </el-form-item>
        </el-form>
        <div class="mt-8"></div>
      </div>
    </el-dialog>

    <el-button
      icon="el-icon-plus"
      type="primary"
      size="mini"
      @click="showAdd = true"
    >
      <span v-if="!asMobile">Bucket</span>
    </el-button>
  </div>
</template>

<script>
import mixin from "./add-bucket.js";

export default {
  mixins: [mixin],
  computed: {
    regionArr() {
      const { plat } = this.form;
      if (plat == "aws3") {
        return [
          "af-south-1",
          "ap-east-1",
          "ap-northeast-1",
          "ap-northeast-2",
          "ap-northeast-3",
          "ap-south-1",
          "ap-south-2",
          "ap-southeast-1",
          "ap-southeast-2",
          "ap-southeast-3",
          "ca-central-1",
          "cn-north-1",
          "cn-northwest-1",
          "EU",
          "eu-central-1",
          "eu-north-1",
          "eu-south-1",
          "eu-south-2",
          "eu-west-1",
          "eu-west-2",
          "eu-west-3",
          "me-south-1",
          "sa-east-1",
          "us-east-2",
          "us-gov-east-1",
          "us-gov-west-1",
          "us-west-1",
          "us-west-2",
        ];
      }
      return [];
    },
  },
};
</script>