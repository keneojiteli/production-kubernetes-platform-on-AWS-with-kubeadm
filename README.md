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

<!--## Repository Structure

Work in Progress -->
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
kubeadm-production-platform/
│
├── infrastructure/
│   └── terraform/
│       ├── modules/
│       ├── environments/
│       └── README.md
│
├── kubernetes/
│   ├── bootstrap/
│   ├── calico/
│   ├── gateway-api/
│   ├── aws-load-balancer-controller/
│   └── workloads/
│
├── docs/
│   ├── phase-1-platform-build.md
│   ├── troubleshooting-notes.md
│   └── architecture/
│
├── images/
│   ├── architecture/
│   ├── screenshots/
│   └── debugging/
│
└── README.md
---
quiz-app/
├── frontend/
├── backend/
├── .github/
│   └── workflows/
│       └── ci-build-scan-push.yml
│
├── deploy/
│   ├── ec2-compose/
│   │   ├── docker-compose.prod.yml
│   │   ├── nginx.conf
│   │   ├── backend.env.example
│   │   ├── deploy.sh
│   │   ├── rollback.sh
│   │   └── README.md
│   │
│   └── kubernetes/
│       ├── base/
│       ├── overlays/
│       └── README.md
│
├── docs/
│   ├── kubeadm-platform.md
│   ├── ec2-compose-deployment.md
│   └── troubleshooting.md
└── README.md
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
| [Bastion host](docs/bastion-host.md) | Bastion host config |
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
## References


* **Installing kubeadm (version-pinned via pkgs.k8s.io)** — [Kubernetes docs: Install kubeadm](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/install-kubeadm/) *(kubernetes.io)*
* **Container runtimes (kernel modules/sysctls)** — [Kubernetes docs: Container runtimes](https://kubernetes.io/docs/setup/production-environment/container-runtimes/) *(kubernetes.io)*
* **Kubelet ↔ runtime cgroup driver (systemd)** — [Kubernetes docs: Configure cgroup driver](https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/configure-cgroup-driver/) *(kubernetes.io)*
* **Change Kubernetes package repository (pin a minor)** — [Kubernetes docs: Change package repository](https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/change-package-repository/) *(kubernetes.io)*
* **Kubernetes Services & NodePort** — [Kubernetes docs: Service](https://kubernetes.io/docs/concepts/services-networking/service/) *(kubernetes.io)*
* **Kubernetes ports & protocols (APIs, components, CNIs, etc.)** — [Kubernetes docs: Ports and protocols](https://kubernetes.io/docs/reference/networking/ports-and-protocols/) *(kubernetes.io)*
* **`kubeadm reset` (what gets cleaned up)** — [Kubernetes docs: kubeadm reset](https://kubernetes.io/docs/reference/setup-tools/kubeadm/kubeadm-reset/) *(kubernetes.io)*
* **Calico system/network requirements (ports & protocols)** — [Calico docs: Kubernetes requirements](https://docs.tigera.io/calico/latest/getting-started/kubernetes/requirements) *(docs.tigera.io)*
* **Calico install (operator/manifest) on self-managed clusters** — [Calico docs: On-premises install](https://docs.tigera.io/calico/latest/getting-started/kubernetes/self-managed-onprem/onpremises) *(docs.tigera.io)*

---

## Connect

If you are working on Kubernetes, cloud infrastructure, platform engineering, or DevOps, I would love to connect and exchange ideas.

Feel free to:

- Open an Issue
- Submit a Pull Request
- Reach out on [LinkedIn](https://www.linkedin.com/in/kenechukwuojiteli/)

---

⭐ If you found this project useful, consider giving the repository a star.

---