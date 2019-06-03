FORCE:

install-metacontroller: FORCE
	kubectl create namespace metacontroller
	kubectl apply -f https://raw.githubusercontent.com/GoogleCloudPlatform/metacontroller/master/manifests/metacontroller-rbac.yaml
	kubectl apply -f https://raw.githubusercontent.com/GoogleCloudPlatform/metacontroller/master/manifests/metacontroller.yaml

deploy-minikube: TIMESTAMP=$(shell date +%y%m%d-%H%M -u)
deploy-minikube: FORCE
	eval $$(minikube docker-env) && docker build controller-app -t srfrnk/flink-controller-app:${TIMESTAMP}
	eval $$(minikube docker-env) && docker build job-app -t srfrnk/flink-job-app:${TIMESTAMP}
	ks env set minikube --server=https://$$(minikube ip):8443
	ks apply minikube -V IMAGE_VERSION=$(TIMESTAMP)

test-minikube: FORCE
	make -C test deploy-minikube

publish: TIMESTAMP=$(shell date +%y%m%d-%H%M -u)
publish: FORCE
	docker build controller-app -t srfrnk/flink-controller-app:${TIMESTAMP}
	docker build job-app -t srfrnk/flink-job-app:${TIMESTAMP}

	docker push srfrnk/flink-controller-app:${TIMESTAMP}
	docker push srfrnk/flink-job-app:${TIMESTAMP}

	ks show publish -V IMAGE_VERSION=$(TIMESTAMP) > dist/flink-controller.yaml
