import { Construct } from "constructs";
import { App, TerraformStack } from "cdktf";
import { s3Bucket as s3 } from "@cdktf/provider-aws";

class MyStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    // define resources here
    new s3.S3Bucket(this, "myBucket", {
      bucketPrefix: "example-",
    });
  }
}

const app = new App();
new MyStack(app, "infra");
app.synth();
