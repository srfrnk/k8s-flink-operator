#!/usr/bin/env bash
echo "Checking health:"
if [[ -f /app/jobId ]]
then
    jobId=$(cat /app/jobId)
    echo "Checking job ${jobId}..."
    count=$(flink list -m ${jobManagerUrl} -r | grep -e ": ${jobId} :" | wc -l)
    if [[ ${count} -gt 0 ]]
        then echo "Job running.";exit 0
        else echo "Job missing.";exit 1
    fi
else
    echo "Job not yet started!"
    exit 0 # Job has not yet started - report as healthy (Issue #1)
fi
