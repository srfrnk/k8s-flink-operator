{
  apiVersion: 'v1',
  kind: 'Service',
  metadata: {
    name: 'flink-controller',
    namespace: 'flink',
  },
  spec: {
    selector: {
      app: 'flink-controller',
    },
    ports: [
      {
        port: 80,
      },
    ],
  },
}
