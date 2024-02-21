import { S3, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Upload } from "@aws-sdk/lib-storage";
import OSS from "ali-oss";
import COS from "cos-js-sdk-v5";
import { Axios } from "axios";

export class QS3 {
  constructor(opts) {
    this.config = opts;
    this.bucket = opts.bucket;
    this.client = this.getClient(opts);
  }
  getClient(opts) {
    const { plat } = opts;
    const { bucket, endpoint, region, accessKeyId, secretAccessKey } = opts;
    if (plat == "aws3") {
      return new S3({
        endpoint,
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        signatureVersion: "v2",
        s3ForcePathStyle: true,
      });
    }
    if (plat == "oss") {
      // const data = await getStsData(opts);
      return new OSS({
        accessKeyId,
        accessKeySecret: secretAccessKey,
        bucket,
        region,
      });
    }
    if (plat == "cos") {
      const {
        stsApi,
        accessKeyId: SecretId,
        secretAccessKey: SecretKey,
      } = opts;
      let option = {
        SecretId,
        SecretKey,
        Region: region,
        Bucket: bucket,
      };
      if (stsApi)
        option = {
          getAuthorization(_, cb) {
            getStsData(opts).then((data) => {
              cb(data);
            });
          },
        };
      return new COS(option);
    }
  }
  async listBuckets() {
    return this.client.listBuckets({}).then((res) => {
      return res.Buckets;
    });
  }
  async getList(params) {
    const { plat, bucket, region } = this.config;
    const Prefix = params.prefix || "";
    if (plat == "aws3") {
      return this.client
        .listObjectsV2({
          Bucket: bucket,
          Delimiter: params.delimiter,
          MaxKeys: params["max-keys"],
          Prefix,
          ContinuationToken: params.marker,
        })
        .then((data) => {
          // console.log(data);
          return getS3ListData(data, this.config);
        });
    }
    if (plat == "cos") {
      return new Promise((resolve, reject) => {
        this.client.getBucket(
          {
            Bucket: bucket,
            Region: region,
            Prefix,
            Delimiter: "/",
            MaxKeys: params["max-keys"],
            Marker: params.marker,
          },
          (err, data) => {
            if (err) return reject(err);
            resolve(getS3ListData(data, this.config));
          }
        );
      });
    }
    return this.client.list(params);
  }
  async multipartUpload(params) {
    const { client } = this;
    const { plat, bucket, region } = this.config;
    const { name, file, opt } = params;
    if (plat == "aws3") {
      const params = {
        Bucket: bucket,
        Key: name,
        Body: file,
        ContentType: file.type,
      };
      const task = new Upload({
        client,
        // queueSize: 3,
        params,
      });
      task.on("httpUploadProgress", (e) => {
        const p = e.loaded / e.total;
        opt.progress(p);
      });
      await task.done();
      return;
    }
    if (plat == "cos") {
      return new Promise((resolve, reject) => {
        client.uploadFile(
          {
            Bucket: bucket,
            Region: region,
            Key: name,
            Body: file,
            // SliceSize: 1024 * 1024 * 3,
            onProgress(e) {
              opt.progress(e.percent);
            },
          },
          (err, data) => {
            if (err) reject(err);
            else resolve(data);
          }
        );
      });
    }
    return client.multipartUpload(name, file, opt);
  }
  delete(Key) {
    const { client } = this;
    const { plat, bucket, region } = this.config;
    if (plat == "aws3") {
      const params = {
        Bucket: bucket,
        Delete: {
          Objects: [{ Key }],
        },
      };
      return client.deleteObjects(params);
    }
    if (plat == "cos") {
      return new Promise((resolve, reject) => {
        client.deleteObject(
          {
            Bucket: bucket,
            Region: region,
            Key,
          },
          (err, data) => {
            if (err) reject(err);
            else resolve(data);
          }
        );
      });
    }
    return client.delete(Key);
  }
  copy(params) {
    const { client } = this;
    const { plat, bucket, region } = this.config;
    const { Key, srcKey } = params;
    if (plat == "aws3") {
      return client.copyObject({
        Bucket: bucket,
        CopySource: encodeURIComponent(bucket + "/" + srcKey),
        Key,
      });
    }
    if (plat == "cos") {
      return new Promise((resolve, reject) => {
        client.putObjectCopy(
          {
            Bucket: bucket,
            Region: region,
            Key,
            CopySource: `${bucket}.cos.${region}.myqcloud.com/${srcKey}`,
          },
          (err, data) => {
            if (err) reject(err);
            else resolve(data);
          }
        );
      });
    }
    return client.copy(Key, srcKey);
  }
  putObject(params) {
    const { client } = this;
    const { plat, bucket, region } = this.config;
    const { Key, Body } = params;
    if (plat == "cos") {
      return new Promise((resolve, reject) => {
        client.putObject(
          {
            Bucket: bucket,
            Region: region,
            Key, // dir/ Body='' => newFolder
            Body,
          },
          (err, data) => {
            if (err) reject(err);
            else resolve(data);
          }
        );
      });
    }
  }
  signatureUrl(params) {
    const { client } = this;
    const { plat, bucket, region } = this.config;
    const { name, opt } = params;
    if (plat == "aws3") {
      // https://aws.amazon.com/cn/blogs/developer/generate-presigned-url-modular-aws-sdk-javascript/
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: name,
        expires: 3600,
      });
      return getSignedUrl(client, command, {
        expiresIn: 3600,
      });
    }
    if (plat == "oss") {
      return client.signatureUrl(name, opt);
    }
    if (plat == "cos") {
      return new Promise((resolve, reject) => {
        client.getObjectUrl(
          {
            Bucket: bucket,
            Region: region,
            Key: name,
            Sign: true,
            Expires: opt.expires,
          },
          (err, data) => {
            if (err) reject(err);
            else resolve(data.Url);
          }
        );
      });
    }
  }
  headObject(Key) {
    const { client } = this;
    const { plat, bucket, region } = this.config;
    if (plat == "aws3") {
      return client
        .headObject({
          Bucket: bucket,
          Key,
        })
        .then((data) => {
          return {
            headers: {
              "content-type": data.ContentType,
            },
          };
        });
    }
    if (plat == "cos") {
      return new Promise((resolve, reject) => {
        client.headObject(
          {
            Bucket: bucket,
            Region: region,
            Key,
          },
          (err, data) => {
            if (err) reject(err);
            else resolve(data);
          }
        );
      });
    }
    return client.head(Key).then((data) => {
      return {
        headers: data.res.headers,
        meta: data.meta,
      };
    });
  }
}

