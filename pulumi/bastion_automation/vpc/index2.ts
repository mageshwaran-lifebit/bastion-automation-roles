import { InternetGateway, NatGateway, Route, RouteTable, RouteTableAssociation, Subnet, Vpc } from "@pulumi/aws/ec2"
import { commonTags } from "../util"
import { getAvailabilityZones } from "@pulumi/aws/getAvailabilityZones"

const azs = getAvailabilityZones({ state: "available" })

// NOT YET READY. ANOTHER WAY
export class VpcManager {
  private readonly vpc: Vpc

  constructor(name: string, cidrBlock: string) {
    this.vpc = new Vpc(name, {
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

  getVpc(): Vpc {
    return this.vpc
  }

  addSubnet(name: string, cidrBlock: string, zoneIdx: number): Subnet {
      return new Subnet(name, {
        availabilityZone: azs.then(az => az.names?.[zoneIdx]),
        cidrBlock: cidrBlock,
        vpcId: this.vpc.id
      })
  }
}