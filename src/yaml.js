const yaml = `apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: tuopu-mysql
  labels:
    k8s-app: tuopu-mysql
spec:
  replicas: 1
  strategy:
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 1
    type: RollingUpdate
  template:
    metadata:
      labels:
        k8s-app: tuopu-mysql
    spec:
      containers:
      - image: daocloud.io/mysql:latest
        name: tuopu-mysql
        resources:
          limits:
            cpu: 1
            memory: 1073741824

---
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: tuopu-redis
  labels:
    k8s-app: tuopu-mysql
spec:
  replicas: 1
  strategy:
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 1
    type: RollingUpdate
  template:
    metadata:
      labels:
        k8s-app: tuopu-redis
    spec:
      containers:
      - image: daocloud.io/redis:latest
        name: tuopu-redis
        resources:
          limits:
            cpu: 2
            memory: 107374824

---
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: tuopu-config-center
  labels:
    k8s-app: tuopu-config-center
spec:
  replicas: 1
  strategy:
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 1
    type: RollingUpdate
  template:
    metadata:
      labels:
        k8s-app: tuopu-config-center
    spec:
      containers:
      - image: daocloud.io/config-center:latest
        name: tuopu-config-center
        resources:
          limits:
            cpu: 5
            memory: 1073231824

---
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: tuopu-app
  labels:
    k8s-app: tuopu-app
  annotations:
    io.daocloud.dce/depend-on:
    - tuopu-mysql
    - tuopu-redis
    - tuopu-config-center
spec:
  replicas: 1
  strategy:
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 1
    type: RollingUpdate
  template:
    metadata:
      labels:
        k8s-app: tuopu-app
    spec:
      containers:
      - image: daocloud.io/app:latest
        name: app
        resources:
          limits:
            cpu: 12323
            memory: 1073741824`

export default yaml;
