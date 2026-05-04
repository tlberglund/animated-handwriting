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

      // Batch-fetch all adjustments for this capture set (avoid N+1)
      val allCaptureIds = capturesByGlyphId.values.flatten().map { it[GlyphCaptures.id] }
      val adjustments   = CaptureAdjustmentService.getAll(allCaptureIds)

      val exportGlyphs = mutableMapOf<String, ExportGlyph>()

      for(glyphRow in glyphs) {
         val glyphId   = glyphRow[Glyphs.id]
         val character = glyphRow[Glyphs.character]
         val captures  = capturesByGlyphId[glyphId] ?: continue
         if(captures.isEmpty()) continue

         val exportCaptures = mutableListOf<ExportCapture>()

         for(captureRow in captures) {
            val captureId    = captureRow[GlyphCaptures.id]
            val meta         = json.decodeFromString<CanvasMeta>(captureRow[GlyphCaptures.canvasMeta])
            val rawStrokes   = json.decodeFromString<List<List<RawPoint>>>(captureRow[GlyphCaptures.strokes])
            val allPoints    = rawStrokes.flatten()
            if(allPoints.isEmpty()) continue

            val vertScale = 1.0 / (meta.baselineY - meta.capHeightY)
            val minX      = allPoints.minOf { it.x }
            val maxX      = allPoints.maxOf { it.x }
            val rawWidth  = (maxX - minX) * vertScale

            val adj = adjustments[captureId] ?: CaptureAdjustment()
            val s   = adj.scale
            val yo  = adj.yOffset

            val normalizedStrokes = rawStrokes.map { stroke ->
               stroke.map { pt ->
                  val nx = (pt.x - minX) * vertScale
                  val ny = (pt.y - meta.capHeightY) * vertScale
                  ExportPoint(
                     x = round4(nx * s),
                     y = round4(1.0 - (1.0 - ny) * s + yo),
                     t = pt.t,
                     p = round4(pt.p)
                  )
               }
            }

            exportCaptures.add(
               ExportCapture(
                  id      = captureId.toString(),
                  width   = round4(rawWidth * s),
                  strokes = normalizedStrokes
               )
            )
         }

         if(exportCaptures.isNotEmpty()) {
            exportGlyphs[character] = ExportGlyph(
               character = character,
               captures  = exportCaptures
            )
         }
      }

      ExportResponse(
         version        = 2,
         captureSetName = setRow[CaptureSets.name],
         glyphs         = exportGlyphs
      )
   }
}
