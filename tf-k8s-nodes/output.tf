output "aws_region" {
  value = data.aws_region.current.name
}

output "cluster_name" {
  value = var.cluster_name
}

output "vpc" {
  value = module.vpc.vpc_id
}

output "pub_subnet" {
  value = module.vpc.pub_subnet_id
}

output "priv_subnet" {
  value = module.vpc.priv_subnet_id
}

output "bastion" {
  value = module.sg.bastion_sg
}

output "control_plane" {
  value = module.sg.control_plane_sg
}

output "worker" {
  value = module.sg.worker_node_sg
}

output "instance_profile_name" {
  value = module.iam.instance_profile_name
}