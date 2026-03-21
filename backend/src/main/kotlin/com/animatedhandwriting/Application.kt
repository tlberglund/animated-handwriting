package com.animatedhandwriting

import com.animatedhandwriting.db.DatabaseFactory
import com.animatedhandwriting.routes.captureSetRoutes
import com.animatedhandwriting.routes.diagramRoutes
import com.animatedhandwriting.routes.glyphRoutes
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.plugins.calllogging.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.json.Json

fun main(args: Array<String>): Unit = io.ktor.server.netty.EngineMain.main(args)

fun Application.module() {
   DatabaseFactory.init(environment)

   install(ContentNegotiation) {
      json(Json {
         prettyPrint        = false
         isLenient          = true
         ignoreUnknownKeys  = true
      })
   }

   install(CallLogging)

   install(CORS) {
      anyHost()
      allowHeader(HttpHeaders.ContentType)
      allowMethod(HttpMethod.Get)
      allowMethod(HttpMethod.Post)
      allowMethod(HttpMethod.Put)
      allowMethod(HttpMethod.Patch)
      allowMethod(HttpMethod.Delete)
      allowMethod(HttpMethod.Options)
   }

   install(StatusPages) {
      exception<IllegalArgumentException> { call, cause ->
         call.respond(HttpStatusCode.BadRequest, mapOf("error" to (cause.message ?: "Bad request")))
      }
      exception<Throwable> { call, cause ->
         call.application.log.error("Unhandled exception", cause)
         call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Internal server error"))
      }
   }

   routing {
      route("/api") {
         captureSetRoutes()
         glyphRoutes()
         diagramRoutes()
      }
   }
}
