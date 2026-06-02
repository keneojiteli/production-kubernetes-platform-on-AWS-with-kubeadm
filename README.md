# Building a Production-Style Kubernetes Platform on AWS with kubeadm

> A hands-on project focused on understanding Kubernetes internals by building, operating, troubleshooting, and exposing a self-managed Kubernetes cluster on AWS using kubeadm, Calico, Gateway API, and AWS Load Balancer Controller.

--- 

## Project Overview

Most engineers interact with Kubernetes through managed services such as Amazon EKS, Google Kubernetes Engine (GKE), or Azure Kubernetes Service (AKS). While these platforms simplify operations, they abstract away many of the internal systems responsible for cluster orchestration, networking, node registration, cloud integrations, and workload routing.

To gain a deeper operational understanding of Kubernetes, I built a self-managed Kubernetes platform on AWS using **kubeadm**.

The goal was not simply to deploy a Kubernetes cluster, but to understand:

- How Kubernetes control plane components interact.
- How worker nodes register with the cluster.
- How Container Network Interfaces (CNIs) function.
- How DNS and service discovery operate.
- How Gateway API integrates with cloud load balancers.
- How AWS Load Balancer Controller works in self-managed clusters.
- How real-world Kubernetes failures surface and are diagnosed.

This repository documents the complete build process, troubleshooting journey, engineering decisions, and lessons learned.

---

## Project Architecture

### Infrastructure Components

- 1 Kubernetes Control Plane Node (Private Subnet)
- 2 Kubernetes Worker Nodes (Private Subnets)
- 1 Bastion Host (Public Subnet)
- NAT Gateway
- Public Subnets for Load Balancers
- Private Subnets for Kubernetes Nodes
- AWS Load Balancer Controller
- Gateway API
- Calico CNI (VXLAN)

### Access Flow

```text
Developer Laptop
        │
        ▼
 Bastion Host
        │
        ▼
 Control Plane
        │
        ▼
 Worker Nodes
```

### Traffic Flow

```text
Internet
    │
    ▼
AWS Application Load Balancer
    │
    ▼
Gateway API
    │
    ▼
HTTPRoute
    │
    ▼
Kubernetes Service
    │
    ▼
NGINX Pods
```

---

## Architecture Diagram
<img width="1536" height="1024" alt="arch-diag-1" src="https://github.com/user-attachments/assets/603cecd2-7ca9-4433-872a-12d3457c580b" />



<!--
Recommended diagram:

```text
Internet
    │
    ▼
Application Load Balancer
    │
    ▼
Gateway API
    │
 ┌──┴──┐
 ▼     ▼
Worker Worker
Node1  Node2
   \   /
    \ /
Control Plane

```
---
-->

## Technologies Used

### Infrastructure

- Terraform
- AWS EC2
- AWS VPC
- NAT Gateway
- Security Groups
- IAM Roles

### Kubernetes

- kubeadm
- kubelet
- kubectl
- containerd
- CoreDNS
- Calico

### Networking

- Calico VXLAN
- Gateway API
- AWS Load Balancer Controller

### Operating System

- Ubuntu 24.04 LTS

---

## Repository Structure
<!---->
Work in Progress
<!--
```text
.
├── terraform/
│
├── kubernetes/
│   ├── gateway-api/
│   ├── nginx/
│   └── manifests/
│
├── docs/
│   ├── 01-infrastructure-terraform.md
│   ├── 02-kubeadm-bootstrap.md
│   ├── 03-calico-networking.md
│   ├── 04-aws-load-balancer-controller.md
│   ├── 05-gateway-api.md
│   ├── 06-nginx-validation.md
│   └── 07-troubleshooting.md
│
└── README.md 
```
---
-->
## Project Objectives

The project was designed to achieve the following objectives:

- Provision AWS infrastructure using Terraform.
- Bootstrap Kubernetes using kubeadm.
- Configure pod networking using Calico.
- Deploy workloads to the cluster.
- Expose applications externally using Gateway API.
- Integrate AWS Load Balancer Controller.
- Validate cluster networking and DNS.
- Understand Kubernetes operational workflows.
- Develop troubleshooting skills for production-like environments.
- Document real troubleshooting scenarios for long-term technical recall.

---

## Key Features

### Self-Managed Kubernetes

Built entirely using kubeadm rather than managed Kubernetes services.

### Private Cluster Architecture

All Kubernetes nodes are deployed within private subnets.

### Bastion-Based Access

