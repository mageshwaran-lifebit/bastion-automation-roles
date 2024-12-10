import { Eip, getElasticIp, InternetGateway, NatGateway, Route, RouteTable, RouteTableAssociation, SecurityGroup, Subnet, Vpc, VpcEndpoint } from "@pulumi/aws/ec2"
import { commonTags } from "../util"
import { getAvailabilityZones } from "@pulumi/aws/getAvailabilityZones.js"
import { VpcAttachment } from "@pulumi/aws/ec2transitgateway"
import { region } from "@pulumi/aws/config"


const azs = getAvailabilityZones({ state: "available" })

export enum Endpoint {
  S3 = 's3',
  DynamoDB = 'dynamodb'
}

export const createVpc = (name: string, cidrBlock: string) => {
  return new Vpc(name, {
    cidrBlock: cidrBlock,
    assignGeneratedIpv6CidrBlock: false,
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: {
      ...commonTags,
      Name: name
    }
  })
}

export const createSubnet = (name: string, vpc: Vpc, cidrBlock: string, zoneIdx: number): Subnet => {
  return new Subnet(name, {
    availabilityZone: azs.then(az => az.names?.[zoneIdx]),
    cidrBlock: cidrBlock,
    vpcId: vpc.id
  })
}

export const createRouteTable = (name: string, vpc: Vpc, subnets: Subnet[] = []): RouteTable => {
  const rt = new RouteTable(`${name}-rt`, {
    vpcId: vpc.id,
    tags: {
      ...commonTags,
      Name: name
    }
  })

  if(subnets) {
    subnets.map((x, idx) => createRouteTableAssociation(`${name}-rt-ass-${idx}`, rt, x))
  }

  return rt
}

export const createRouteTableAssociation = (name: string, rt: RouteTable, subnet: Subnet): void => {
  new RouteTableAssociation(name, {
    routeTableId: rt.id,
    subnetId: subnet.id
  })
}

export const pointRouteToTgw = (name: string, rt: RouteTable, tgwAttachment: VpcAttachment, destinationCidrBlock: string): void => {
  new Route(`${name}-route`, {
    routeTableId: rt.id,
    transitGatewayId: tgwAttachment.transitGatewayId,
    destinationCidrBlock
  }, { dependsOn: tgwAttachment })
}

export const pointRouteToNat = (name: string, rt: RouteTable, gateway: NatGateway): void => {
  new Route(`${name}-route`, {
    routeTableId: rt.id,
    natGatewayId: gateway.id,
    destinationCidrBlock: '0.0.0.0/0'
  })
}

export const pointRouteToIgw = (name: string, rt: RouteTable, gateway: InternetGateway): void => {
  new Route(`${name}-route`, {
    routeTableId: rt.id,
    gatewayId: gateway.id,
    destinationCidrBlock: '0.0.0.0/0'
  })
}

export const createInternetGw = (name: string, vpc: Vpc): InternetGateway => {
  return new InternetGateway(name, {
    vpcId: vpc.id,
    tags: {
      ...commonTags,
      Name: name
    }
  })
}

export const createNatGw = (name: string, subnet: Subnet): NatGateway => {
  const eip = new Eip(`${name}-ip`,{
    tags: {
      ...commonTags
    }
  })
  return new NatGateway(name, {
    subnetId: subnet.id,
    allocationId: eip.id,
    connectivityType: 'public',
    tags: {
      ...commonTags,
      Name: name
    }
  })
}

export const createGatewayEndpoint = (name: string, vpc: Vpc, serviceName: Endpoint, routeTables: RouteTable[]) => {
  return new VpcEndpoint(name, {
    serviceName: `com.amazonaws.${region}.${serviceName}`,
    routeTableIds: routeTables.map(x => x.id),
    vpcId: vpc.id,
    tags: {
      ...commonTags,
      Name: name
    }
  })
}