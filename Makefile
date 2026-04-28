.PHONY: test typecheck build start clean

test:
	npx vitest run

test:watch:
	npx vitest

typecheck:
	npx tsc --noEmit

build:
	npx tsc

start:
	npx tsx src/index.ts

clean:
	rm -rf dist
