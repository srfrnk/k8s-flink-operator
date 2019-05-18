{
  apiVersion: 'apiextensions.k8s.io/v1beta1',
  kind: 'CustomResourceDefinition',
  metadata: {
    name: 'flinkjobs.operators.srfrnk.com',
    namespace: 'flink',
  },
  spec: {
    group: 'operators.srfrnk.com',
    version: 'v1',
    scope: 'Namespaced',
    names: {
      kind: 'FlinkJob',
      plural: 'flinkjobs',
      singular: 'flinkjob',
      shortNames: [
        'flink',
        'flinks',
      ],
    },
    validation: {
      openAPIV3Schema: {
        required: [
          'spec',
        ],
        properties: {
          spec: {
            required: [
              'replicas',
              'jobManagerUrl',
              'jarImage',
              'jarPath',
              'mainClass',
            ],
            properties: {
              replicas: {
                minimum: 0,
                type: 'integer',
              },
              jobManagerUrl: {
                type: 'string',
              },
              jarImage: {
                type: 'string',
              },
              jarPath: {
                type: 'string',
              },
              mainClass: {
                type: 'string',
              },
            },
          },
        },
      },
    },
    additionalPrinterColumns: [
      {
        name: 'Replicas',
        type: 'integer',
        description: 'Number of job replicas',
        JSONPath: '.spec.replicas',
      },
      {
        name: 'Age',
        type: 'date',
        description: 'Time since object was created',
        JSONPath: '.metadata.creationTimestamp',
      },
    ],
    subresources: {
      status: {},
      scale: {
        specReplicasPath: '.spec.replicas',
        statusReplicasPath: '.status.replicas',
        labelSelectorPath: '.status.labelSelector',
      },
    },
    categories: [
      'all',
    ],
  },
}
