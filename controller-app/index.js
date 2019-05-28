const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const IMAGE_VERSION = process.env.IMAGE_VERSION || "latest";
const statefulsetJson = fs.readFileSync('statefulset.json', { encoding: 'utf8' });
const cronjobJson = fs.readFileSync('cronjob.json', { encoding: 'utf8' });
const configMapJson = fs.readFileSync('configmap.json', { encoding: 'utf8' });
const podTemplateSpecJson = fs.readFileSync('pod-template-spec.json', { encoding: 'utf8' });

var app = express();
app.use(bodyParser.json());

app.post('/sync', function (req, res) {
    const parent = req.body.parent;
    const children = req.body.children;
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
});

app.listen(80, () => {
    console.log("Flink controller running!");
});

function getChildren(jobName, spec) {
    const configMapName = `flink-job-jar-${jobName}`;
    const controller = getController(jobName, configMapName, spec);
    const configMap = getConfigMap(configMapName);
    return [configMap, controller];
}

function getController(jobName, configMapName, spec) {
    if (!!spec.streaming) {
        return getStatefulset(jobName, configMapName, spec);
    }

    if (!!spec.cron) {
        return getCronJob(jobName, configMapName, spec);
    }

    console.log(`Job '${jobName}': Must specify either 'streaming' or 'cron' properties in spec. No controller is created for job.`);
}

function getStatefulset(jobName, configMapName, spec) {
    const statefulset = JSON.parse(statefulsetJson);

    statefulset.metadata.name = `flink-job-${jobName}`;
    statefulset.metadata.labels.version = IMAGE_VERSION;
    statefulset.spec.replicas = spec.streaming.replicas;
    statefulset.spec.selector.matchLabels["flink-job"] = jobName;
    statefulset.spec.selector.matchLabels.version = IMAGE_VERSION;
    statefulset.spec.template = getPodTemplateSpec(jobName, configMapName, spec, true);

    return statefulset;
}


function getCronJob(jobName, configMapName, spec) {
    const cronjob = JSON.parse(cronjobJson);

    const name = `flink-job-${jobName}`;
    cronjob.metadata.name = name;
    cronjob.metadata.labels.version = IMAGE_VERSION;
    cronjob.spec.concurrencyPolicy = spec.cron.concurrencyPolicy || 'Allow';
    cronjob.spec.schedule = spec.cron.schedule;
    cronjob.spec.jobTemplate.metadata.name = name;
    cronjob.spec.jobTemplate.metadata.labels.version = IMAGE_VERSION;
    cronjob.spec.jobTemplate.spec.template = getPodTemplateSpec(jobName, configMapName, spec, false);
    delete cronjob.spec.jobTemplate.spec.template.spec.containers[0].livenessProbe;

    return cronjob;
}

function getPodTemplateSpec(jobName, configMapName, spec, streaming) {
    const podTemplateSpec = JSON.parse(podTemplateSpecJson);

    podTemplateSpec.metadata.labels["flink-job"] = jobName;
    podTemplateSpec.metadata.labels.version = IMAGE_VERSION;

    const jarDir = path.dirname(spec.jarPath);
    const jarName = path.basename(spec.jarPath);
    const props = getProps(spec.props);
    const jobProps = props.props;
    const podSpec = podTemplateSpec.spec;

    const jobNameEnv = { "name": "jobName" };

    if (streaming) {
        jobNameEnv.valueFrom = { fieldRef: { fieldPath: "metadata.name" } };
    }
    else {
        jobNameEnv.value = jobName;
    }

    podSpec.containers[0].env = [
        jobNameEnv,
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

    if (streaming) {
        podSpec.containers[0].command = ["/app/start-streaming.sh"];
        podSpec.containers[1].command = ["/app/start-streaming.sh"];
        podSpec.restartPolicy = "Always";
    }
    else {
        podSpec.containers[0].command = ["/app/start-batch.sh"];
        podSpec.containers[1].command = ["/app/start-batch.sh"];
        podSpec.restartPolicy = "Never";
    }

    for (const volumeMount of (spec.volumeMounts || [])) {
        const volumeName = `volume-${Math.floor(Math.random() * 10e10)}`;
        volumeMount.volume.name = volumeName;
        volumeMount.mount.name = volumeName;

        podSpec.volumes.push(volumeMount.volume);
        podSpec.containers[0].volumeMounts.push(volumeMount.mount);
    }

    return podTemplateSpec;
}

function getConfigMap(configMapName) {
    const configMap = JSON.parse(configMapJson);
    configMap.metadata.name = configMapName;
    configMap.metadata.labels.version = IMAGE_VERSION;
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
    return { props: jobProps, env: env };
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
