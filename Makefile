deploy: pull build up

pull:
	git pull origin main

build:
	docker buildx build -t client ./client
	docker buildx build -t server ./server

up:
	docker compose -f docker-compose.prod.yml up -d

down:
	docker compose -f docker-compose.prod.yml down

deploy-prod:
	ssh instepanavan "cd ./website && make deploy"

commit-and-deploy:
	git add .
	git commit
	git push origin main
	make deploy-prod
