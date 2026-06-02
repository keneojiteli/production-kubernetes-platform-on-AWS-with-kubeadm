variable "vpc_id" {
  description = "VPC id"
  type = string
}

variable "project_name" {
   description = "Name of the project"
   type = string
}

variable "vpc_cidr" {
    description = "CIDR block for the VPC"
    type = string
}

variable "my_ip" {
    description = "Ip address to allow SSH connection"
    type = string
}

variable "cluster_name" {}