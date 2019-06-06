# k8s-flink-operator

## Prerequisites

* For `GKE` only - run: `kubectl create clusterrolebinding <user>-cluster-admin-binding --clusterrole=cluster-admin --user=<user>@<domain>`
* Install [metacontroller](https://metacontroller.app/guide/install/) or run `make install-metacontroller`

**Note** To install `metacontroller` you can usually just run these:

```bash
kubectl create namespace `metacontroller`
kubectl apply -f https://raw.githubusercontent.com/GoogleCloudPlatform/metacontroller/master/manifests/metacontroller-rbac.yaml
kubectl apply -f https://raw.githubusercontent.com/GoogleCloudPlatform/metacontroller/master/manifests/metacontroller.yaml
```

Optionally you can use the following to reduce log flood coming from `Metacontroller`:

```bash
kubectl apply -f https://raw.githubusercontent.com/srfrnk/metacontroller/master/manifests/metacontroller.yaml
```

## Installation

Just run the following:

```bash
kubectl apply -f https://raw.githubusercontent.com/srfrnk/k8s-flink-operator/master/dist/flink-controller.yaml
```

## Usage

To use `flink-controller` you need to have:

* A `JAR` containing code that creates a valid `Flink` job
* A `docker image` that contains the `JAR`
* A `K8S` configuration file defining the job

### JAR

Please see the [Example Apache BEAM Pipeline](https://github.com/srfrnk/k8s-flink-operator/tree/master/test) that can run on `Flink`.

* The [main file](https://github.com/srfrnk/k8s-flink-operator/blob/master/test/src/main/java/flink/test/App.java#L5) creates the job.
* `gradle build` creates the `JAR`

### Docker Image

* The [Dockerfile](https://github.com/srfrnk/k8s-flink-operator/blob/master/test/Dockerfile#L3) defines the image
* To build the image inside `minikube`: `eval $(minikube docker-env) && docker build . -t flink-test:v1`
* You can also build locally and push to any repository accessible to your `K8S` cluster

### Configuration Manifest

* The [JSON Manifest](https://github.com/srfrnk/k8s-flink-operator/blob/master/test/flink1job.json) defines the job.
* Can be `YAML` or `JSON`

The spec must include:

* `jobManagerUrl`: Cluster URL to `Flink Job Manager` ("host:port")
* `jarImage`:Full image identifier ("repo/image:tag")
* `jarPath`:Absolute path to `JAR` inside image
* `mainClass`:Full class-name for the job (e.g. "org.example.MyClass")
* Either `streaming` or `cron` : For streaming job or batch job

`streaming` should include

* `replicas`: number of jobs to submit simultaneously

`cron` should include

* `schedule`: The schedule in Cron format. [See here](https://en.wikipedia.org/wiki/Cron)
* `concurrencyPolicy`: Specifies how to treat concurrent executions of a Job. Valid values are: - "Allow" (default): allows CronJobs to run concurrently; - "Forbid": forbids concurrent runs, skipping next run if previous run hasn't finished yet; - "Replace": cancels currently running job and replaces it with a new one. [See here](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.14/#cronjobspec-v1beta1-batch)

The following are optional:

* `version`: A string with the version label to be added to all k8s resources. If no `version` is specified a label with `NoVersion` would be added.
* `props`: An array of `{key,value}` props to pass to job. (i.e. via `ParameterTool parameters = ParameterTool.fromArgs(args);`)
* `volumeMounts`: An array of `volume specs` (See below).
* `env`: An array of [EnvVars](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.14/#envvar-v1-core).

`volume specs` have the following parameters:

* `volume`: a [Volume spec](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.14/#volume-v1-core).
* `mount`: a [VolumeMount spec](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.14/#volumemount-v1-core).

**Note:** both `volume` and `mount` don't need to have a `name`. Any given `name` would be overwritten.

The `mainClass` must contain `public static void main(String[] args)` function that runs a `Flink` job.

## Deployment

* Make sure the `JAR` image is accessible to the `K8S` cluster
* Apply configuration manifest: `kubectl apply -f <CONFIGURATION_MANIFEST>`

## Cleanup

* `kubectl delete -f <CONFIGURATION_MANIFEST>`
* `kubectl delete -f https://raw.githubusercontent.com/srfrnk/k8s-flink-operator/master/dist/flink-controller.yaml`
* `kubectl delete -f https://raw.githubusercontent.com/GoogleCloudPlatform/metacontroller/master/manifests/metacontroller-rbac.yaml`
* `kubectl delete -f https://raw.githubusercontent.com/GoogleCloudPlatform/metacontroller/master/manifests/metacontroller.yaml`
* `kubectl delete namespace metacontroller`
