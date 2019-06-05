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
              'jobManagerUrl',
              'jarImage',
              'jarPath',
              'mainClass',
            ],
            properties: {
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
              streaming: {
                required: [
                  'replicas',
                ],
                properties: {
                  replicas: {
                    minimum: 0,
                    type: 'integer',
                  },
                },
              },
              cron: {
                required: [
                  'schedule',
                ],
                properties: {
                  concurrencyPolicy: {
                    type: 'string',
                  },
                  schedule: {
                    type: 'string',
                  },
                },
              },
              props: {
                type: 'array',
                items: {
                  required: [
                    'key',
                  ],
                  properties: {
                    key: {
                      type: 'string',
                    },
                    value: {
                      type: 'string',
                    },
                    valueFrom: {
                      properties: {
                        secretKeyRef: {
                          properties: {
                            name: {
                              type: 'string',
                            },
                            key: {
                              type: 'string',
                            },
                          },
                        },
                        configMapKeyRef: {
                          properties: {
                            name: {
                              type: 'string',
                            },
                            key: {
                              type: 'string',
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              env: {
                type: 'array',
                items: {},
              },
              volumeMounts: {
                type: 'array',
                items: {
                  required: [
                    'volume',
                    'mount',
                  ],
                  properties: {
                    volume: {},
                    mount: {},
                  },
                },
              },
            },
          },
        },
      },
    },
    additionalPrinterColumns: [
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
  },
}
