const aws = require("aws-sdk");

let s3;

const sourceBucket = "";
const sourceBucketFolder = "";

const targetBucket = "";

const syncFullBucket = false;

// function returns a s3 client with apiVersion and region
function getS3Client() {
  return new aws.S3({ apiVersion: "2006-03-01", region: "ap-south-1" });
}

// function to copy a file from one s3 bucket to another
function copyFile(sourceBucket, sourceKey, targetBucket, targetKey) {
  return new Promise((resolve, reject) => {
    s3.copyObject(
      {
        Bucket: targetBucket,
        CopySource: `${sourceBucket}/${sourceKey}`,
        Key: targetKey,
        ACL: "bucket-owner-full-control",
      },
      (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      }
    );
  });
}

// function to list all files in a s3 bucket
function listObjects(bucket, folder) {
  return new Promise((resolve, reject) => {
    s3.listObjectsV2(
      {
        Bucket: bucket,
        Prefix: folder,
      },
      (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data.Contents);
        }
      }
    );
  });
}

exports.handler = async (event) => {
  s3 = getS3Client();

  if (syncFullBucket) {
    const fileKeys = await listObjects(sourceBucket, sourceBucketFolder);

    for (let i = 0; i < fileKeys.length; i++) {
      const fileKey = fileKeys[i].Key;
      const targetKey = fileKey.split("/")[1];

      await copyFile(sourceBucket, fileKey, targetBucket, targetKey);
    }
  } else {
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(
      event.Records[0].s3.object.key.replace(/\+/g, " ")
    );

    await copyFile(bucket, key, targetBucket, key.split("/")[1]);
  }

  const response = {
    statusCode: 200,
  };
  return response;
};
