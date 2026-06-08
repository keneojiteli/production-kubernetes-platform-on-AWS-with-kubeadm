#### **Validate Cluster Networking**

Verify nodes and pods are up and running, then I created test pods to test DNS and pod-to-pod (create 2 pods, exec into first pod and ping the second pod with the pod IP from the current pod).

```bash
# See nodes and pods
kubectl get nodes -o wide
kubectl get pods -A -o wide
```
``` bash
kubectl run test --image=busybox --restart=Never -it --rm -- sh
nslookup kubernetes.default.svc.cluster.local
```
---

#### **Install Gateway API CRDs**

```bash
# Install standard Gateway API CRDs

kubectl apply --server-side=true -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.5.0/standard-install.yaml

# Install AWS Load Balancer Controller Gateway-specific CRDs

kubectl apply -f https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/refs/heads/main/config/crd/gateway/gateway-crds.yaml

# Validate

kubectl get crd | grep gateway
```

#### **Install AWS Load Balancer Controller**

```bash
# Add Helm repo:

helm repo add eks https://aws.github.io/eks-charts
helm repo update

# Install AWS Load Balancer Controller:

helm upgrade --install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=kubeadm-cluster \
  --set region=<AWS_REGION> \
  --set vpcId=<VPC_ID> \
  --set serviceAccount.create=true \
  --set serviceAccount.name=aws-load-balancer-controller \
  --set rbac.create=true \
  --set featureGates.ALBGatewayAPI=true

# Validate:

kubectl get pods -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller
kubectl logs -n kube-system deployment/aws-load-balancer-controller --tail=100
```
---

#### **Deploy and Expose NGINX**

```bash
# Create deployment
kubectl create deployment nginx-demo --image=nginx:stable --port=80
kubectl scale deployment nginx-demo --replicas=2

# Expose as NodePort
kubectl expose deployment nginx-demo \
  --name=nginx-demo \
  --port=80 \
  --target-port=80 \
  --type=NodePort

# Validate
kubectl get pods -o wide
kubectl get svc nginx-demo -o wide
kubectl get endpoints nginx-demo
```
---

#### **Configure Gateway API**

```bash
# Create internet-facing LoadBalancerConfiguration

cat <<'EOF' | kubectl apply -f -
apiVersion: gateway.k8s.aws/v1beta1
kind: LoadBalancerConfiguration
metadata:
  name: public-alb-config
  namespace: default
spec:
  scheme: internet-facing
  ipAddressType: ipv4
  loadBalancerSubnets:
    - identifier: <PUBLIC_SUBNET_ID_1>
    - identifier: <PUBLIC_SUBNET_ID_2>
EOF

# Create GatewayClass

cat <<'EOF' | kubectl apply -f -
apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: aws-alb
spec:
  controllerName: gateway.k8s.aws/alb
  parametersRef:
    group: gateway.k8s.aws
    kind: LoadBalancerConfiguration
    name: public-alb-config
    namespace: default
EOF

# Create Gateway

cat <<'EOF' | kubectl apply -f -
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: public-web-gateway
  namespace: default
spec:
  gatewayClassName: aws-alb
  listeners:
    - name: http
      protocol: HTTP
      port: 80
      allowedRoutes:
        namespaces:
          from: Same
EOF

# Create HTTPRoute

cat <<'EOF' | kubectl apply -f -
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: nginx-demo-route
  namespace: default
spec:
  parentRefs:
    - name: public-web-gateway
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /
      backendRefs:
        - name: nginx-demo
          port: 80
EOF

# Validate

kubectl get gatewayclass
kubectl describe gateway public-web-gateway
kubectl describe httproute nginx-demo-route

#Expected

#GatewayClass Accepted=True
#Gateway Programmed=True
#HTTPRoute Accepted=True
#HTTPRoute ResolvedRefs=True
```
---

#### **Validate Browser Access**

```bash
# Get ALB DNS

kubectl get gateway public-web-gateway -o wide
kubectl describe gateway public-web-gateway

# Open in browser

http://<ALB_DNS_NAME>

# Expected result

# Welcome to nginx!
```