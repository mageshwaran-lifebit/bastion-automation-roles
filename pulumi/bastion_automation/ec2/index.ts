import { Instance, InstanceType, NetworkInterface, SecurityGroup, Subnet } from "@pulumi/aws/ec2"
import { commonTags } from "../util"
import { InstanceProfile } from "@pulumi/aws/iam"


export const launchInstance = (name: string, ami: string, instanceType: InstanceType, subnet: Subnet, securityGroup: SecurityGroup[], iamInstanceProfile?: string) => {
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
      httpEndpoint: 'enabled',
      httpPutResponseHopLimit: 2,
      httpTokens: 'required'
    },
    iamInstanceProfile: iamInstanceProfile || '',
    ebsOptimized: true,
    disableApiTermination: false,
    disableApiStop: false,
    ebsBlockDevices: [
      
    ]
  })
}

export const createInterfaceAndAttachToInstance = (name: string, subnet: Subnet, sg: SecurityGroup | null, deviceIndex: number, instance: Instance) => {
  return new NetworkInterface(name, {
    subnetId: subnet.id,
    securityGroups: sg == null? []: [sg.id],
    
    attachments: [
      { deviceIndex,  instance: instance.id }
    ],
    tags: {
      ...commonTags,
      Name: name
    },
  })
}