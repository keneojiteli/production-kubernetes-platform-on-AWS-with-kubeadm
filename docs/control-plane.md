### **Control Plane config**
---

#### **Instance Spec**

* **OS:** Ubuntu **22.04 or 24.04** LTS (amd64)
* **Sizing:**

  * Control plane: **2 vCPU, 4–8 GB RAM**, 20 GB disk (8 GB works for quick demos)
* Place all nodes in the **same VPC** and **routable subnets**.

#### **SSH Access**
SSH access to the control plane is established using private IP address from the bastion host.

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
sudo hostnamectl set-hostname <control-plane-name>   
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

#### **Initialize control plane**

Replace with your control plane node's private IP

```bash
sudo kubeadm init \
  --control-plane-endpoint=<CP_PRIVATE_IP>:6443 \
  --apiserver-advertise-address=<CP_PRIVATE_IP> \
  --pod-network-cidr=192.168.0.0/16
```

```bash
# Kubeconfig for the current user to start using cluster
mkdir -p $HOME/.kube
sudo cp /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```
**Why:**

* **`--control-plane-endpoint`** is the address other nodes/clients use.
* **`--apiserver-advertise-address`** is the local IP the API server binds to.
* **Pod CIDR** must match your CNI (we’ll use 192.168.0.0/16 with Calico).

<!--
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
-->


#### **Step 5: Install Calico** 

```bash
kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/v3.32.0/manifests/tigera-operator.yaml

cat <<'EOF' | kubectl apply -f -
apiVersion: operator.tigera.io/v1   # Calico Operator API group/version
kind: Installation                  # Cluster-wide Calico install spec
metadata:
  name: default                     # Must be named 'default' (singleton)
spec:
  calicoNetwork:                    # Calico networking settings
    bgp: Disabled
    nodeAddressAutodetectionV4:
      cidrs:
        - 10.0.1.0/24               # Private subnet CIDR where nodes will be
        - 10.0.2.0/24               # Private subnet CIDR where nodes will be
    ipPools:
      - cidr: 192.168.0.0/16        # Pod CIDR (matches kubeadm --pod-network-cidr)
        natOutgoing: Enabled        # SNAT pod→external traffic at node egress
        blockSize: 26               # Per-node IP block size (/26 = 64 pod IPs)
        encapsulation: VXLAN
        nodeSelector: all()         # Apply this pool to all nodes
EOF
```

**Why:**

<!--* This is the **official, operator-managed install**—simple now and easier to upgrade later.-->
* The provided `custom-resources.yaml` applies **sensible defaults** that work with kubeadm clusters (including the `192.168.0.0/16` pod network used here), so **no customization is required**.
* Once installed, Calico provides **networking for pods and Services**, allowing system pods (like CoreDNS) and your apps to start communicating.

---

