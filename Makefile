FORCE:

install-metacontroller: FORCE
	-kubectl create namespace metacontroller
	kubectl apply -f https://raw.githubusercontent.com/GoogleCloudPlatform/metacontroller/master/manifests/metacontroller-rbac.yaml
	kubectl apply -f https://raw.githubusercontent.com/srfrnk/metacontroller/master/manifests/metacontroller.yaml

deploy-minikube: TIMESTAMP=$(shell date +%y%m%d-%H%M -u)
deploy-minikube: FORCE
	eval $$(minikube docker-env) && docker build controller-app -t srfrnk/flink-controller-app:${TIMESTAMP}
	eval $$(minikube docker-env) && docker build job-app -t srfrnk/flink-job-app:${TIMESTAMP}
	export IMAGE_VERSION=$(TIMESTAMP) && kustomize build environments/minikube | kubectl apply

test-minikube: FORCE
	make -C test deploy-minikube

publish: TIMESTAMP=$(shell date +%y%m%d-%H%M -u)
publish: FORCE
	docker build controller-app -t srfrnk/flink-controller-app:${TIMESTAMP}
	docker build job-app -t srfrnk/flink-job-app:${TIMESTAMP}
	docker push srfrnk/flink-controller-app:${TIMESTAMP}
	docker push srfrnk/flink-job-app:${TIMESTAMP}
	export IMAGE_VERSION=$(TIMESTAMP) && kustomize build environments/publish > dist/flink-controller.yaml

proxy:
	kubectl port-forward svc/flink-jobmanager 8081:8081
