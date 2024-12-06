import { SecurityGroup, Vpc } from "@pulumi/aws/ec2"
import { commonTags } from "../util"
import { SecurityGroupEgressRule, SecurityGroupIngressRule } from "@pulumi/aws/vpc"
import { Output } from "@pulumi/pulumi"

interface Target {
  referencedSecurityGroupId?: Output<string>
  cidrIpv4?: string
  cidrIpv6?: string
  prefixListId?: string
}

export const createSecurityGroup = (name: string, vpc: Vpc, description?: string): SecurityGroup => {
  return new SecurityGroup(name, {
    name,
    description,
    revokeRulesOnDelete: true,
    vpcId: vpc.id,
    tags: {
      ...commonTags,

    }
  })
}

export const allowAllInboundTraffic = (name: string, securityGroup: SecurityGroup, target: Target, description?: string) => {
  return new SecurityGroupIngressRule(name, {
    ipProtocol: '-1',
    securityGroupId: securityGroup.id,
    ...target,
    description
  })
}

export const allowAllOutboundTraffic = (name: string, securityGroup: SecurityGroup, target: Target, description?: string) => {
  return new SecurityGroupEgressRule(name, {
    securityGroupId: securityGroup.id,
    ipProtocol: '-1',
    ...target,
    description
  })
}

export const allowInboundTraffic = (name: string, securityGroup: SecurityGroup, ipProtocol: string, fromPort: number, toPort: number, target: Target, description?: string) => {
  return new SecurityGroupIngressRule(name, {
    securityGroupId: securityGroup.id,
    ipProtocol,
    fromPort, toPort,
    ...target,
    description
  })
}

export const allowOutboundTraffic = (name: string, securityGroup: SecurityGroup, ipProtocol: string, fromPort: number, toPort: number, target: Target, description?: string) => {
  return new SecurityGroupEgressRule(name, {
    securityGroupId: securityGroup.id,
    ipProtocol,
    fromPort, toPort,
    ...target,
    description
  })
}