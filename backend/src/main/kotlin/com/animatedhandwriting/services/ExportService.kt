package com.animatedhandwriting.services

import com.animatedhandwriting.db.*
import com.animatedhandwriting.models.*
import kotlinx.serialization.json.Json
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction
import java.util.UUID

private fun round4(v: Double): Double = Math.round(v * 10000) / 10000.0

object ExportService {

   private val json = Json { ignoreUnknownKeys = true }

   fun export(captureSetId: UUID): ExportResponse? = transaction {
      val setRow = CaptureSets.selectAll().where { CaptureSets.id eq captureSetId }
         .singleOrNull() ?: return@transaction null

      val glyphs = Glyphs.selectAll().where { Glyphs.captureSetId eq captureSetId }.toList()
      val glyphIds = glyphs.map { it[Glyphs.id] }

      val capturesByGlyphId = GlyphCaptures
         .selectAll().where { GlyphCaptures.glyphId inList glyphIds }
         .groupBy { it[GlyphCaptures.glyphId] }

      val exportGlyphs = mutableMapOf<String, ExportGlyph>()

      for(glyphRow in glyphs) {
         val glyphId    = glyphRow[Glyphs.id]
         val character  = glyphRow[Glyphs.character]
         val captures   = capturesByGlyphId[glyphId] ?: continue
         if(captures.isEmpty()) continue

         val exportCaptures = mutableListOf<ExportCapture>()
         var glyphWidth = 0.0

         for(captureRow in captures) {
            val meta         = json.decodeFromString<CanvasMeta>(captureRow[GlyphCaptures.canvasMeta])
            val rawStrokes   = json.decodeFromString<List<List<RawPoint>>>(captureRow[GlyphCaptures.strokes])
            val allPoints    = rawStrokes.flatten()
            if(allPoints.isEmpty()) continue

            val scale   = 1.0 / (meta.baselineY - meta.capHeightY)
            val minX    = allPoints.minOf { it.x }
            val maxX    = allPoints.maxOf { it.x }
            glyphWidth  = maxOf(glyphWidth, (maxX - minX) * scale)

            val normalizedStrokes = rawStrokes.map { stroke ->
               stroke.map { pt ->
                  ExportPoint(
                     x = round4((pt.x - minX) * scale),
                     y = round4((pt.y - meta.capHeightY) * scale),
                     t = pt.t,
                     p = round4(pt.p)
                  )
               }
            }

            exportCaptures.add(
               ExportCapture(
                  id      = captureRow[GlyphCaptures.id].toString(),
                  strokes = normalizedStrokes
               )
            )
         }

         if(exportCaptures.isNotEmpty()) {
            exportGlyphs[character] = ExportGlyph(
               character = character,
               width     = round4(glyphWidth),
               captures  = exportCaptures
            )
         }
      }

      ExportResponse(
         version         = 1,
         captureSetName  = setRow[CaptureSets.name],
         glyphs          = exportGlyphs
      )
   }
}
