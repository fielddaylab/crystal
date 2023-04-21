make: build
	
build: run
	
run:
	open ./index.html

server:
	python -m SimpleHTTPServer >/dev/null 2>&1 &

deploy:
	rsync -vrc * tyg@theyardgames.org:/httpdocs/game/crystal --exclude-from rsync-exclude
