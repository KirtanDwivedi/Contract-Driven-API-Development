# docker commands:

``` bash
docker run -it --name my-ubuntu ubuntu // Image
docker exec -it container-name bash // Access Running Container
```
``` bash
docker run -p 8080:80 nginx // port mapping
docker run -e APP_COLOR=blue -e DB_HOST=localhost ubuntu // environment variable
```

### Docker Networks
``` bash
docker network ls -a // -a for all even the stopped one
docker run --network host nginx // host dont need port mapping
docker run --network bridge nginx
docker network create -d bridge --subnet=192.168.0.0/16 --gateway=192.168.0.1 custom-network // create custom network

// run network
docker run -d --name db --network custom-network mongo
docker run -d --name web --network custom-network my-web-app
```

``` bash
docker run -v /path/on/host:/path/in/container nginx // volume mounting
```

### Docker compose -- multiple containers at same time
``` bash
docker compose up // to build and run
docker compose down // to stop and remove
```

### to check how many container running on bridge
``` bash
docker network ls
#docker network inspect bridge
docker run --it --network=host mongo
```

# docker container patterns

### **Sidecar Pattern** : Involves running a small, helper container alongside the main application container. The sidecar handles tasks like logging, monitoring resources (CPU/memory), or collecting metrics.
### **Adapter Pattern** : Useful for bridging the gap between a legacy application container and modern requirements (like adding GraphQL support). The adapter container acts as an interface that intercepts calls for the older system.
### **Ambassador Pattern** : Simplifies network communication in microservices by offloading external calls to a sidecar proxy. This abstracts network complexity and manages routing to other services.
### **Work Queue Pattern** : Enables scalable background processing by using a queue (like RabbitMQ) to distribute incoming tasks or jobs to multiple consumer containers, allowing for parallel execution.
### **Init Pattern** : Uses a temporary container that runs before the main application. It is primarily used for database migrations or environment pre-checks; once finished, the init container exits, and the main application starts.
