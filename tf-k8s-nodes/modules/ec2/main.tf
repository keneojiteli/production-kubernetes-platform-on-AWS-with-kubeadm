# creates nodes for k8s cluster and a bastion host
resource "aws_instance" "this" {
  for_each = var.instances

  ami           = var.ami
  instance_type = each.value.instance_type
  subnet_id     = each.value.subnet_id
  key_name      = var.key_name

  vpc_security_group_ids = each.value.security_group_ids

  iam_instance_profile = each.value.role != "bastion" ? var.iam_instance_profile : null

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = each.value.role != "bastion" ? 2 : 1
  }

  tags = merge(
    var.common_tags,
    {
      Name = each.key
      Role = each.value.role
    },
    each.value.role != "bastion" ? {
      "kubernetes.io/cluster/${var.cluster_name}" = "owned"
    } : {}
  )
}