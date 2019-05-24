FORCE:

deploy-minikube: TIMESTAMP=$(shell date +%y%m%d-%H%M -u)
deploy-minikube: FORCE
	kubectl apply -f flink.json
	gradle build
	eval $$(minikube docker-env) && docker build . -t flink-test:${TIMESTAMP}
	cat flink1job.json | sed "s/IMAGE_VERSION/${TIMESTAMP}/" | kubectl apply -f -
