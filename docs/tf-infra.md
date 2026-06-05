### **Provision AWS Infrastructure**

#### **Configure AWS CLI**

```
aws configure
```

#### **Provision infrastructure**

```
cd tf-k8s-nodes
terraform init
terraform plan
terraform apply
```

#### **Useful Terraform outputs**

```
terraform output
terraform output -raw vpc_id
terraform output -raw aws_region
terraform output -raw cluster_name
```