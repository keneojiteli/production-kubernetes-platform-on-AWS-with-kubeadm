### **Worker Node config**
---

#### **Instance Spec**

* **OS:** Ubuntu **22.04 or 24.04** LTS (amd64)
* **Sizing:**

  * Workers: **1–2 vCPU, 2–4 GB RAM**, 8–20 GB disk
* Place all nodes in the **same VPC** and **routable subnets**.
---

#### **SSH Access**
SSH access to the worker node is established using private IP address from the bastion host.

```bash
ssh -i "<key-pair-name>.pem" <username>@<PRIVATE_IP_OR_DNS>
```

#### **Update packages**

```bash
sudo apt update
``` 
---

#### **Hostname** 

Adjust node name based on machine ( reload the current shell so hostname/prompt and new env settings take effect (use 'sudo reboot' if it still doesn’t reflect)) 

```bash
sudo hostnamectl set-hostname <worker-node-name>  
exec bash
```   
--- 

#### **Disable swap & set kernel networking**

```bash
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


#### **Install and configure containerd**

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

#### **Install kubeadm, kubelet and kubectl (v1.34)**

```bash
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.34/deb/Release.key \
 | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.34/deb/ /' \
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
---

#### **Bash completion (optional, helpful)**

```bash
sudo apt-get update && sudo apt-get install -y bash-completion
echo 'source /usr/share/bash-completion/bash_completion' >> ~/.bashrc
echo 'source <(kubectl completion bash)' >> ~/.bashrc
echo 'alias k=kubectl' >> ~/.bashrc
echo 'complete -F __start_kubectl k' >> ~/.bashrc
source ~/.bashrc
```
---
<!--
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
-->

#### **Join the worker node(s)**

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




