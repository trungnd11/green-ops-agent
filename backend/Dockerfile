FROM gradle:8.10.2-jdk17 AS build
WORKDIR /app
COPY . .
RUN gradle bootJar -x test --no-daemon

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/bootstrap/build/libs/bootstrap-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
