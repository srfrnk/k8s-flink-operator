FORCE:

deploy-minikube: FORCE
	gradle build
	eval $$(minikube docker-env) && docker build . -t flink-test:v1
	kubectl apply -f flink1job.json
