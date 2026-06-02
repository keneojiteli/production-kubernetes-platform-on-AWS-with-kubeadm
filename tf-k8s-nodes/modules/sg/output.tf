output "bastion_sg" {
  description = "ID for bastion sg"
  value = aws_security_group.bastion.id #correction: changed type from list(string) to string to avoid nested list in root module
}

output "control_plane_sg" {
  description = "ID for control plane sg"
  value = aws_security_group.control_plane.id
}

output "worker_node_sg" {
  description = "ID for worker node sg"
  value = aws_security_group.worker_node.id
}