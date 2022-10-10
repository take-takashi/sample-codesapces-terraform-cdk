import { Construct } from "constructs";
import { App, TerraformStack } from "cdktf";
import { provider, s3Bucket as s3 } from "@cdktf/provider-aws";

class MyStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    // define resources here

    new provider.AwsProvider(this, "aws", {
      region: "ap-northeast-1",
    });

    new s3.S3Bucket(this, "myBucket", {
      bucketPrefix: "example-",
    });
  }
}

const app = new App();
new MyStack(app, "infra");
app.synth();
