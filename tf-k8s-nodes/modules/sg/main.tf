# bastion host sg
resource "aws_security_group" "bastion" {
  name   = "${var.project_name}-bastion-sg"
  vpc_id = var.vpc_id
}

resource "aws_vpc_security_group_ingress_rule" "bastion_ssh_from_my_ip" {
  security_group_id = aws_security_group.bastion.id
  cidr_ipv4         = var.my_ip
  from_port         = 22
  to_port           = 22
  ip_protocol       = "tcp"
  description       = "SSH from admin IP only"
}

# egress rule
resource "aws_vpc_security_group_egress_rule" "bastion_egress" {
  security_group_id = aws_security_group.bastion.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

# control plane sg
resource "aws_security_group" "control_plane" {
  name   = "${var.project_name}-control-plane-sg"
  vpc_id = var.vpc_id
  tags = {
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
  }
}

resource "aws_vpc_security_group_ingress_rule" "cp_ssh_from_bastion" {
  security_group_id            = aws_security_group.control_plane.id
  referenced_security_group_id = aws_security_group.bastion.id
  from_port                    = 22
  to_port                      = 22
  ip_protocol                  = "tcp"
  description                  = "SSH from bastion"
}

resource "aws_vpc_security_group_ingress_rule" "cp_api_from_workers" {
  security_group_id            = aws_security_group.control_plane.id
  referenced_security_group_id = aws_security_group.worker_node.id
  from_port                    = 6443
  to_port                      = 6443
  ip_protocol                  = "tcp"
  description                  = "Kubernetes API from worker nodes"
}

resource "aws_vpc_security_group_ingress_rule" "cp_etcd_self" {
  security_group_id            = aws_security_group.control_plane.id
  referenced_security_group_id = aws_security_group.control_plane.id
  from_port                    = 2379
  to_port                      = 2380
  ip_protocol                  = "tcp"
  description                  = "etcd client and peer traffic between control planes"
}

resource "aws_vpc_security_group_ingress_rule" "cp_vxlan_from_workers" {
  security_group_id            = aws_security_group.control_plane.id
  referenced_security_group_id = aws_security_group.worker_node.id
  from_port                    = 4789
  to_port                      = 4789
  ip_protocol                  = "udp"
  description                  = "Calico VXLAN from workers"
}

# Suitable for HA control plane
# resource "aws_vpc_security_group_ingress_rule" "cp_vxlan_self" {
#   security_group_id            = aws_security_group.control_plane.id
#   referenced_security_group_id = aws_security_group.control_plane.id
#   from_port                    = 4789
#   to_port                      = 4789
#   ip_protocol                  = "udp"
#   description                  = "Calico VXLAN between control-plane nodes"
# }

resource "aws_vpc_security_group_ingress_rule" "cp_typha_from_workers" {
  security_group_id            = aws_security_group.control_plane.id
  referenced_security_group_id = aws_security_group.worker_node.id
  from_port                    = 5473
  to_port                      = 5473
  ip_protocol                  = "tcp"
  description                  = "Calico Typha from workers if enabled"
}

# egress rule
resource "aws_vpc_security_group_egress_rule" "allow_all_cp" {
  security_group_id = aws_security_group.control_plane.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

# worker node sg
resource "aws_security_group" "worker_node" {
  name   = "${var.project_name}-worker-node-sg"
  vpc_id = var.vpc_id
  tags = {
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
  }
}

resource "aws_vpc_security_group_ingress_rule" "worker_ssh_from_bastion" {
  security_group_id            = aws_security_group.worker_node.id
  referenced_security_group_id = aws_security_group.bastion.id
  from_port                    = 22
  to_port                      = 22
  ip_protocol                  = "tcp"
  description                  = "SSH from bastion"
}

resource "aws_vpc_security_group_ingress_rule" "worker_kubelet_from_cp" {
  security_group_id            = aws_security_group.worker_node.id
  referenced_security_group_id = aws_security_group.control_plane.id
  from_port                    = 10250
  to_port                      = 10250
  ip_protocol                  = "tcp"
  description                  = "Kubelet API from control plane"
}

resource "aws_vpc_security_group_ingress_rule" "worker_vxlan_from_workers" {
  security_group_id            = aws_security_group.worker_node.id
  referenced_security_group_id = aws_security_group.worker_node.id
  from_port                    = 4789
  to_port                      = 4789
  ip_protocol                  = "udp"
  description                  = "Calico VXLAN worker-to-worker"
}

resource "aws_vpc_security_group_ingress_rule" "worker_vxlan_from_cp" {
  security_group_id            = aws_security_group.worker_node.id
  referenced_security_group_id = aws_security_group.control_plane.id
  from_port                    = 4789
  to_port                      = 4789
  ip_protocol                  = "udp"
  description                  = "Calico VXLAN from control plane"
}

# resource "aws_vpc_security_group_ingress_rule" "worker_nodeport_from_public_lb" {
#   security_group_id            = aws_security_group.worker_node.id
#   referenced_security_group_id = aws_security_group.public_lb.id
#   from_port                    = 30000
#   to_port                      = 32767
#   ip_protocol                  = "tcp"
#   description                  = "NodePort traffic from public load balancer"
# }

# allows lb to hit node ports
resource "aws_vpc_security_group_ingress_rule" "worker_nodeports" {
  security_group_id = aws_security_group.worker_node.id
  cidr_ipv4 = var.vpc_cidr
  from_port = 30000
  to_port   = 32767
  ip_protocol = "tcp"
  description = "Temporary NodePort access from VPC"
}

# egress rule
resource "aws_vpc_security_group_egress_rule" "allow_all_worker" {
  security_group_id = aws_security_group.worker_node.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

# public lb sg
# resource "aws_security_group" "public_lb" {
#   name   = "${var.project_name}-public-lb-sg"
#   vpc_id = var.vpc_id
# }

# resource "aws_vpc_security_group_ingress_rule" "public_lb_http" {
#   security_group_id = aws_security_group.public_lb.id
#   cidr_ipv4         = "0.0.0.0/0"
#   from_port         = 80
#   to_port           = 80
#   ip_protocol       = "tcp"
#   description       = "Public HTTP"
# }

# resource "aws_vpc_security_group_ingress_rule" "public_lb_https" {
#   security_group_id = aws_security_group.public_lb.id
#   cidr_ipv4         = "0.0.0.0/0"
#   from_port         = 443
#   to_port           = 443
#   ip_protocol       = "tcp"
#   description       = "Public HTTPS"
# }

# resource "aws_vpc_security_group_egress_rule" "public_lb_to_worker_nodeports" {
#   security_group_id            = aws_security_group.public_lb.id
#   referenced_security_group_id = aws_security_group.worker_node.id
#   from_port                    = 30000
#   to_port                      = 32767
#   ip_protocol                  = "tcp"
#   description                  = "Forward traffic to worker NodePorts"
# }