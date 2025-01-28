deploy: pull build up

pull:
	git pull origin main

build:
	docker build -t server ./server
	docker build -t client ./client

up:
	docker compose -f docker-compose.prod.yml up -d

down:
	docker compose -f docker-compose.prod.yml down

