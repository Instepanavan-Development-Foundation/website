deploy: pull build up

pull:
	git pull origin main

build:
	docker buildx build -t server ./server
	docker buildx build -t client ./client

up:
	docker compose -f docker-compose.prod.yml up -d

down:
	docker compose -f docker-compose.prod.yml down

deploy-prod:
	ssh instepanavan "cd ./website && make"

commit-and-deploy:
	git add .
	git commit
	git push origin main
	make deploy-prod
