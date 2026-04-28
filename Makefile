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

repl:
	npx tsx src/repl.ts

demo:
	npx tsx demos/jake-archibald.ts

repl-demo:
	npx tsx demos/repl-demo.ts

clean:
	rm -rf dist
