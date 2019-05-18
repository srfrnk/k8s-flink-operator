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
        apiVersion: 'v1',
        resource: 'pods',
        updateStrategy: {
          method: 'RollingRecreate',
          statusChecks: {
            conditions: [
              {
                type: 'Ready',
                status: 'True',
              },
            ],
          },
        },
      },
      {
        apiVersion: 'v1',
        resource: 'configmaps',
        updateStrategy: {
          method: 'Recreate',
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