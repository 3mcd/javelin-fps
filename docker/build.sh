docker build -f ./docker/client.Dockerfile -t registry.digitalocean.com/javelin/javelin-fps-client:latest .
docker build -f ./docker/server.Dockerfile -t registry.digitalocean.com/javelin/javelin-fps-server:latest .
