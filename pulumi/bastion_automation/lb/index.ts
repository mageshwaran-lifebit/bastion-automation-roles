import * as aws from "@pulumi/aws";
import { TargetGroup, TargetGroupAttachment } from "@pulumi/aws/alb";
import { Subnet, Vpc } from "@pulumi/aws/ec2";
import { Listener, LoadBalancer } from "@pulumi/aws/lb";
import { Output } from "@pulumi/pulumi";


export const createNetworkLoadBalancer = (name: string, subnets: Subnet[], enableDeletionProtection: boolean) => {
  return new aws.lb.LoadBalancer(`${name}-load-balancer`, {
    name,
    internal: true, // Public Load Balancer
    loadBalancerType: "network", // Network Load Balancer
    enableDeletionProtection,
    subnets: subnets.map(subnet => subnet.id),
    ipAddressType: "ipv4", // Can be either ipv4 or ipv6
  })
}

export const createIpTargetGroup = (name: string, vpc: Vpc, ip: string | Output<string>, port: number) => {
  const targetGroup = new aws.lb.TargetGroup(`${name}-target-group`, {
    port: port,
    protocol: "TCP",
    targetType: "ip", // Target type is IP addresses
    vpcId: vpc.id,
    healthCheck: {
        path: "/",
        protocol: "HTTPS",
    }
  })

  new TargetGroupAttachment(`${name}-target-group-attachment`, {
    targetGroupArn: targetGroup.arn,
    targetId: ip,  // IP of the target
    port: port,
  })

  return targetGroup
}

export const addListener = (name: string, nlb: LoadBalancer, port: number, targetGroup: TargetGroup) => {
  return new Listener(`${name}-listener`, {
    loadBalancerArn: nlb.arn,
    port: port,
    protocol: "TCP", // This can also be UDP if needed
    defaultActions: [{
        type: "forward",
        targetGroupArn: targetGroup.arn,
    }],
})
}
