package com.animatedhandwriting.routes

import com.animatedhandwriting.models.CreateCaptureRequest
import com.animatedhandwriting.models.SetDefaultCaptureRequest
import com.animatedhandwriting.services.GlyphService
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import java.util.UUID

fun Route.glyphRoutes() {
   route("/capture-sets/{id}/glyphs") {

      get {
         val id = call.parameters["id"]?.toUuidOrNull()
            ?: return@get call.respond(HttpStatusCode.BadRequest, "Invalid id")
         call.respond(GlyphService.listGlyphs(id))
      }

      route("/{char}") {

         get {
            val id   = call.parameters["id"]?.toUuidOrNull()
               ?: return@get call.respond(HttpStatusCode.BadRequest, "Invalid id")
            val char = call.parameters["char"]
               ?: return@get call.respond(HttpStatusCode.BadRequest, "Missing char")
            val result = GlyphService.getGlyph(id, char)
               ?: return@get call.respond(HttpStatusCode.NotFound)
            call.respond(result)
         }

         post("/captures") {
            val id   = call.parameters["id"]?.toUuidOrNull()
               ?: return@post call.respond(HttpStatusCode.BadRequest, "Invalid id")
            val char = call.parameters["char"]
               ?: return@post call.respond(HttpStatusCode.BadRequest, "Missing char")
            val request = call.receive<CreateCaptureRequest>()
            val result = GlyphService.addCapture(id, char, request)
               ?: return@post call.respond(HttpStatusCode.NotFound, "Glyph not found")
            call.respond(HttpStatusCode.Created, result)
         }

         put("/default-capture") {
            val id      = call.parameters["id"]?.toUuidOrNull()
               ?: return@put call.respond(HttpStatusCode.BadRequest, "Invalid id")
            val char    = call.parameters["char"]
               ?: return@put call.respond(HttpStatusCode.BadRequest, "Missing char")
            val request = call.receive<SetDefaultCaptureRequest>()
            val captureId = request.captureId.toUuidOrNull()
               ?: return@put call.respond(HttpStatusCode.BadRequest, "Invalid captureId")
            if(GlyphService.setDefaultCapture(id, char, captureId)) call.respond(HttpStatusCode.NoContent)
            else call.respond(HttpStatusCode.NotFound)
         }

         delete("/captures/{captureId}") {
            val id        = call.parameters["id"]?.toUuidOrNull()
               ?: return@delete call.respond(HttpStatusCode.BadRequest, "Invalid id")
            val char      = call.parameters["char"]
               ?: return@delete call.respond(HttpStatusCode.BadRequest, "Missing char")
            val captureId = call.parameters["captureId"]?.toUuidOrNull()
               ?: return@delete call.respond(HttpStatusCode.BadRequest, "Invalid captureId")
            if(GlyphService.deleteCapture(id, char, captureId)) call.respond(HttpStatusCode.NoContent)
            else call.respond(HttpStatusCode.NotFound)
         }
      }
   }
}

private fun String.toUuidOrNull(): UUID? = try { UUID.fromString(this) } catch(e: Exception) { null }
