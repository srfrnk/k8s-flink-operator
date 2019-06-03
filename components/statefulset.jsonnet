local params = std.extVar('__ksonnet/params').components.statefulset;
local imageVersion = std.extVar('IMAGE_VERSION');
{
  apiVersion: 'apps/v1',
  kind: 'StatefulSet',
  metadata: {
    name: 'flink-controller',
    namespace: 'flink',
    labels: {
      version: imageVersion,
    },
  },
  spec: {
    replicas: 1,
    serviceName: 'flink-controller',
    selector: {
      matchLabels: {
        app: 'flink-controller',
      },
    },
    template: {
      metadata: {
        labels: {
          app: 'flink-controller',
          version: imageVersion,
        },
      },
      spec: {
        containers: [
          {
            name: 'controller',
            image: 'srfrnk/flink-controller-app:' + imageVersion,
            env: [
              {
                name: 'IMAGE_VERSION',
                value: imageVersion,
              },
              {
                name: 'DEBUG_LOG',
                value: params.DEBUG_LOG,
              },
            ],
            command: [
              'bash',
              '-c',
            ],
            args: [
              'npm start',
            ],
            ports: [
              {
                containerPort: 80,
              },
            ],
            resources: {
              requests: {
                cpu: '10m',
                memory: '10Mi',
              },
              limits: {
                cpu: '100m',
                memory: '100Mi',
              },
            },
          },
        ],
      },
    },
  },
}
