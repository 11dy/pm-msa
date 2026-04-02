FROM eclipse-temurin:25-jdk AS build

WORKDIR /app
COPY . .
RUN chmod +x gradlew && ./gradlew :gateway:bootJar --no-daemon

FROM eclipse-temurin:25-jre

WORKDIR /app
COPY --from=build /app/gateway/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
