import { Instance, InstanceType, StorageType, SubnetGroup } from "@pulumi/aws/rds";
import { commonTags } from "../util";
import { SecurityGroup, Subnet } from "@pulumi/aws/ec2";
import { Key } from "@pulumi/aws/kms";


export const launchPostgresInstance = (name: string, sg: SecurityGroup, subnetGrp: SubnetGroup, key: Key): Instance => {
  return new Instance(name, {
    identifier: name,
    multiAz: true,
    dbName: name,
    engine: "postgres",
    engineVersion: "14.12",
    instanceClass: InstanceType.R6G_Large,
    username: "admin_foo",
    parameterGroupName: "default.postgres14",
    skipFinalSnapshot: true,
    storageType: StorageType.GP3,
    allocatedStorage: 200,
    maxAllocatedStorage: 2000,
    manageMasterUserPassword: true,
    storageEncrypted: true,
    // kmsKeyId: key.arn,
    vpcSecurityGroupIds: [sg.id],
    publiclyAccessible: false,
    port: 5432,
    backupRetentionPeriod: 7,
    backupWindow: '03:00-06:00',
    enabledCloudwatchLogsExports: [
      'postgresql', 'upgrade'
    ],
    autoMinorVersionUpgrade: true,
    deletionProtection: false,
    dbSubnetGroupName: subnetGrp.name,tags: {
      ...commonTags,
      'Name': 'sample-1'
    }
  });
} 

export const createSubnetGroup = (name: string, subnets: Subnet[]): SubnetGroup => {
  return new SubnetGroup(name, {
    name,
    subnetIds: subnets.map(x => x.id),
    tags: {
      ...commonTags
    }
  });
}