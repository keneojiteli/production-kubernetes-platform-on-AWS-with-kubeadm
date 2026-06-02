#best practice: stick to underscores in variable names to avoid needing quotes
variable "ami" {
    description = "AMI for EC2"
    type = string
}

variable "key_name" {
    description = "Key pair name for EC2"
    type = string  
}

variable "cluster_name" {
  description = "Name of the Kubernetes cluster"
  type        = string
}

variable "iam_instance_profile" {
  description = "IAM instance profile for Kubernetes nodes"
  type        = string
}

variable "instances" {
  description = "Map of instances to create"
  type = map(object({
    instance_type      = string
    subnet_id          = string
    security_group_ids = list(string)
    role               = string
  }))
}

variable "common_tags" {
  type = map(string)
}



