data "aws_region" "current" {}

module "vpc" {
  source = "./modules/vpc"
  project_name = var.project_name
  vpc_cidr = var.vpc_cidr
  az = var.az
  priv_subnet_cidr = var.priv_subnet_cidr
  pub_subnet_cidr = var.pub_subnet_cidr
}

module "sg" {
  source = "./modules/sg"
  project_name = var.project_name
  vpc_cidr = var.vpc_cidr
  vpc_id = module.vpc.vpc_id
  my_ip = var.my_ip
  cluster_name = var.cluster_name
}

module "iam" {
  source = "./modules/iam"
  cluster_name = var.cluster_name
}


module "ec2" {
  source = "./modules/ec2"

  ami          = var.ami
  key_name     = var.key_name
  cluster_name = var.cluster_name
  iam_instance_profile = module.iam.instance_profile_name

  common_tags = {
    project_name = var.project_name
  }

  instances = {
    bastion = merge(var.instances["bastion"], {
      subnet_id          = module.vpc.pub_subnet_id[0]
      security_group_ids = [module.sg.bastion_sg]
    })

    control-plane = merge(var.instances["control-plane"], {
      subnet_id          = module.vpc.priv_subnet_id[0]
      security_group_ids = [module.sg.control_plane_sg]
    })

    worker-1 = merge(var.instances["worker-1"], {
      subnet_id          = module.vpc.priv_subnet_id[0]
      security_group_ids = [module.sg.worker_node_sg]
    })

    worker-2 = merge(var.instances["worker-2"], {
      subnet_id          = module.vpc.priv_subnet_id[1]
      security_group_ids = [module.sg.worker_node_sg]
    })
  }
}


