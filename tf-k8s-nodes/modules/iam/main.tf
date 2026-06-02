resource "aws_iam_policy" "aws_load_balancer_controller" {
  name        = "${var.cluster_name}-AWSLoadBalancerControllerIAMPolicy"
  description = "IAM policy for AWS Load Balancer Controller"
  policy      = file("${path.module}/iam_policy.json")
}

resource "aws_iam_role" "worker_node_role" {
  name = "${var.cluster_name}-worker-node-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "worker_node_profile" {
  name = "${var.cluster_name}-worker-node-profile"
  role = aws_iam_role.worker_node_role.name
}

resource "aws_iam_role_policy_attachment" "worker_aws_lbc_attach" {
  role       = aws_iam_role.worker_node_role.name
  policy_arn = aws_iam_policy.aws_load_balancer_controller.arn
}