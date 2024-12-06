import { createActiveRoute, createTgw, createTgwAttachment, createTgwDefaultAssociation, createTgwDefaultPropagation, createTgwRouteTable} from './tgw'
import { createInternetGw, createNatGw, createRouteTable, createRouteTableAssociation, createSubnet, createVpc, pointRouteToIgw, pointRouteToNat, pointRouteToTgw } from './vpc'
import { addPrincipal, createRamAndShareTgw } from './ram'

const VPC_CIDR_PREFIX = '15.0'
const VPC_CIDR = `${VPC_CIDR_PREFIX}.0.0/16`

/** ********************************* VPC CREATION ********************************* */
const vpc = createVpc('networking-vpc', VPC_CIDR)

// Subnets
const privateSubnet1 = createSubnet('private-subnet-1', vpc, `${VPC_CIDR_PREFIX}.0.0/24`, 0)
const privateSubnet2 = createSubnet('private-subnet-2', vpc, `${VPC_CIDR_PREFIX}.1.0/24`, 1)
const publicSubnet1 = createSubnet('public-subnet-1', vpc, `${VPC_CIDR_PREFIX}.2.0/24`, 0)
const publicSubnet2 = createSubnet('public-subnet-2', vpc, `${VPC_CIDR_PREFIX}.3.0/24`, 1)

// Route tables
const publicRt = createRouteTable('public-route-table', vpc, [publicSubnet1, publicSubnet2])
const privateRt = createRouteTable('private-route-table', vpc, [privateSubnet1, privateSubnet2])

// gateways
const internetGateway = createInternetGw('igw', vpc)
const natGateway = createNatGw('nat', publicSubnet1)

// add routes
pointRouteToIgw('igw', publicRt, internetGateway)
pointRouteToNat('nat', privateRt, natGateway)
/** ********************************* VPC CREATION ********************************* */



/** ********************************* TRANSIT GATEWAY CREATION ********************************* */
const tgw = createTgw('tgw-1')

// create ram and share tgw
const ram = createRamAndShareTgw('firewall-tgw-share', tgw)
addPrincipal(ram, '495869644545')

const attachment1 = createTgwAttachment('tgw-attachment-1', vpc, tgw, [privateSubnet1, privateSubnet2])
pointRouteToTgw('networking-vpc-tgw', privateRt, attachment1, VPC_CIDR)

// tgw route tables
const networkingTgwRt = createTgwRouteTable('networking-rt', tgw)
createTgwDefaultPropagation('default-propagation', tgw, networkingTgwRt)
createActiveRoute('anywhere-networking', networkingTgwRt, '0.0.0.0/0', attachment1)

const workloadVpcsTgwRt = createTgwRouteTable('workload-vpcs-rt', tgw)
createTgwDefaultAssociation('default-association', tgw, workloadVpcsTgwRt)
createActiveRoute('anywhere-workload', workloadVpcsTgwRt, '0.0.0.0/0', attachment1)
/** ********************************* TRANSIT GATEWAY CREATION ********************************* */


