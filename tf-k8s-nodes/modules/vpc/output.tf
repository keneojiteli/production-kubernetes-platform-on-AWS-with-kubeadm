output "vpc_id" {
  description = "VPC id"
  value = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "VPC cidr"
  value = aws_vpc.main.cidr_block
}

output "priv_subnet_id" {
  description = "Private subnet ID"
  value = aws_subnet.private_subnet[*].id
}

output "pub_subnet_id" {
  description = "Public subnet ID"
  value = aws_subnet.public_subnet[*].id
}