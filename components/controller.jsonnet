{
  apiVersion: 'metacontroller.k8s.io/v1alpha1',
  kind: 'CompositeController',
  metadata: {
    name: 'flink-controller',
    namespace: 'flink',
  },
  spec: {
    generateSelector: true,
    parentResource: {
      apiVersion: 'operators.srfrnk.com/v1',
      resource: 'flinkjobs',
    },
    childResources: [
      {
        apiVersion: 'apps/v1',
        resource: 'statefulsets',
        updateStrategy: {
          method: 'InPlace',
        },
      },
      {
        apiVersion: 'batch/v1beta1',
        resource: 'cronjobs',
        updateStrategy: {
          method: 'InPlace',
        },
      },
      {
        apiVersion: 'v1',
        resource: 'configmaps',
        updateStrategy: {
          method: 'OnDelete',
        },
      },
    ],
    hooks: {
      sync: {
        webhook: {
          url: 'http://flink-controller.flink/sync',
        },
      },
    },
  },
}
