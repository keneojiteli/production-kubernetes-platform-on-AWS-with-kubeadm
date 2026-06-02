# vpc
resource "aws_vpc" "main" {
  cidr_block = var.vpc_cidr
  instance_tenancy = "default"
  enable_dns_hostnames = true
  tags = {
    Name = "${var.project_name}-vpc"
  }
}

#internet gateway
resource "aws_internet_gateway" "igw" {
    vpc_id = aws_vpc.main.id
    tags = {
      Name = "${var.project_name}-igw"
    }
}

# public subnet
resource "aws_subnet" "public_subnet" {
  vpc_id = aws_vpc.main.id
  count = length(var.pub_subnet_cidr)
  # count = length(var.az)
  availability_zone = var.az[count.index]
  cidr_block = var.pub_subnet_cidr[count.index]
  map_public_ip_on_launch = true
  tags = {
      Name = "${var.project_name}-pub-subnet-${count.index + 1}"
      "kubernetes.io/role/elb" = 1 #ccm tag
      "kubernetes.io/cluster/${var.cluster_name}" = "shared"
  }
}

# private subnet
resource "aws_subnet" "private_subnet" {
  vpc_id = aws_vpc.main.id
  count = length(var.priv_subnet_cidr)
  # count = length(var.az)
  availability_zone = var.az[count.index]
  cidr_block = var.priv_subnet_cidr[count.index]
  map_public_ip_on_launch = false
  tags = {
    Name = "${var.project_name}-priv-subnet-${count.index + 1}"
    "kubernetes.io/role/internal-elb" = 1 #ccm tag
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
  }
}

#provides an Elastic IP resource
resource "aws_eip" "nat_eip" {
    domain = "vpc"
    depends_on = [ aws_internet_gateway.igw ]
    count = length(var.pub_subnet_cidr)
    tags = {
      Name = "${var.project_name}-elastic-ip-${count.index + 1}"
    }
}

#provides a resource to create a VPC NAT Gateway
resource "aws_nat_gateway" "public_nat_gateway" {
    count = length(var.pub_subnet_cidr)
    subnet_id = aws_subnet.public_subnet[count.index].id 
    allocation_id = aws_eip.nat_eip[count.index].id
    depends_on = [ aws_internet_gateway.igw ]
    tags = {
      Name = "${var.project_name}-nat-gateway-${count.index + 1}"
    }
}

#public route table
resource "aws_route_table" "pub_rtb" {
    vpc_id = aws_vpc.main.id
    route {
        cidr_block = "0.0.0.0/0"
        gateway_id = aws_internet_gateway.igw.id
    }
    tags = {
      Name = "${var.project_name}-pub-rtb"
    }
}

#private route table
resource "aws_route_table" "priv_rtb" {
    vpc_id = aws_vpc.main.id
    count = length(var.priv_subnet_cidr)
    route {
        cidr_block = "0.0.0.0/0"
        nat_gateway_id = aws_nat_gateway.public_nat_gateway[count.index].id
    }
    tags = {
      Name = "${var.project_name}-priv-rtb"
    }
} 

#public route table association
#provides a resource to create an association between a route table and a subnet or a route table and an internet gateway
resource "aws_route_table_association" "public_rtb_association" {
    count = length(var.pub_subnet_cidr)
    route_table_id = aws_route_table.pub_rtb.id
    subnet_id = aws_subnet.public_subnet[count.index].id
    depends_on = [ aws_subnet.public_subnet, aws_route_table.pub_rtb ]
}

#private route table association
resource "aws_route_table_association" "private_rtb_association" {
    count = length(var.priv_subnet_cidr)
    route_table_id = aws_route_table.priv_rtb[count.index].id
    subnet_id = aws_subnet.private_subnet[count.index].id
    depends_on = [ aws_subnet.private_subnet, aws_route_table.priv_rtb ]
}