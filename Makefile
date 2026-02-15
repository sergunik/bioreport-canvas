COMPOSE=docker-compose

.PHONY: exec build test lint

exec:
	$(COMPOSE) exec app sh

build:
	$(COMPOSE) exec app bun install && $(COMPOSE) exec app bun run build

test:
	$(COMPOSE) exec app bun run test

lint:
	$(COMPOSE) exec app bun run lint