import { DefaultRouteTableAssociation, DefaultRouteTablePropagation, Route, RouteTable, RouteTableAssociation, RouteTablePropagation, TransitGateway, VpcAttachment } from "@pulumi/aws/ec2transitgateway"
import { commonTags } from "../util"
import { Subnet, Vpc } from "@pulumi/aws/ec2"


export const createTgw = (name: string, description: string = 'sample description'): TransitGateway => {
  return new TransitGateway(name, {
    description,
    tags: {
      ...commonTags,
      'Name': name
    },
    autoAcceptSharedAttachments: "enable",
    dnsSupport: "enable",
    securityGroupReferencingSupport: "enable",
    defaultRouteTableAssociation: "enable",
    defaultRouteTablePropagation: "enable",
    vpnEcmpSupport: "disable",
    multicastSupport: 'disable'
  })
}

export const createTgwAttachment = (name: string, vpc: Vpc, tgw: TransitGateway, subnets: Subnet[]): VpcAttachment => {
  return new VpcAttachment(name, {
    dnsSupport: 'enable',
    securityGroupReferencingSupport: 'enable',
    subnetIds: subnets.map(subnet => subnet.id),
    tags: {
      ...commonTags
    },
    vpcId: vpc.id,
    transitGatewayId: tgw.id
  }, {dependsOn: subnets })
}

export const createTgwRouteTable = (name: string, tgw: TransitGateway): RouteTable => {
  return new RouteTable(name, {
    transitGatewayId: tgw.id,
    tags: {
      ...commonTags,
      Name: name
    }
  })
}

export const createTgwDefaultAssociation = (name: string, tgw: TransitGateway, rt: RouteTable): DefaultRouteTableAssociation => {
  return new DefaultRouteTableAssociation(name, {
    transitGatewayId: tgw.id,
    transitGatewayRouteTableId: rt.id
  })
}

export const createTgwDefaultPropagation = (name: string, tgw: TransitGateway, rt: RouteTable): DefaultRouteTablePropagation => {
  return new DefaultRouteTablePropagation(name, {
    transitGatewayId: tgw.id,
    transitGatewayRouteTableId: rt.id
  })
}

export const createTgwAssociation = (name: string, attachment: VpcAttachment, rt: RouteTable): RouteTableAssociation => {
  return new RouteTableAssociation(name, {
    transitGatewayAttachmentId: attachment.id,
    transitGatewayRouteTableId: rt.id
  })
}

export const createTgwPropagation = (name: string, attachment: VpcAttachment, rt: RouteTable): RouteTablePropagation => {
  return new RouteTablePropagation(name, {
    transitGatewayAttachmentId: attachment.id,
    transitGatewayRouteTableId: rt.id
  })
}

export const createActiveRoute = (name: string, rt: RouteTable, cidrBlock: string, attachment: VpcAttachment): void => {
  new Route(name, {
    transitGatewayAttachmentId: attachment.id,
    destinationCidrBlock: cidrBlock,
    transitGatewayRouteTableId: rt.id
  })
}

export const createBlackHoleRoute = (name: string, rt: RouteTable, cidrBlock: string): void => {
  new Route(name, {
    destinationCidrBlock: cidrBlock,
    transitGatewayRouteTableId: rt.id,
    blackhole: true
  })
}