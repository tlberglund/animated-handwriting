package com.animatedhandwriting.routes

import com.animatedhandwriting.models.*
import com.animatedhandwriting.services.DiagramService
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.util.UUID

fun Route.diagramRoutes() {
   route("/diagrams") {

      get {
         call.respond(DiagramService.listDiagrams())
      }

      post {
         val request = call.receive<CreateDiagramRequest>()
         val created = DiagramService.createDiagram(request.name, request.aspectRatio)
         call.respond(HttpStatusCode.Created, created)
      }

      route("/{id}") {

         get {
            val id = call.parameters["id"]?.toUuidOrNull()
               ?: return@get call.respond(HttpStatusCode.BadRequest, "Invalid id")
            val result = DiagramService.getDiagram(id)
               ?: return@get call.respond(HttpStatusCode.NotFound)
            call.respond(result)
         }

         put {
            val id = call.parameters["id"]?.toUuidOrNull()
               ?: return@put call.respond(HttpStatusCode.BadRequest, "Invalid id")
            val request = call.receive<UpdateDiagramRequest>()
            val result = DiagramService.updateDiagram(id, request.name, request.strokes)
               ?: return@put call.respond(HttpStatusCode.NotFound)
            call.respond(result)
         }

         delete {
            val id = call.parameters["id"]?.toUuidOrNull()
               ?: return@delete call.respond(HttpStatusCode.BadRequest, "Invalid id")
            if(DiagramService.deleteDiagram(id)) call.respond(HttpStatusCode.NoContent)
            else call.respond(HttpStatusCode.NotFound)
         }

         get("/export") {
            val id = call.parameters["id"]?.toUuidOrNull()
               ?: return@get call.respond(HttpStatusCode.BadRequest, "Invalid id")
            val result = DiagramService.exportDiagram(id)
               ?: return@get call.respond(HttpStatusCode.NotFound)
            call.respond(result)
         }
      }
   }
}

private fun String.toUuidOrNull(): UUID? = try { UUID.fromString(this) } catch(e: Exception) { null }
