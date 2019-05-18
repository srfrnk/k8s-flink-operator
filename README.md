# k8s-flink-operator

## Prerequisites

- For `GKE` only - run: `kubectl create clusterrolebinding <user>-cluster-admin-binding --clusterrole=cluster-admin --user=<user>@<domain>`
- Install [metacontroller](https://metacontroller.app/guide/install/) or run `make install-metacontroller`

**Note** To install `metacontroller` you can usually just run these:

```bash
kubectl create namespace metacontroller
kubectl apply -f https://raw.githubusercontent.com/GoogleCloudPlatform/metacontroller/master/manifests/metacontroller-rbac.yaml
kubectl apply -f https://raw.githubusercontent.com/GoogleCloudPlatform/metacontroller/master/manifests/metacontroller.yaml
```

## Installation

Just run the following:

```bash
kubectl apply -f https://raw.githubusercontent.com/srfrnk/k8s-flink-operator/master/dist/flink-controller.yaml
```

## Usage

To use `flink-controller` you need to have:

- A `JAR` containing code that creates a valid `Flink` job
- A `docker image` that contains the `JAR`
- A `K8S` configuration file defining the job

### JAR

Please see the [Example Apache BEAM Pipeline](https://github.com/srfrnk/k8s-flink-operator/tree/master/test) that can run on `Flink`.

- The [main file](https://github.com/srfrnk/k8s-flink-operator/blob/master/test/src/main/java/flink/test/App.java#L5) creates the job.
- `gradle build` creates the `JAR`

### Docker Image

- The [Dockerfile](https://github.com/srfrnk/k8s-flink-operator/blob/master/test/Dockerfile#L3) defines the image
- To build the image inside `minikube`: `eval $(minikube docker-env) && docker build . -t flink-test:v1`
- You can also build locally and push to any repository accessible to your `K8S` cluster

### Configuration Manifest

- The [JSON Manifest](https://github.com/srfrnk/k8s-flink-operator/blob/master/test/flink1job.json) defines the job.
- Can be `YAML` or `JSON`

The spec must include:

- `replicas`: number of jobs to submit simultaneously
- `jobManagerUrl`: Cluster URL to `Flink Job Manager` ("host:port")
- `jarImage`:Full image identifier ("repo/image:tag")
- `jarPath`:Absolute path to `JAR` inside image
- `mainClass`:Full class-name for the job (e.g. "org.example.MyClass")

The following are optional:

- `props`: An array of `{key,value}` props to pass to job. (i.e. via `ParameterTool parameters = ParameterTool.fromArgs(args);`)

The `mainClass` must contain `public static void main(String[] args)` function that runs a `Flink` job.

## Deployment

- Make sure the `JAR` image is accessible to the `K8S` cluster
- Apply configuration manifest: `kubectl apply -f <CONFIGURATION_MANIFEST>`

## Cleanup

- `kubectl delete -f <CONFIGURATION_MANIFEST>`
- `kubectl delete -f https://raw.githubusercontent.com/srfrnk/k8s-flink-operator/master/dist/flink-controller.yaml`
- `kubectl delete -f https://raw.githubusercontent.com/GoogleCloudPlatform/metacontroller/master/manifests/metacontroller-rbac.yaml`
- `kubectl delete -f https://raw.githubusercontent.com/GoogleCloudPlatform/metacontroller/master/manifests/metacontroller.yaml`
- `kubectl delete namespace metacontroller`
