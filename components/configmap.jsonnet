local imageVersion = std.extVar('IMAGE_VERSION');
{
  kind: 'ConfigMap',
  apiVersion: 'v1',
  metadata: {
    name: 'flink-controller',
    namespace: 'flink'
  },
  data: {
    'index.js': importstr '../controller-app/index.js',
    'package.json': importstr '../controller-app/package.json',
  },
}
