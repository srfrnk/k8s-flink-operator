#!/usr/bin/env bash
jobId=$(cat /app/jobId)
echo "Checking job ${jobId}..."
count=$(flink list -m ${jobManagerUrl} -r | grep -e ": ${jobId} :" | wc -l)
if [[ ${count} -gt 0 ]]
then exit 0
else exit 1
fi
