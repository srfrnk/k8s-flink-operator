var express = require('express');
var bodyParser = require('body-parser');

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
        "children": [
            {
                "apiVersion": "v1",
                "kind": "Pod",
                "metadata": {
                    "name": parent.spec.mainclass
                },
                "spec": {
                    "restartPolicy": "OnFailure",
                    "containers": [
                        {
                            "name": "hello",
                            "image": "busybox",
                            "command": ["echo", "Hello, %s!"]
                        }
                    ]
                }
            }
        ]
    });
});
app.all("**", (req, res) => {
    console.log(JSON.stringify(req.body));
    res.json({});
})
app.listen(80, () => {
    console.log("Flink controller running!");
});
