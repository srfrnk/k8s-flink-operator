#!/usr/bin/env bash
trap : TERM INT

echo "Waiting for jar..."
until [ -f ${jarPath} ]
do
     sleep 1
done

jobProps=$(eval echo "${jobProps}")
echo "Starting job... flink run -d -c ${mainClass} -m ${jobManagerUrl} ${jarPath} --jobName ${jobName} ${jobProps}"
jobRun=$(flink run -d -c ${mainClass} -m ${jobManagerUrl} ${jarPath} --jobName ${jobName} ${jobProps})

echo ""
echo ${jobRun}
echo ""

jobId=$(echo ${jobRun} | grep -oP 'JobID \K[a-z0-9]*' | head -n1)
echo "Started Job with ID: ${jobId}"
echo ${jobId} > /app/jobId

sleep infinity & wait

echo "Stopping job ${jobId}..."
flink stop -m ${jobManagerUrl} ${jobId}
echo "Exiting"
