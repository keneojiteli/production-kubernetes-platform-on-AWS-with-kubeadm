### **Bastion Host config**
---

####  **SSH key pair**

**Recommended:** **create the key pair in your cloud provider’s console.**
This is the easiest path because the provider injects your **public key** at boot—no manual copy to `~/.ssh/authorized_keys`.

* **AWS (easy path):** EC2 → **Key Pairs** → **Create key pair** → Type: **ED25519** → download `.pem`

  ```bash
  chmod 400 ~/Downloads/<key-pair-name>.pem
  ssh -i ~/Downloads/<key-pair-name>.pem ubuntu@<PUBLIC_IP_OR_DNS>
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


When connecting (A bastion host deployed in a public subnet is used as the administrative entry point into the infrastructure):

```bash
ssh -i ~/.ssh/kubeadm-demo <username>@<PUBLIC_IP_OR_DNS>
```

Before remote access to control plane and worker nodes, copy keypair from local machine to bastion host, change permission before gaining remote access to nodes via ssh

<!--scp -i project-patsy-keypair.pem project-patsy-keypair.pem ubuntu@ec2-98-92-129-137.compute-1.amazonaws.com:/path/to/copy/keypair-->

```
scp -i /path/to/key/pair.pem username@remote_ip:/path/to/remote/directory/

chmod 400 "<key-pair-name>.pem"
```
---

#### **Instance Spec**

* **OS:** Ubuntu **22.04 or 24.04** LTS (amd64)
* **Sizing:**

  * Bastion: does not need as much memory and storage as control plane and worker nodes
* Place all nodes in the **same VPC** and **routable subnets**.

#### **Update packages**

```
sudo apt update
``` 
---

#### **Hostname** 

Adjust node name based on machine ( reload the current shell so hostname/prompt and new env settings take effect (use 'sudo reboot' if it still doesn’t reflect)) 

```
sudo hostnamectl set-hostname <bastion-host-name>   
exec bash
```   
