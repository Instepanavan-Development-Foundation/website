deploy: pull build up

pull:
	git pull origin main

build:
	docker buildx build -t client ./client
	docker buildx build -t server ./server
	docker buildx build -t telegram-bot ./telegram-bot
	docker buildx build -t rss-publisher ./rss-publisher

test:
	cd server && npm install && npm test

up:
	docker compose -f docker-compose.prod.yml up -d
	# nginx resolves upstream container IPs only at startup; recreated containers get new IPs (502s otherwise)
	docker compose -f docker-compose.prod.yml exec -T nginx nginx -s reload

down:
	docker compose -f docker-compose.prod.yml down

deploy-prod:
	ssh chol "cd ~/instepanavan/website && make deploy"

commit-and-deploy:
	git add .
	git commit
	git push origin main
	make deploy-prod

backup:
	@echo "🔄 Starting full backup of production server..."
	@./scripts/backup-prod-db.sh
	@echo ""
	@./scripts/backup-prod-db-volume.sh
	@echo ""
	@./scripts/backup-prod-files.sh
	@echo ""
	@echo "✅ All backups completed successfully!"
