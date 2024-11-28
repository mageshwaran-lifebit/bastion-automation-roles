import { PrincipalAssociation, ResourceAssociation, ResourceShare } from "@pulumi/aws/ram"
import { commonTags } from "../util"
import { TransitGateway } from "@pulumi/aws/ec2transitgateway"

export const createRamAndShareTgw = (name: string, tgw: TransitGateway): ResourceShare => {
  const ram = new ResourceShare(name, 
    {
      name,
      allowExternalPrincipals: false,
      tags: {
        ...commonTags
      },
      permissionArns:[
        'arn:aws:ram::aws:permission/AWSRAMDefaultPermissionTransitGateway'
      ]
    },
    { dependsOn: tgw }
  )

  new ResourceAssociation("tgw-resource", {
    resourceArn: tgw.arn,
    resourceShareArn: ram.arn
  })

  return ram
}

export const addPrincipal = (ram: ResourceShare, accountId: string) => {
  return  new PrincipalAssociation(`share-${accountId}`, {
    principal: accountId,
    resourceShareArn: ram.arn,
  })
}