Administrative access is performed through a dedicated bastion host.

### Calico Networking

Pod-to-pod communication powered by Calico VXLAN.

### Gateway API

Modern Kubernetes traffic management model.

### AWS Load Balancer Controller

Automatic provisioning and management of AWS Application Load Balancers.

### Production-Style Networking

Public traffic enters through an ALB and is routed to workloads running within private subnets.

---

## Build Journey

The project was completed in several phases.

| Phase | Description |
|---------|-------------|
| Phase 1 | AWS Infrastructure Provisioning |
| Phase 2 | Kubernetes Bootstrap with kubeadm |
| Phase 3 | Calico Networking |
| Phase 4 | Worker Node Integration |
| Phase 5 | DNS & Service Discovery Validation |
| Phase 6 | Sample Workload Deployment |
| Phase 7 | Gateway API Integration |
| Phase 8 | AWS Load Balancer Controller |
| Phase 9 | External Application Access |
| Phase 10 | Troubleshooting & Debugging |

---

## Detailed Implementation Guides

The full implementation commands and explanations are available in the documentation folder.

| Guide | Description |
|---------|-------------|
| [Terraform Infrastructure](docs/tf-infra.md) | AWS infrastructure provisioning |
| [Control plane setup](docs/control-plane.md) | Configuring control plane |
| [Worker node setup](docs/worker-node.md) | Configuring worker nodes |
<!--| [AWS Load Balancer Controller](docs/04-aws-load-balancer-controller.md) | Controller installation and IAM setup |
| [Gateway API](docs/05-gateway-api.md) | GatewayClass, Gateway, HTTPRoute |
| [NGINX Validation](docs/06-nginx-validation.md) | Sample application deployment |
| [Troubleshooting](docs/07-troubleshooting.md) | Operational debugging journey |

---
-->
## Engineering Challenges Encountered

One of the primary goals of this project was not simply building the platform, but troubleshooting it.

Some notable issues encountered included:

### CoreDNS Pending State

Root Cause:

- No Container Network Interface installed.

Resolution:

- Installed Calico CNI.

---

### Calico Readiness Probe Issues

Root Cause:

- Felix readiness failures during startup.
- DNS validation and network verification required.

Resolution:

- Verified pod networking.
- Confirmed VXLAN operation.
- Validated CoreDNS functionality.

---

### Gateway API Waiting for Controller

Root Cause:

- Incorrect GatewayClass controller name.

Resolution:

- Updated GatewayClass controller reference.

---

### Missing providerID

Root Cause:

- AWS Load Balancer Controller could not map Kubernetes nodes to AWS instances.

Resolution:

- Added cloud provider integration.
- Configured providerID population.

---

### Internal Load Balancer Created

Root Cause:

- AWS selected private subnets during ALB creation.

Resolution:

- Added required subnet tags.
- Explicitly configured internet-facing behavior.

---

### Empty Target Groups

Root Cause:

- Worker nodes were not properly registered.

Resolution:

- Fixed providerID issues.
- Validated NodePort service configuration.

---

# Key Lessons Learned

Some of the most valuable lessons emerged from troubleshooting.

### Kubernetes Networking Is Critical

Many Kubernetes issues are ultimately networking issues.

Examples:

- Pending Pods
- Failed Readiness Probes
- DNS Failures
- Service Discovery Issues

### Cloud Integrations Depend on Metadata

AWS Load Balancer Controller depends heavily on:

- Resource Tags
- IAM Permissions
- providerID Values
- Subnet Discovery

### Symptoms Often Hide Root Causes

A failed readiness probe may actually indicate:

- DNS Issues
- Network Connectivity Problems
- Missing Metadata
- Controller Reconciliation Failures

---

## Future Roadmap

This project forms the foundation for several follow-on projects.

### Phase 2 — Production 3-Tier Application

Deploy:

- Frontend
- Backend API
- Database

Implement:

- ConfigMaps
- Secrets
- Persistent Volumes
- Ingress/Gateway Routing

---

### Phase 3 — End-to-End DevOps Lifecycle

Implement:

- GitHub Actions
- CI/CD Pipelines
- Automated Deployments
- Rolling Updates
- Rollbacks

---

### Phase 4 — Observability

Deploy:

- Prometheus
- Grafana
- Loki
- Fluent Bit

Implement:

- Metrics
- Dashboards
- Alerting

---

### Phase 5 — Kubernetes Upgrades

Simulate:

