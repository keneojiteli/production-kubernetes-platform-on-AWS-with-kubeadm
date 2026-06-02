# shared
variable "region" {
   description = "Region for VPC-project"
   type = string
   default = "us-east-1"
}

variable "project_name" {
   description = "Name of the project"
   type = string
   default = "kubeadm-infra"
}

# vpc
variable "vpc_cidr" {
    description = "CIDR block for the VPC"
    type = string
    default = "10.0.0.0/16"
}

variable "az" {
    description = "Availability zones for subnet creation"
    type = list(string)
    default = [ "us-east-1a", "us-east-1b" ]
}

variable "priv_subnet_cidr" {
    description = "Private subnets CIDR block"
    type = list(string)
    default = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "pub_subnet_cidr" {
    description = "Public subnets CIDR block"
    type = list(string)
    default = ["10.0.3.0/24", "10.0.4.0/24"]
}

# ec2 module vars
variable "ami" {
    type = string
    default = "ami-0bbdd8c17ed981ef9"
}

variable "key_name" {
    type = string 
    default = "project-patsy-keypair"
}

variable "cluster_name" {
  description = "Name of the Kubernetes cluster"
  type        = string
  default     = "kubeadm-cluster"
}

# variable "iam_instance_profile" {}

variable "instances" {
  description = "EC2 instances for the Kubernetes cluster"

  type = map(object({
    instance_type      = string
    subnet_id          = string
    security_group_ids = list(string)
    role               = string
  }))

  default = {
    bastion = {
      instance_type      = "t3.micro"
      subnet_id          = ""
      security_group_ids = []
      role               = "bastion"
    }

    control-plane = {
      instance_type      = "t3.medium"
      subnet_id          = ""
      security_group_ids = []
      role               = "control-plane"
    }

    worker-1 = {
      instance_type      = "t3.medium"
      subnet_id          = ""
      security_group_ids = []
      role               = "worker-1"
    }

    worker-2 = {
      instance_type      = "t3.medium"
      subnet_id          = ""
      security_group_ids = []
      role               = "worker-2"
    }
  }
}

variable "my_ip" {
    description = "Ip address to allow SSH connection"
    type = string
    default = "105.115.6.195/32" 
}

