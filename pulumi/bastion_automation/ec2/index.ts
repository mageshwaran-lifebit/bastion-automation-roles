import { Instance, InstanceType, SecurityGroup, Subnet } from "@pulumi/aws/ec2"
import { commonTags } from "../util"


export const launchInstance = (name: string, ami: string, instanceType: InstanceType, subnet: Subnet, securityGroup: SecurityGroup[]) => {
  return new Instance(name, {
    associatePublicIpAddress: false,
    ami,
    instanceType,
    vpcSecurityGroupIds: securityGroup.map(x => x.id),
    userData: '',
    subnetId: subnet.id,
    volumeTags: {
      ...commonTags, Name: `${name}-volume`
    },
    tags: {
      ...commonTags, Name: name
    },
    metadataOptions: {

    },
    iamInstanceProfile: '',
    ebsOptimized: true,
    disableApiTermination: false,
    disableApiStop: false,
    ebsBlockDevices: [
      
    ]
  })
}