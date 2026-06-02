variable "vpc_cidr" {
    description = "CIDR block for the VPC"
    type = string
}

variable "az" {
    description = "Availability zones for subnet creation"
    type = list(string)
}

variable "priv_subnet_cidr" {
    description = "Private subnets CIDR block"
    type = list(string)
}

variable "pub_subnet_cidr" {
    description = "Public subnets CIDR block"
    type = list(string)
}

variable "project_name" {
    description = "Name of the VPC"
    type = string
}

variable "cluster_name" {
  description = "Name of the Kubernetes cluster"
  type        = string
  default     = "kubeadm-cluster"
}