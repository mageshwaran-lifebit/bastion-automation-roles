import { allowAllInboundTraffic, allowAllOutboundTraffic, allowInboundTraffic, allowOutboundTraffic, createSecurityGroup } from './sg'
import { createTgwAttachment} from './tgw'
import { createGatewayEndpoint, createRouteTable, createSubnet, createVpc, Endpoint, pointRouteToTgw } from './vpc'
import { TransitGateway } from '@pulumi/aws/ec2transitgateway'

const VPC_CIDR_PREFIX = '15.0'
const VPC_CIDR = `${VPC_CIDR_PREFIX}.0.0/16`

/** ********************************* VPC CREATION ********************************* */

const tgw = TransitGateway.get('tgw', 'tgw-06f4edc45ca3f0c61')

const vpc = createVpc('workload-vpc', VPC_CIDR)

// Subnets
const privateSubnet1 = createSubnet('private-subnet-1', vpc, `${VPC_CIDR_PREFIX}.0.0/24`, 0)
const privateSubnet2 = createSubnet('private-subnet-2', vpc, `${VPC_CIDR_PREFIX}.1.0/24`, 1)
const privateSubnet3 = createSubnet('private-subnet-3', vpc, `${VPC_CIDR_PREFIX}.2.0/24`, 2)

// Route tables
const privateRt = createRouteTable('private-route-table', vpc, [privateSubnet1, privateSubnet2, privateSubnet3])


// gateway endpoint
const gatewaySg = createSecurityGroup('gateway-sg', vpc, 'S3 gateway security group')
allowInboundTraffic('s3-gateway-endpoint-443', gatewaySg, 'tcp', 443, 443, { cidrIpv4: VPC_CIDR }, '443 allowed from VPC CIDR')
createGatewayEndpoint('s3-gateway-endpoint', vpc, Endpoint.S3, [privateRt])


// security group
const sg = createSecurityGroup('analysis-sg', vpc, 'Bastion security group')
allowAllInboundTraffic('all', sg, { referencedSecurityGroupId: sg.id }, 'self security sg')
allowAllOutboundTraffic('all', sg, { referencedSecurityGroupId: sg.id }, 'self security sg')
allowInboundTraffic('443', sg, 'tcp', 443, 443, { cidrIpv4: '0.0.0.0/0' }, '443 allowed')
allowOutboundTraffic('443', sg, 'tcp', 443, 443, { cidrIpv4: '0.0.0.0/0' }, '443 allowed')

const tgwAttachment = createTgwAttachment('tgw-attachment-1', vpc, tgw, [privateSubnet1, privateSubnet2, privateSubnet3])
pointRouteToTgw('workload-vpc-tgw', privateRt, tgwAttachment, '0.0.0.0/0')

/** ********************************* VPC CREATION ********************************* */


