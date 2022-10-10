import { Construct } from "constructs";
import { App, TerraformStack } from "cdktf";
import * as aws from "@cdktf/provider-aws";

class MyStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    // define resources here

    new aws.provider.AwsProvider(this, "aws", {
      region: "ap-northeast-1",
    });

    // S3
    const bucket = new aws.s3Bucket.S3Bucket(this, "s3Bucket", {
      bucketPrefix: "test-static-web-site-",
    });

    // バケットにACLを付与する
    new aws.s3BucketAcl.S3BucketAcl(this, "S3BucketAcl", {
      bucket: bucket.bucket,
      acl: "private",
    });

    // バケットの静的WEBホスティング設定
    new aws.s3BucketWebsiteConfiguration.S3BucketWebsiteConfiguration(
      this,
      "S3BucketWebsiteConfiguration",
      {
        bucket: bucket.bucket,
        indexDocument: {
          suffix: "index.html",
        },
        errorDocument: {
          key: "index.html",
        },
      }
    );
  }
}

const app = new App();
new MyStack(app, "infra");
app.synth();
