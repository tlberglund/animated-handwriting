plugins {
   kotlin("jvm") version "2.3.0"
   kotlin("plugin.serialization") version "2.3.0"
   id("io.ktor.plugin") version "3.4.0"
   application
}

group = "com.animatedhandwriting"
version = "0.0.1"

application {
   mainClass.set("com.animatedhandwriting.ApplicationKt")
}

repositories {
   mavenCentral()
}

val ktorVersion = "3.4.0"
val exposedVersion = "0.47.0"

dependencies {
   implementation("io.ktor:ktor-server-core-jvm:$ktorVersion")
   implementation("io.ktor:ktor-server-netty-jvm:$ktorVersion")
   implementation("io.ktor:ktor-server-content-negotiation-jvm:$ktorVersion")
   implementation("io.ktor:ktor-serialization-kotlinx-json-jvm:$ktorVersion")
   implementation("io.ktor:ktor-server-cors-jvm:$ktorVersion")
   implementation("io.ktor:ktor-server-call-logging-jvm:$ktorVersion")
   implementation("io.ktor:ktor-server-status-pages-jvm:$ktorVersion")
   implementation("org.jetbrains.exposed:exposed-core:$exposedVersion")
   implementation("org.jetbrains.exposed:exposed-jdbc:$exposedVersion")
   implementation("org.jetbrains.exposed:exposed-java-time:$exposedVersion")
   implementation("com.zaxxer:HikariCP:5.1.0")
   implementation("org.flywaydb:flyway-core:10.6.0")
   implementation("org.flywaydb:flyway-database-postgresql:10.6.0")
   implementation("org.postgresql:postgresql:42.7.1")
   implementation("ch.qos.logback:logback-classic:1.4.14")
   implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.9.0")
}

kotlin {
   jvmToolchain(17)
}
