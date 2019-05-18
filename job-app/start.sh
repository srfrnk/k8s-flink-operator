#!/usr/bin/env bash
trap : TERM INT

echo "Waiting for jar..."
until [ -f ${jarPath} ]
do
     sleep 1
done

echo "Starting job... flink run -d -c ${mainClass} -m ${jobManagerUrl} ${jarPath} --jobName ${jobName}"
jobId=$(flink run -d -c ${mainClass} -m ${jobManagerUrl} ${jarPath} --jobName ${jobName} | grep -oP 'JobID \K.*')
echo "Started Job with ID: ${jobId}"
echo ${jobId} > /app/jobId

sleep infinity & wait

echo "Stopping job ${jobId}..."
flink stop -m ${jobManagerUrl} ${jobId}
# echo "Cancelling job ${jobId}... (if not stopped)"
# flink cancel -m ${jobManagerUrl} ${jobId}
echo "Exiting"