async function getStsData(opts) {
  const { stsApi, plat, bucket } = opts;
  const { data } = await Axios.get(stsApi);
  if (plat == "oss") {
    return {
      accessKeyId: data.AccessKeyId,
      accessKeySecret: data.AccessKeySecret,
      stsToken: data.SecurityToken,
      bucket,
      // refreshSTSTokenInterval: (data.ExpirationSeconds || 3600) * 1e3,
      // async refreshSTSToken() {
      //   const data = await getStsData(opts);
      //   return data;
      // },
    };
  }
  if (plat == "cos") {
    return {
      TmpSecretId: data.tmpSecretId,
      TmpSecretKey: data.tmpSecretKey,
      SecurityToken: data.sessionToken,
      StartTime: data.startTime,
      ExpiredTime: data.expiredTime,
    };
  }
}
function getS3ListData(data, config) {
  const { plat } = config;
  return {
    prefixes: (data.CommonPrefixes || []).map((it) => it.Prefix),
    objects: (data.Contents || []).map((it) => {
      const arr = it.Key.split(".");
      return {
        plat,
        etag: it.ETag,
        name: it.Key,
        size: it.Size,
        lastModified:
          typeof it.LastModified == "string"
            ? it.LastModified
            : it.LastModified.toISO8String(),
        // src,
        // url,
        type: arr[arr.length - 1],
      };
    }),
    nextMarker: data.NextContinuationToken || data.NextMarker,
  };
}
