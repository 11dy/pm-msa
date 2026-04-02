FROM eclipse-temurin:25-jdk AS build

WORKDIR /app
COPY . .
RUN chmod +x gradlew && ./gradlew :eureka-server:bootJar --no-daemon

FROM eclipse-temurin:25-jre

WORKDIR /app
COPY --from=build /app/eureka-server/build/libs/*.jar app.jar

EXPOSE 8761

ENTRYPOINT ["java", "-jar", "app.jar"]
