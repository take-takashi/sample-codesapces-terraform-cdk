import { Construct } from 'constructs'
import { App, TerraformStack } from 'cdktf'
import * as aws from '@cdktf/provider-aws'

class MyStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name)

    // define resources here

    new aws.provider.AwsProvider(this, 'aws', {
      region: 'ap-northeast-1',
    })

    // S3
    const bucket = new aws.s3Bucket.S3Bucket(this, 's3Bucket', {
      bucketPrefix: 'test-static-web-site-',
    })

    // バケットにACLを付与する
    new aws.s3BucketAcl.S3BucketAcl(this, 'S3BucketAcl', {
      bucket: bucket.bucket,
      acl: 'private',
    })

    // バケットの静的WEBホスティング設定
    new aws.s3BucketWebsiteConfiguration.S3BucketWebsiteConfiguration(
      this,
      'S3BucketWebsiteConfiguration',
      {
        bucket: bucket.bucket,
        indexDocument: {
          suffix: 'index.html',
        },
        errorDocument: {
          key: 'index.html',
        },
      },
    )

    const oai = new aws.cloudfrontOriginAccessIdentity.CloudfrontOriginAccessIdentity(
      this,
      'oai',
      {},
    )

    // S3バケットポリシーの定義
    const policy = new aws.dataAwsIamPolicyDocument.DataAwsIamPolicyDocument(
      this,
      'policy_document',
      {
        statement: [
          {
            actions: ['s3:GetObject'],
            resources: [`${bucket.arn}/*`],
            principals: [
              {
                type: 'AWS',
                identifiers: [oai.iamArn],
              },
            ],
          },
        ],
      },
    )

    // 静的WEBホスティングのためのバケットボリシー
    new aws.s3BucketPolicy.S3BucketPolicy(this, 'S3BucketPolicy', {
      bucket: bucket.bucket,
      policy: policy.json,
    })

    // Cloudfront
    new aws.cloudfrontDistribution.CloudfrontDistribution(this, 'distribution', {
      enabled: true,
      defaultRootObject: 'index.html',
      // aliases
      customErrorResponse: [
        {
          errorCode: 403,
          responseCode: 200,
          responsePagePath: '/',
        },
      ],
      origin: [
        {
          originId: bucket.id,
          domainName: bucket.bucketRegionalDomainName,
          s3OriginConfig: {
            originAccessIdentity: oai.cloudfrontAccessIdentityPath,
          },
        },
      ],
      defaultCacheBehavior: {
        allowedMethods: ['GET', 'HEAD'],
        cachedMethods: ['GET', 'HEAD'],
        targetOriginId: bucket.id,
        forwardedValues: {
          queryString: false,
          cookies: {
            forward: 'none',
          },
        },
        viewerProtocolPolicy: 'redirect-to-https',
        minTtl: 0,
        defaultTtl: 0,
        maxTtl: 0,
      },
      restrictions: {
        geoRestriction: {
          restrictionType: 'none',
        },
      },
      viewerCertificate: {
        cloudfrontDefaultCertificate: true,
      },
    })
  }
}

const app = new App()
new MyStack(app, 'infra')
app.synth()
