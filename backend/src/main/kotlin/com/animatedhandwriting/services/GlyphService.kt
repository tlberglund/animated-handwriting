package com.animatedhandwriting.services

import com.animatedhandwriting.db.*
import com.animatedhandwriting.models.*
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.Instant
import java.util.UUID

object GlyphService {

   private val json = Json { ignoreUnknownKeys = true }

   fun listGlyphs(captureSetId: UUID): List<GlyphSummary> = transaction {
      val counts = GlyphCaptures
         .slice(GlyphCaptures.glyphId, GlyphCaptures.id.count())
         .select { GlyphCaptures.glyphId inList
            Glyphs.select { Glyphs.captureSetId eq captureSetId }.map { it[Glyphs.id] }
         }
         .groupBy(GlyphCaptures.glyphId)
         .associate { it[GlyphCaptures.glyphId] to it[GlyphCaptures.id.count()].toInt() }

      Glyphs.select { Glyphs.captureSetId eq captureSetId }
         .map {
            GlyphSummary(
               id           = it[Glyphs.id].toString(),
               character    = it[Glyphs.character],
               glyphType    = it[Glyphs.glyphType],
               captureCount = counts[it[Glyphs.id]] ?: 0
            )
         }
   }

   fun getGlyph(captureSetId: UUID, character: String): GlyphDetail? = transaction {
      val glyphRow = Glyphs.select {
         (Glyphs.captureSetId eq captureSetId) and (Glyphs.character eq character)
      }.singleOrNull() ?: return@transaction null

      val captures = GlyphCaptures
         .select { GlyphCaptures.glyphId eq glyphRow[Glyphs.id] }
         .orderBy(GlyphCaptures.capturedAt)
         .map { row ->
            GlyphCaptureResponse(
               id         = row[GlyphCaptures.id].toString(),
               capturedAt = row[GlyphCaptures.capturedAt].toString(),
               strokes    = json.parseToJsonElement(row[GlyphCaptures.strokes]),
               canvasMeta = json.parseToJsonElement(row[GlyphCaptures.canvasMeta]),
               notes      = row[GlyphCaptures.notes]
            )
         }

      GlyphDetail(
         id        = glyphRow[Glyphs.id].toString(),
         character = glyphRow[Glyphs.character],
         glyphType = glyphRow[Glyphs.glyphType],
         captures  = captures
      )
   }

   fun addCapture(captureSetId: UUID, character: String, request: CreateCaptureRequest): GlyphCaptureResponse? = transaction {
      val glyphRow = Glyphs.select {
         (Glyphs.captureSetId eq captureSetId) and (Glyphs.character eq character)
      }.singleOrNull() ?: return@transaction null

      val captureId = GlyphCaptures.insert {
         it[glyphId]    = glyphRow[Glyphs.id]
         it[capturedAt] = Instant.now()
         it[strokes]    = request.strokes.toString()
         it[canvasMeta] = request.canvasMeta.toString()
         it[notes]      = request.notes
      } get GlyphCaptures.id

      GlyphCaptures.select { GlyphCaptures.id eq captureId }
         .single()
         .let { row ->
            GlyphCaptureResponse(
               id         = row[GlyphCaptures.id].toString(),
               capturedAt = row[GlyphCaptures.capturedAt].toString(),
               strokes    = json.parseToJsonElement(row[GlyphCaptures.strokes]),
               canvasMeta = json.parseToJsonElement(row[GlyphCaptures.canvasMeta]),
               notes      = row[GlyphCaptures.notes]
            )
         }
   }

   fun deleteCapture(captureSetId: UUID, character: String, captureId: UUID): Boolean = transaction {
      val glyphRow = Glyphs.select {
         (Glyphs.captureSetId eq captureSetId) and (Glyphs.character eq character)
      }.singleOrNull() ?: return@transaction false

      GlyphCaptures.deleteWhere {
         (GlyphCaptures.id eq captureId) and (GlyphCaptures.glyphId eq glyphRow[Glyphs.id])
      } > 0
   }
}
