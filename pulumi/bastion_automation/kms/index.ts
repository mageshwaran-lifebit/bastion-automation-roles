import { Key } from "@pulumi/aws/kms"
import { commonTags } from "../util"

export const createKey = (name: string) => {
  return new Key(name, {
    enableKeyRotation: true,
    tags: {
      ...commonTags
    }
  })
}