- Worker Node Upgrades
- Control Plane Upgrades
- Rolling Maintenance

Demonstrate:

- High Availability
- Zero-Downtime Upgrades

---

### Phase 6 — AI for DevOps

Build:

- AI Kubernetes Troubleshooter
- Log Analysis Assistant
- Operational Copilot

Focus Areas:

- Failure Detection
- Root Cause Analysis
- Automated Troubleshooting

---

## Articles

This repository is accompanied by a series of engineering articles documenting the project journey.

### Main Project Article

👉 **Read on [Dev.to](https://dev.to/keneojiteli/building-and-operating-a-production-style-kubernetes-platform-on-aws-using-kubeadm-110k) | [Hashnode](https://keneojiteli.hashnode.dev/building-and-operating-a-production-style-kubernetes-platform-on-aws-using-kubeadm)**
<!--👉 **[Building a Production-Style Kubernetes Platform on AWS with kubeadm](ARTICLE_URL_HERE)** -->

### Troubleshooting Series

Coming Soon:

- Calico Readiness Probe Investigation
- CoreDNS Debugging
- Gateway API Troubleshooting
- AWS Load Balancer Controller Debugging
- providerID & Target Registration Deep Dive
- Internal vs Internet-Facing Load Balancers

---

<!-- # Screenshots

> 📷 Terraform Infrastructure

> 📷 kubeadm Cluster Bootstrap

> 📷 Calico Installation

> 📷 Node Registration

> 📷 DNS Validation

> 📷 Gateway API Resources

> 📷 AWS Load Balancer Creation

> 📷 Successful Browser Access

---
-->
<!-- # References

- Kubernetes Documentation
- kubeadm Documentation
- Calico Documentation
- Gateway API Documentation
- AWS Load Balancer Controller Documentation
- Terraform Documentation

---
-->
## Connect

If you are working on Kubernetes, cloud infrastructure, platform engineering, or DevOps, I would love to connect and exchange ideas.

Feel free to:

- Open an Issue
- Submit a Pull Request
- Reach out on [LinkedIn](https://www.linkedin.com/in/kenechukwuojiteli/)

---

⭐ If you found this project useful, consider giving the repository a star.

---


<!--
## Table of Contents

* [Project Overview](#project-overview)  
* [Architecture](#architecture)  
* [Project Objectives](#project-objectives)
* [Repository Structure](#repo-structure)  
* [Article Series](#article-series)  
* [Infrastructure Components)](#infra-components)  
* [Prerequisites](#prerequisites)  
* [Implementation Steps](#implementation-steps)  
    * [1) Provision AWS Infrastructure](#1-provision-infra)  
    * [2) Prepare Kubernetes Nodes)](#2-prepare-k8s-nodes)  
    * [3) Initialize Control Plane](#3-initialize-control-plane)  
    * [4) Install Calico CNI](#4-install-calico)  
    * [5) Join Worker Nodes](#5-join-worker-odes) 
    * [6) Validate Cluster Networking](#6-validate-cluster-networking)  
    * [7) Install Gateway API CRDs](#7-install-gateway-api-crd)  
    * [8) Install AWS Load Balancer Controller](#8-install-aws-lbc)  
    * [9) Deploy and Expose Nginx](#9-deploy-and-expose-nginx)  
    * [10) Validate Browser Access](#10-validate-browser-access)  
* [Key Operational Challenges](#key-operational-challenges) 
* [Lessons Learned](#lessons-learned)   
* [Next Phases](#next-phases)    
* [References](#references)  

## Architecture

The platform was designed to simulate a simplified production-style Kubernetes environment.

### Infrastructure Layout

- 1 control plane node in a private subnet
- 2 worker nodes in private subnets
- 1 bastion host in a public subnet
- Public subnets for internet-facing ALB and NAT gateway
- Private subnets for Kubernetes nodes
- No direct public access to the Kubernetes nodes
- Administrative access through the bastion host
- Application traffic routed through AWS ALB using Gateway API

## Project Objectives

The main objectives of this project were to:

- Provision AWS infrastructure using Terraform
- Build a self-managed Kubernetes cluster using kubeadm
- Configure Kubernetes networking using Calico
- Integrate AWS Load Balancer Controller with Gateway API
- Expose workloads through an AWS Application Load Balancer
- Validate the platform using a sample NGINX workload
- Understand operational failure modes in self-managed Kubernetes clusters
- Document real troubleshooting scenarios for long-term technical recall

## Repository Structure
## Article Series

This project is documented as an engineering article series.

### Phase 1 Article
Building and Operating a Production-Style Kubernetes Platform on AWS Using kubeadm

### Upcoming Articles
- Debugging a Self-Managed Kubernetes Cluster on AWS: Calico, Gateway API, AWS LBC, providerID, IMDS, and ALB Issues
- Deploying a Production-Style 3-Tier Application on Kubernetes
- Implementing CI/CD, Observability, and GitOps for a Kubernetes Platform
- Performing Cluster Upgrades and Simulating High Availability
- Building an AI-Powered Kubernetes Log Analyzer

## Infrastructure Components

Terraform provisions the following AWS resources:

- VPC
- Public subnets
- Private subnets
- Internet Gateway
- NAT Gateway
- Route tables
- Bastion host
- Control plane EC2 instance
- Worker EC2 instances
- Security groups
- IAM roles
- IAM instance profiles

### Important AWS Resource Tags

These tags are required for AWS Load Balancer Controller subnet discovery.

```
# Public subnets
"kubernetes.io/role/elb" = "1"
"kubernetes.io/cluster/kubeadm-cluster" = "shared"

# Private subnets
"kubernetes.io/role/internal-elb" = "1"
"kubernetes.io/cluster/kubeadm-cluster" = "shared"

Worker and control plane nodes were also tagged with:
"kubernetes.io/cluster/kubeadm-cluster" = "owned"
```

## Prerequisites

Required tools:

- AWS CLI
- Terraform
- kubectl
- kubeadm
- Helm
- SSH client
- AWS account with permissions to create EC2, VPC, IAM, and Load Balancer resources

Required knowledge:

- Basic Linux administration
- Kubernetes fundamentals
- AWS networking basics
- Terraform basics
- Container runtime concepts


#### 5-Minute Checklist

* Control plane: **API server, etcd, controller manager, scheduler**
* Nodes: **kubelet, kube-proxy, container runtime**
* Networking: **Pods, Services**, and why a **CNI** (Calico) is needed

---

# Demo: Build a Multi-Node Kubernetes Cluster with kubeadm (v1.34)

This project sets a real cluster on VMs: one control-plane node and two worker nodes, all on Ubuntu with containerd and Calico for networking. I carried out this project on **cloud** VMs, but **any VMs work** (on-prem, home lab, or a laptop hypervisor) as long as they can reach each other and you can SSH in. Firstly, I’ll set up the control plane first, make sure it’s good, then add the workers and deploy a tiny test app end-to-end. Every command block says exactly where to run it — **\[ALL NODES]**, **\[CONTROL PLANE ONLY]**, or **\[WORKER ONLY]**. If you’re not on AWS, treat “security groups” as your firewall rules/NSGs with the same ports.


---

## Demo Pre-requisites

### 1) Networking & Security Groups (updated for Calico **Typha**)

> **Why this change?** In the Day 54 video we didn’t open **TCP 5473**. With operator-based Calico, the **Typha** component is commonly enabled and (by default) runs with **hostNetwork**, so each `calico-node` (Felix) connects to Typha on **5473/TCP**. Without this, `calico-node` can sit in **Running (0/1)** with Typha connection timeouts.

**Note:** For full context and step-by-step fixes, see **[Calico Troubleshooting](#calico-troubleshooting)** at the end of this guide.


![Alt text](/images/54a.png)

Create two SGs: **control-plane-sg** and **data-plane-sg** (same VPC). Allow **all egress** on both.

#### control-plane-sg (inbound)

| Purpose          | Protocol / Port | Source            | When                                        |
| ---------------- | --------------- | ----------------- | ------------------------------------------- |
| SSH              | TCP 22          | Your IP           | Always                                      |
| Kubernetes API   | TCP 6443        | **data-plane-sg** | Always                                      |
| **Calico Typha** | **TCP 5473**    | **data-plane-sg** | If Typha Pods can land on CP nodes          |
| VXLAN overlay    | **UDP 4789**    | **data-plane-sg** | Recommended (Calico defaults run on CP too) |



> **Note (self-managed clusters):** By default the `calico-node` **DaemonSet tolerates the control-plane taint and runs on control-plane nodes**. Therefore, keep **UDP 4789 (VXLAN)** and **TCP 5473 (Typha)** open on the control-plane SG.
> You can omit these **only if you explicitly keep Calico off control-plane nodes** (e.g., label workers and set a `nodeSelector`/remove CP tolerations on `calico-node`) **and** ensure Typha runs only on workers.


---

#### data-plane-sg (inbound)

| Purpose          | Protocol / Port | Source               | When                                            |
| ---------------- | --------------- | -------------------- | ----------------------------------------------- |
| SSH              | TCP 22          | Your IP              | Always                                          |
| Kubelet API      | TCP 10250       | **control-plane-sg** | Always                                          |
| VXLAN overlay    | **UDP 4789**    | **data-plane-sg**    | Always (worker ↔ worker)                        |
| VXLAN overlay    | **UDP 4789**    | **control-plane-sg** | Always (CP ↔ worker)                            |
| **Calico Typha** | **TCP 5473**    | **data-plane-sg**    | If Typha Pods can land on workers (node ↔ node) |
| **Calico Typha** | **TCP 5473**    | **control-plane-sg** | If CP nodes must reach Typha on workers         |
| NodePort (demo)  | TCP 30000–32767 | Your IP              | Optional (only for testing NodePort externally) |

---

**Azure/GCP:** use NSGs / VPC firewall rules with the **same ports/protocols**.
**Also ensure** instances have outbound internet (NAT GW or public EIP) so images can pull.
**HA note (optional):** multi-CP clusters also need: **TCP 2379–2380** (etcd), **TCP 10257** (controller-manager), **TCP 10259** (scheduler) between control-plane nodes.


---

### 2) SSH key pair

**Recommended:** **create the key pair in your cloud provider’s console.**
This is the easiest path because the provider injects your **public key** at boot—no manual copy to `~/.ssh/authorized_keys`.

* **AWS (easy path):** EC2 → **Key Pairs** → **Create key pair** → Type: **ED25519** → download `.pem`

  ```bash
  chmod 400 ~/Downloads/kubeadm-demo.pem
  ssh -i ~/Downloads/kubeadm-demo.pem ubuntu@<PUBLIC_IP_OR_DNS>
  ```
* **Azure/GCP:** Create an SSH key in the VM create flow (Azure “SSH public key”, GCP “SSH Keys/OS Login”). The platform injects it automatically.

**Alternative (local key you generate):**
If you generate a key locally, you must **import the public key** to your cloud account **or** copy it into each VM’s `authorized_keys`.

```bash
# generate locally
ssh-keygen -t ed25519 -C "kubeadm-demo" -f ~/.ssh/kubeadm-demo
chmod 400 ~/.ssh/kubeadm-demo


# copy to a running VM using ssh-copy-id (requires you can already SSH to it)
ssh-copy-id -i ~/.ssh/kubeadm-demo.pub ubuntu@<PUBLIC_IP_OR_DNS>

# then connect using your private key
ssh -i ~/.ssh/kubeadm-demo ubuntu@<PUBLIC_IP_OR_DNS>
```

> **TL;DR:** **Use the provider-generated key pair if possible**—it skips the whole “copy the public key into `authorized_keys`” step.


When connecting:

```bash
ssh -i ~/.ssh/kubeadm-demo ubuntu@<PUBLIC_IP_OR_DNS>
```

---

### 3) Instances

* **OS:** Ubuntu **22.04 or 24.04** LTS (amd64)
* **Sizing:**

  * Control plane: **2 vCPU, 4–8 GB RAM**, 20 GB disk (8 GB works for quick demos)
  * Workers: **1–2 vCPU, 2–4 GB RAM**, 8–20 GB disk
* Place all nodes in the **same VPC** and **routable subnets**.

> kubeadm requires **≥2 vCPU** on the control plane (you *can* bypass with `--ignore-preflight-errors=NumCPU`, but keep 2 vCPU for a clean demo).

---

### 4) Hostnames (clarity only)

On each node (adjust name):

```bash
sudo hostnamectl set-hostname control-plane   # or worker-1 / worker-2
exec bash    # reload the current shell so hostname/prompt and new env settings take effect (use 'sudo reboot' if it still doesn’t reflect)
```

*(Optional)* Add friendly entries to `/etc/hosts` if you want to `ping` by name; Kubernetes doesn’t require it.

---

### 5) How to follow the steps (read this first)

* **Only run commands where the heading says.** Each block is labeled **\[ALL NODES]**, **\[CONTROL PLANE ONLY]**, or **\[WORKER ONLY]**. Stick to that label.
* **Recommended order:** finish the **control plane** first, then do the **workers**.

  * In the control-plane section there’s a short “check” at the end. **Run that check.** If it looks good (no errors), move on to the worker section.
* **Stay organized:** keep one terminal tab per node, copy/paste exactly, and replace placeholders (like `<CP_PRIVATE_IP>`) with your values.
* **Use `sudo` when shown** and don’t skip steps—even if something “looks done.”

---



## Step 1: Disable swap & set kernel networking \[ALL NODES]

```bash
# Disable swap (required by kubelet)
sudo swapoff -a
sudo sed -i '/ swap / s/^/#/' /etc/fstab

# Kernel modules & sysctls for container networking
echo -e "overlay\nbr_netfilter" | sudo tee /etc/modules-load.d/k8s.conf
sudo modprobe overlay && sudo modprobe br_netfilter

cat <<'EOF' | sudo tee /etc/sysctl.d/99-kubernetes-cri.conf
net.bridge.bridge-nf-call-iptables=1
net.bridge.bridge-nf-call-ip6tables=1
net.ipv4.ip_forward=1
EOF
sudo sysctl --system
```

**Why:**

* **Swap off** → kubelet’s resource management assumes no swap.
* **`overlay`** → enables overlay filesystem used by container images.
* **`br_netfilter` + bridge sysctls** → let iptables see bridged traffic (pods/Services).
* **`ip_forward=1`** → allow the node to route pod traffic.

---

## Step 2: Install and configure containerd \[ALL NODES]

```bash
# Install containerd
sudo apt-get update && sudo apt-get install -y containerd
sudo mkdir -p /etc/containerd
containerd config default | sudo tee /etc/containerd/config.toml >/dev/null

# Align containerd with kubelet expectations
sudo sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml
sudo sed -i 's#sandbox_image = ".*"#sandbox_image = "registry.k8s.io/pause:3.9"#' /etc/containerd/config.toml

sudo systemctl daemon-reload
sudo systemctl enable --now containerd
sudo systemctl status containerd
```

**Why:**

* **containerd** is the container runtime kubelet talks to.
* **`SystemdCgroup=true`** matches kubelet’s cgroup driver, avoiding cgroup errors.
* **Pause image (`pause:3.9`)** consistency prevents needless pod sandbox churn.

---

## Step 3: Install kubeadm, kubelet, kubectl (v1.32) \[ALL NODES]

```bash
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.32/deb/Release.key \
 | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.32/deb/ /' \
 | sudo tee /etc/apt/sources.list.d/kubernetes.list

sudo apt-get update && sudo apt-get install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl
sudo systemctl enable kubelet

# Verify
kubeadm version
kubelet --version
kubectl version
```

**Why:**

* **kubeadm** bootstraps the cluster; **kubelet** runs pods; **kubectl** is the CLI.
* Holding versions keeps your demo stable.


### Bash completion (optional, helpful)

```bash
sudo apt-get update && sudo apt-get install -y bash-completion
echo 'source /usr/share/bash-completion/bash_completion' >> ~/.bashrc
echo 'source <(kubectl completion bash)' >> ~/.bashrc
echo 'alias k=kubectl' >> ~/.bashrc
echo 'complete -F __start_kubectl k' >> ~/.bashrc
source ~/.bashrc
```

> **kubectl on workers (kubeconfig):** We didn’t configure a kubeconfig on worker nodes. If you want to run `kubectl` from a worker, create `~/.kube/config` there.
>
> **Quick (lab) method — copy admin kubeconfig**
>
> ```bash
> # On control-plane
> sudo cp /etc/kubernetes/admin.conf /tmp/kubeconfig
> sudo chown $USER:$USER /tmp/kubeconfig
> scp /tmp/kubeconfig ubuntu@worker-1:~/.kube/config
>
> # On worker-1
> mkdir -p ~/.kube
> chmod 600 ~/.kube/config
> kubectl get nodes   # should work now
> ```
>
> *(This grants cluster-admin on that worker; fine for demos, not for prod.)*

---

## Step 4: Initialize the control plane \[CONTROL PLANE ONLY]

```bash
# Replace with your control plane node's private IP
sudo kubeadm init \
  --control-plane-endpoint=<CP_PRIVATE_IP>:6443 \
  --apiserver-advertise-address=<CP_PRIVATE_IP> \
  --pod-network-cidr=192.168.0.0/16
```

```bash
# Kubeconfig for the current user
mkdir -p $HOME/.kube
sudo cp /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

**Why:**

* **`--control-plane-endpoint`** is the address other nodes/clients use.
* **`--apiserver-advertise-address`** is the local IP the API server binds to.
* **Pod CIDR** must match your CNI (we’ll use 192.168.0.0/16 with Calico).

> **Note (for 1 vCPU control-plane VMs):**
> kubeadm expects **≥ 2 vCPU** for the control plane. For demos on tiny VMs, you can bypass the preflight check:
>
> ```bash
> sudo kubeadm init \
>   --control-plane-endpoint=<CP_PRIVATE_IP>:6443 \
>   --apiserver-advertise-address=<CP_PRIVATE_IP> \
>   --pod-network-cidr=192.168.0.0/16 \
>   --ignore-preflight-errors=NumCPU
> ```
>
> *This only skips the check, startup may be slower and less stable. Use **2 vCPU** for the control plane when possible. Workers can be 1–2 vCPU.*

---

## Step 5: Install Calico CNI via **Operator** (defaults) \[CONTROL PLANE ONLY]

```bash
# 1) Install the operator and CRDs
kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/v3.30.2/manifests/operator-crds.yaml
kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/v3.30.2/manifests/tigera-operator.yaml

# 2) Apply a minimal Installation CR (no calico-apiserver)
cat <<'EOF' | kubectl apply -f -
apiVersion: operator.tigera.io/v1        # Calico Operator API group/version
kind: Installation                        # Cluster-wide Calico install spec
metadata:
  name: default                           # Must be named 'default' (singleton)
spec:
  calicoNetwork:                          # Calico networking settings
    bgp: Disabled                         # Added later. Refer "Calico Troubleshooting" section of this lecture
    ipPools:
    - cidr: 192.168.0.0/16                # Pod CIDR (matches kubeadm --pod-network-cidr)
      natOutgoing: Enabled                # SNAT pod→external traffic at node egress
      blockSize: 26                       # Per-node IP block size (/26 = 64 pod IPs)
      encapsulation: VXLANCrossSubnet     # Use VXLAN; skip encapsulation within same L2 subnet
      nodeSelector: all()                 # Apply this pool to all nodes
EOF
```

**Why:**

* This is the **official, operator-managed install**—simple now and easier to upgrade later.
* The provided `custom-resources.yaml` applies **sensible defaults** that work with kubeadm clusters (including the `192.168.0.0/16` pod network used here), so **no customization is required**.
* Once installed, Calico provides **networking for pods and Services**, allowing system pods (like CoreDNS) and your apps to start communicating.

---

## Step 6: Join the workers \[WORKER ONLY]

```bash
# On the control plane, print the fresh join command:
kubeadm token create --print-join-command
```

Run the printed command **exactly** on each worker, for example:

```bash
sudo kubeadm join <CP_PRIVATE_IP>:6443 --token <TOKEN> \
  --discovery-token-ca-cert-hash sha256:<HASH>
```

**Why:**

* This securely bootstraps the worker, registers it, and downloads cluster certs.

---

## Step 7: Verify & quick demo \[any node with kubeconfig]

```bash
# See nodes and system pods
kubectl get nodes -o wide
kubectl -n kube-system get pods -o wide

# Tiny demo app + Service
kubectl create deploy web --image=nginx --replicas=3
kubectl expose deploy/web --port=80 --type=NodePort

# Discover the NodePort
kubectl get svc web -o wide
kubectl get svc web -o jsonpath='{.spec.ports[0].nodePort}'; echo

# Test from your machine (security groups must allow it)
curl -I http://<worker-1-public-or-private-ip>:<nodeport>
curl -I http://<worker-2-public-or-private-ip>:<nodeport>
```

---

## Calico Troubleshooting

**Why these Calico fixes exist?**
While upgrading the cluster in **Day 55**, we noticed some `calico-node` Pods weren’t becoming **Ready**. We applied a few Calico/network tweaks to resolve this. The steps below document those changes. For full context, watch the **Day 55** lecture where we perform the Kubernetes upgrade with **kubeadm**.


**Symptom:** `calico-node` Pods show **Running (0/1)** and readiness fails. You’ll see messages like **“Error querying BIRD”** or **“BGP not established …”** even though the cluster uses **VXLAN** (so BGP isn’t required).

**Root cause:** With the Tigera **operator** install, **BGP defaults to enabled** unless you explicitly set it. In a VXLAN setup, that leads to BIRD/BGP readiness failures. After disabling BGP, some nodes may still report **Felix not ready** if they can’t reach **Typha** (TCP **5473**).

## Fix (VXLAN clusters)

**1) Check whether BGP is enabled**

```bash
# Show the BGP setting on the Installation CR (empty or "Enabled" = on)
kubectl get installation.operator.tigera.io default \
  -o jsonpath='{.spec.calicoNetwork.bgp}{"\n"}'
```

**2) Disable BGP on the Installation CR**

```bash
# Turn off BGP for VXLAN-only networking
kubectl patch installation.operator.tigera.io default --type=merge \
  -p '{"spec":{"calicoNetwork":{"bgp":"Disabled"}}}'
```

**3) Restart calico-node to pick up the change**

```bash
# Rollout restart the DaemonSet and wait for readiness
kubectl -n calico-system rollout restart ds/calico-node
kubectl -n calico-system rollout status ds/calico-node
```

**4) If you still see readiness errors mentioning Felix / Typha**

```bash
# Inspect Typha endpoints (Pods usually run in calico-system)
kubectl -n calico-system get deploy,svc,endpoints -l k8s-app=calico-typha

# Check calico-node logs for Typha connection errors (port 5473/TCP)
kubectl -n calico-system logs ds/calico-node -c calico-node | grep -i typha
```

Open **TCP 5473** **between nodes and the Typha endpoints** (where the `calico-typha` Pods run). In cloud environments, that means updating your **Security Groups/NSGs** to allow node↔Typha traffic on **5473/TCP**.
Also ensure **UDP 4789** is allowed for **VXLAN** (you already did this), and note that you **do not** need **TCP 179** (BGP) when BGP is disabled.

> If you actually intend to use BGP (no overlay / routed fabric), **keep BGP enabled** and open **TCP 179** between peers (and configure node-to-node mesh or route reflectors). For VXLAN-only clusters, keep BGP **Disabled** to avoid BIRD errors.

**Reference:** Tigera docs mention disabling BGP for operator-based VXLAN installs:
[https://docs.tigera.io/calico/latest/getting-started/kubernetes/windows-calico/operator#operator-installation](https://docs.tigera.io/calico/latest/getting-started/kubernetes/windows-calico/operator#operator-installation)

https://docs.tigera.io/calico/latest/getting-started/kubernetes/self-managed-onprem/config-options#use-vxlan

---

## Post-install reboots & stabilization (strongly recommended)

1. **Control plane first**

   * After Step 4 (init + Calico) shows system pods **Running**, reboot the CP:

     ```bash
     sudo reboot
     ```
   * Wait **10–15 minutes** for components to settle, then verify:

     ```bash
     # on the control plane
     sudo systemctl status containerd kubelet --no-pager
     kubectl get nodes
     kubectl -n kube-system get pods
     ```

2. **Then workers**

   * Complete Steps 1–3 on each worker, run the **kubeadm join**, then reboot each worker:

     ```bash
     sudo reboot
     ```
   * Give it **5–10 minutes**, then confirm:

     ```bash
     kubectl get nodes -o wide
     kubectl -n calico-system get pods -o wide
     ```

> **Still seeing flaps?** Do a **clean-slate reset** (workers → control plane) and re-run the install steps in order.
>
> ```bash
> # WORKERS
> sudo kubeadm reset -f
> sudo rm -rf /etc/cni/net.d /var/lib/cni /var/lib/kubelet/pki ~/.kube
> for i in cni0 vxlan.calico tunl0; do sudo ip link del "$i" 2>/dev/null || true; done
> sudo systemctl restart containerd
>
> # CONTROL PLANE
> sudo kubeadm reset -f
> sudo rm -rf /etc/kubernetes /var/lib/etcd /etc/cni/net.d /var/lib/cni /var/lib/kubelet/pki ~/.kube
> for i in cni0 vxlan.calico tunl0; do sudo ip link del "$i" 2>/dev/null || true; done
> sudo systemctl restart containerd
> ```


---

## Conclusion

You just built a clean, repeatable multi-node Kubernetes **v1.32** cluster with **containerd** and **Calico**. We brought up the control plane first, confirmed it was healthy, then joined workers and validated cross-node traffic with a NodePort service. Along the way you aligned containerd’s cgroups with kubelet, set essential kernel networking flags, and applied Calico in the encapsulation mode you prefer (IP-in-IP or VXLAN) with the right firewall/SG openings.
-->
