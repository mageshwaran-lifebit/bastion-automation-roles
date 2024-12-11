import { createActiveRoute, createTgw, createTgwAssociation, createTgwAttachment, createTgwDefaultAssociation, createTgwDefaultPropagation, createTgwRouteTable} from './tgw'
import { createInternetGw, createNatGw, createRouteTable, createSubnet, createVpc, pointRouteToEni, pointRouteToIgw, pointRouteToNat, pointRouteToTgw } from './vpc'
import { addPrincipal, createRamAndShareTgw } from './ram'
import { createKey } from './kms'
import { createSubnetGroup, launchPostgresInstance } from './rds'
import { allowAllOutboundTraffic, allowInboundTraffic, allowOutboundTraffic, createSecurityGroup } from './sg'
import { createInterfaceAndAttachToInstance, launchInstance } from './ec2'
import { InstanceType } from '@pulumi/aws/ec2' 
import { InstanceProfile } from '@pulumi/aws/iam'
import { getInstanceProfile } from '@pulumi/aws/iam/getInstanceProfile'

const VPC_CIDR_PREFIX = '15.0'
const VPC_CIDR = `${VPC_CIDR_PREFIX}.0.0/16`

/** ********************************* VPC CREATION ********************************* */
const vpc = createVpc('networking-vpc', VPC_CIDR)

// Subnets
const privateSubnet1 = createSubnet('private-subnet-1', vpc, `${VPC_CIDR_PREFIX}.0.0/24`, 0)
const privateSubnet2 = createSubnet('private-subnet-2', vpc, `${VPC_CIDR_PREFIX}.1.0/24`, 1)
const publicSubnet1 = createSubnet('public-subnet-1', vpc, `${VPC_CIDR_PREFIX}.2.0/24`, 0)
const publicSubnet2 = createSubnet('public-subnet-2', vpc, `${VPC_CIDR_PREFIX}.3.0/24`, 1)
const heartbeatSubnet1 = createSubnet('heartbeat-subnet-1', vpc, `${VPC_CIDR_PREFIX}.4.0/24`, 0)
const heartbeatSubnet2 = createSubnet('heartbeat-subnet-2', vpc, `${VPC_CIDR_PREFIX}.5.0/24`, 1)

// Route tables
const publicRt = createRouteTable('public-route-table', vpc, [publicSubnet1, publicSubnet2])
const privateRt = createRouteTable('private-route-table', vpc, [privateSubnet1, privateSubnet2])

createRouteTable('heartbeat-route-table', vpc, [heartbeatSubnet1, heartbeatSubnet2])

// gateways
const internetGateway = createInternetGw('igw', vpc)

// add routes
pointRouteToIgw('igw', publicRt, internetGateway)
/** ********************************* VPC CREATION ********************************* */


/** ********************************* TRANSIT GATEWAY CREATION ********************************* */
const tgw = createTgw('tgw-1')

// create ram and share tgw
const ram = createRamAndShareTgw('lifebit-resources-share', tgw)
addPrincipal(ram, '495869644545')

const attachment1 = createTgwAttachment('tgw-attachment-1', vpc, tgw, [privateSubnet1, privateSubnet2])
pointRouteToTgw('networking-vpc-tgw', privateRt, attachment1, '16.0.0.0/8')


// tgw route tables
const networkingTgwRt = createTgwRouteTable('networking-rt', tgw)
// createTgwAssociation('networking-vpc-ass', attachment1, networkingTgwRt)

createTgwDefaultPropagation('default-propagation', tgw, networkingTgwRt)
createActiveRoute('anywhere-networking', networkingTgwRt, '0.0.0.0/0', attachment1)

const workloadVpcsTgwRt = createTgwRouteTable('workload-vpcs-rt', tgw)
createTgwDefaultAssociation('default-association', tgw, workloadVpcsTgwRt)
createActiveRoute('anywhere-workload', workloadVpcsTgwRt, '0.0.0.0/0', attachment1)
/** ********************************* TRANSIT GATEWAY CREATION ********************************* */



/** ********************************* RDS CREATION ********************************* */
// security group
const rdsSg = createSecurityGroup('rds-sg', vpc, 'RDS security group')
allowInboundTraffic('all-self', rdsSg, 'tcp', 5432, 5432, { referencedSecurityGroupId: rdsSg.id }, 'self security sg')
allowInboundTraffic('all', rdsSg, 'tcp', 5432, 5432, { cidrIpv4: VPC_CIDR }, 'self security sg')

const key = createKey('rds-key')
const subnetGroup = createSubnetGroup('postgress-subnet-grp', [privateSubnet1, privateSubnet2])
launchPostgresInstance('cloudos', rdsSg, subnetGroup, key)
/** ********************************* RDS CREATION ********************************* */

/** ********************************* FORTIGATE CREATION (FIREWALL MODE) ********************************* */
// security group
const sg = createSecurityGroup('bastion-sg', vpc, 'Bastion security group')
allowAllOutboundTraffic('all', sg, { referencedSecurityGroupId: sg.id }, 'self security sg')
allowOutboundTraffic('443', sg, 'tcp', 443, 443, { cidrIpv4: '0.0.0.0/0' }, '443 allowed')

// 

const ec2 = launchInstance('bastion', 'ami-0e30add6ca7295f6f', InstanceType.C6i_XLarge, privateSubnet1, [sg], 'fortigate-firewall-instance-role')

const eni = createInterfaceAndAttachToInstance('active-port1', publicSubnet1, sg, 1, ec2)
createInterfaceAndAttachToInstance('active-port2', privateSubnet1, sg, 2, ec2)
createInterfaceAndAttachToInstance('active-port3', heartbeatSubnet1, sg, 3, ec2)

pointRouteToEni('eni', privateRt, eni, '0.0.0.0/0')
/** ********************************* FORTIGATE CREATION (FIREWALL MODE) ********************************* */