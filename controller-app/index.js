const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const IMAGE_VERSION = process.env.IMAGE_VERSION || "latest";
const podJson = fs.readFileSync('pod.json', { encoding: 'utf8' });
const configMapJson = fs.readFileSync('configmap.json', { encoding: 'utf8' });

var app = express();
app.use(bodyParser.json());

app.post('/sync', function (req, res) {
    console.log(JSON.stringify(req.body));
    const parent = req.body.parent;
    const children = req.body.children;
    res.json({
        "status": {
            "pods": children["Pod.v1"].length
        },
        "children": getChildren(parent.metadata.name, parent.spec)
    });
});

app.all("**", (req, res) => {
    console.log(JSON.stringify(req.body));
    res.json({});
})

app.listen(80, () => {
    console.log("Flink controller running!");
});

function getChildren(jobName, spec) {
    const pods = Array(spec.replicas).fill(0).map((x, i) => getPod(`${jobName}-${i + 1}`, spec));
    const configMap = getConfigMap();
    return [configMap, ...pods];
}

function getPod(jobName, spec) {
    const jarDir = path.dirname(spec.jarPath);
    const jarName = path.basename(spec.jarPath);
    const pod = JSON.parse(podJson);
    pod.metadata.labels.version = IMAGE_VERSION;
    pod.metadata.name = jobName;
    const props = getProps(spec.props);
    jobProps = props.props;
    pod.spec.containers[0].env = [
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
    pod.spec.containers[1].env = [
        {
            "name": "jarDir",
            "value": jarDir
        },
        {
            "name": "jarName",
            "value": jarName
        }
    ];
    pod.spec.containers[0].image = `srfrnk/flink-job-app:${IMAGE_VERSION}`;
    pod.spec.containers[1].image = spec.jarImage;
    return pod;
}

function getConfigMap() {
    const configMap = JSON.parse(configMapJson);
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
