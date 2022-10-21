import { Construct } from 'constructs'
import { App, TerraformStack } from 'cdktf'
import * as aws from '@cdktf/provider-aws'

class MyStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name)

    // define resources here

    // aws provider (default)
    new aws.provider.AwsProvider(this, 'aws', {
      region: 'ap-northeast-1',
    })

    // aws provider (CloudFrontのACMにはバージニア北部のリージョンである必要がある)
    const awsProviderUsEast = new aws.provider.AwsProvider(this, 'use_east', {
      region: 'us-east-1',
      alias: 'us-east-1',
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

    // route53
    const zone = new aws.dataAwsRoute53Zone.DataAwsRoute53Zone(this, 'zone', {
      name: 'kaerunrun.ml',
    })

    // acm
    const acm = new aws.acmCertificate.AcmCertificate(this, 'acm', {
      domainName: 'blog.kaerunrun.ml',
      provider: awsProviderUsEast, // CloudFrontのACMにus-east1である必要がある
      validationMethod: 'DNS',
      lifecycle: {
        createBeforeDestroy: true,
      },
    })

    const record = new aws.route53Record.Route53Record(this, 'record', {
      name: acm.domainValidationOptions.get(0).resourceRecordName,
      type: acm.domainValidationOptions.get(0).resourceRecordType,
      records: [acm.domainValidationOptions.get(0).resourceRecordValue],
      zoneId: zone.id,
      ttl: 60,
      allowOverwrite: true, // TODO mean
    })
  }
}

const app = new App()
new MyStack(app, 'infra')
app.synth()
