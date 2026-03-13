package com.animatedhandwriting.routes

import com.animatedhandwriting.models.*
import com.animatedhandwriting.services.CaptureSetService
import com.animatedhandwriting.services.ExportService
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.util.UUID

fun Route.captureSetRoutes() {
   route("/capture-sets") {

      get {
         call.respond(CaptureSetService.listAll())
      }

      post {
         val request = call.receive<CreateCaptureSetRequest>()
         val created = CaptureSetService.create(request)
         call.respond(HttpStatusCode.Created, created)
      }

      route("/{id}") {

         get {
            val id = call.parameters["id"]?.toUuidOrNull()
               ?: return@get call.respond(HttpStatusCode.BadRequest, "Invalid id")
            val result = CaptureSetService.findById(id)
               ?: return@get call.respond(HttpStatusCode.NotFound)
            call.respond(result)
         }

         patch {
            val id = call.parameters["id"]?.toUuidOrNull()
               ?: return@patch call.respond(HttpStatusCode.BadRequest, "Invalid id")
            val request = call.receive<UpdateCaptureSetRequest>()
            val result = CaptureSetService.update(id, request)
               ?: return@patch call.respond(HttpStatusCode.NotFound)
            call.respond(result)
         }

         delete {
            val id = call.parameters["id"]?.toUuidOrNull()
               ?: return@delete call.respond(HttpStatusCode.BadRequest, "Invalid id")
            if(CaptureSetService.delete(id)) call.respond(HttpStatusCode.NoContent)
            else call.respond(HttpStatusCode.NotFound)
         }

         get("/progress") {
            val id = call.parameters["id"]?.toUuidOrNull()
               ?: return@get call.respond(HttpStatusCode.BadRequest, "Invalid id")
            call.respond(CaptureSetService.getProgress(id))
         }

         get("/export") {
            val id = call.parameters["id"]?.toUuidOrNull()
               ?: return@get call.respond(HttpStatusCode.BadRequest, "Invalid id")
            val result = ExportService.export(id)
               ?: return@get call.respond(HttpStatusCode.NotFound)
            call.respond(result)
         }
      }
   }
}

private fun String.toUuidOrNull(): UUID? = try { UUID.fromString(this) } catch(e: Exception) { null }
