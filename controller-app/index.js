const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const IMAGE_VERSION = process.env.IMAGE_VERSION || "latest";
const statefulsetJson = fs.readFileSync('statefulset.json', { encoding: 'utf8' });
const configMapJson = fs.readFileSync('configmap.json', { encoding: 'utf8' });

var app = express();
app.use(bodyParser.json());

app.post('/sync', function (req, res) {
    const parent = req.body.parent;
    // const children = req.body.children;
    const response = {
        "status": {},
        "children": getChildren(parent.metadata.name, parent.spec)
    };
    console.log(JSON.stringify({ type: "SYNC", req: req.body, res: response }), ",");
    res.json(response);
});

app.all("**", (req, res) => {
    console.log(JSON.stringify({ type: "CATCHALL", req: req.body, res: {} }));
    res.json({});
})

app.listen(80, () => {
    console.log("Flink controller running!");
});

function getChildren(jobName, spec) {
    const configMapName = `flink-job-jar-${jobName}`;
    const statefulset = getStatefulset(jobName, configMapName, spec);
    const configMap = getConfigMap(configMapName);
    return [configMap, statefulset];
}

function getStatefulset(jobName, configMapName, spec) {
    const jarDir = path.dirname(spec.jarPath);
    const jarName = path.basename(spec.jarPath);
    const statefulset = JSON.parse(statefulsetJson);

    statefulset.metadata.name = `flink-job-${jobName}`;
    statefulset.metadata.labels.version = IMAGE_VERSION;
    statefulset.spec.replicas = spec.replicas;
    statefulset.spec.selector["flink-job"] = jobName;
    statefulset.spec.selector.version = IMAGE_VERSION;
    statefulset.spec.template.metadata["flink-job"] = jobName;
    statefulset.spec.template.metadata.version = IMAGE_VERSION;

    const props = getProps(spec.props);
    jobProps = props.props;
    podSpec = statefulset.spec.template.spec;
    podSpec.containers[0].env = [
        {
            "name": "jobName",
            "value": jobName
        },
        {
            "name": "jobManagerUrl",
            "value": spec.jobManagerUrl
        },
        {
            "name": "jarPath",
            "value": `/jar/${jarName}`
        },
        {
            "name": "mainClass",
            "value": spec.mainClass
        },
        {
            "name": "jobProps",
            "value": jobProps
        },
        ...props.env
    ];
    podSpec.containers[1].env = [
        {
            "name": "jarDir",
            "value": jarDir
        },
        {
            "name": "jarName",
            "value": jarName
        }
    ];
    podSpec.containers[0].image = `srfrnk/flink-job-app:${IMAGE_VERSION}`;
    podSpec.containers[1].image = spec.jarImage;
    podSpec.volumes[0].configMap.name = configMapName;
    return statefulset;
}

function getConfigMap(configMapName) {
    const configMap = JSON.parse(configMapJson);
    configMap.metadata.name = configMapName;
    return configMap;
}

function getProps(specProps) {
    const props = [];
    const env = [];

    for (const prop of specProps) {
        let key = prop.key;
        let value = prop.value;
        if (!!prop.valueFrom) {
            const valueFrom = prop.valueFrom;
            if (!!valueFrom.configMapKeyRef) {
                value = getRefValue(env, key, "configMapKeyRef", valueFrom.configMapKeyRef);
            }
            else if (!!valueFrom.secretKeyRef) {
                value = getRefValue(env, key, "secretKeyRef", valueFrom.secretKeyRef);
            }
        }
        props.push({
            key: key,
            value: value
        });
    }

    const jobProps = props.map(prop => `--${prop.key} ${prop.value}`).join(' ');
    return { props: jobProps, env: env }
}

function getRefValue(env, key, type, ref) {
    const envKey = `jobProps_${key}_${type}_${ref.name}_${ref.key}`.replace(/[\-\$]/gi, '_');
    env.push({
        "name": envKey,
        "valueFrom": {
            [type]: {
                "name": ref.name,
                "key": ref.key,
            }
        }
    });
    return `$\{${envKey}\}`;
}
