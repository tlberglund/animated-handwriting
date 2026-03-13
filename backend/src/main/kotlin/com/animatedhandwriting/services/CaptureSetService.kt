package com.animatedhandwriting.services

import com.animatedhandwriting.db.*
import com.animatedhandwriting.models.*
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.Instant
import java.util.UUID

object CaptureSetService {

   fun listAll(): List<CaptureSetResponse> = transaction {
      CaptureSets.selectAll()
         .orderBy(CaptureSets.createdAt, SortOrder.DESC)
         .map { it.toCaptureSetResponse() }
   }

   fun findById(id: UUID): CaptureSetResponse? = transaction {
      CaptureSets.select { CaptureSets.id eq id }
         .singleOrNull()
         ?.toCaptureSetResponse()
   }

   fun create(request: CreateCaptureSetRequest): CaptureSetResponse = transaction {
      val setId = CaptureSets.insert {
         it[name]        = request.name
         it[description] = request.description
         it[createdAt]   = Instant.now()
      } get CaptureSets.id

      // Auto-create glyph rows for all characters in the effective set
      val characters = effectiveCharacterSet(setId)
      for(charDef in characters) {
         Glyphs.insert {
            it[captureSetId] = setId
            it[character]    = charDef.first
            it[glyphType]    = charDef.second
         }
      }

      CaptureSets.select { CaptureSets.id eq setId }
         .single()
         .toCaptureSetResponse()
   }

   fun update(id: UUID, request: UpdateCaptureSetRequest): CaptureSetResponse? = transaction {
      val updated = CaptureSets.update({ CaptureSets.id eq id }) {
         request.name?.let        { n -> it[name]        = n }
         request.description?.let { d -> it[description] = d }
      }
      if(updated == 0) null
      else CaptureSets.select { CaptureSets.id eq id }.single().toCaptureSetResponse()
   }

   fun delete(id: UUID): Boolean = transaction {
      CaptureSets.deleteWhere { CaptureSets.id eq id } > 0
   }

   fun getProgress(captureSetId: UUID): ProgressResponse = transaction {
      val glyphs = Glyphs.select { Glyphs.captureSetId eq captureSetId }
         .orderBy(Glyphs.character)
         .toList()

      val captureCountsByGlyphId = GlyphCaptures
         .slice(GlyphCaptures.glyphId, GlyphCaptures.id.count())
         .select { GlyphCaptures.glyphId inList glyphs.map { it[Glyphs.id] } }
         .groupBy(GlyphCaptures.glyphId)
         .associate { it[GlyphCaptures.glyphId] to it[GlyphCaptures.id.count()].toInt() }

      // Map glyph type → sort_order for walkthrough ordering
      val sortOrders = CharacterDefinitions.selectAll()
         .associate { it[CharacterDefinitions.character] to it[CharacterDefinitions.sortOrder] }

      val sortedGlyphs = glyphs.sortedBy { sortOrders[it[Glyphs.character]] ?: Int.MAX_VALUE }

      val total     = glyphs.size
      val captured  = glyphs.count { (captureCountsByGlyphId[it[Glyphs.id]] ?: 0) > 0 }
      val remaining = total - captured

      val nextUncaptured = sortedGlyphs
         .firstOrNull { (captureCountsByGlyphId[it[Glyphs.id]] ?: 0) == 0 }
         ?.get(Glyphs.character)

      val byType = GlyphType.entries.associate { type ->
         val typeGlyphs = glyphs.filter { it[Glyphs.glyphType] == type.name }
         type.name to ProgressByType(
            total    = typeGlyphs.size,
            captured = typeGlyphs.count { (captureCountsByGlyphId[it[Glyphs.id]] ?: 0) > 0 }
         )
      }

      ProgressResponse(
         total          = total,
         captured       = captured,
         remaining      = remaining,
         nextUncaptured = nextUncaptured,
         byType         = byType
      )
   }

   // Returns list of (character, glyphType) for the effective set of a capture set,
   // accounting for ADD/EXCLUDE overrides.
   fun effectiveCharacterSet(captureSetId: UUID): List<Pair<String, String>> {
      val global = CharacterDefinitions.selectAll()
         .orderBy(CharacterDefinitions.sortOrder)
         .map { it[CharacterDefinitions.character] to it[CharacterDefinitions.glyphType] }
         .toMutableList()

      val overrides = CaptureSetOverrides
         .select { CaptureSetOverrides.captureSetId eq captureSetId }
         .map { it[CaptureSetOverrides.character] to it[CaptureSetOverrides.overrideType] }

      val excludes = overrides.filter { it.second == OverrideType.EXCLUDE.name }.map { it.first }.toSet()
      val adds     = overrides.filter { it.second == OverrideType.ADD.name }

      val result = global.filter { it.first !in excludes }.toMutableList()
      for((char, _) in adds) {
         if(result.none { it.first == char }) {
            result.add(char to GlyphType.LOWER.name)
         }
      }
      return result
   }

   private fun ResultRow.toCaptureSetResponse() = CaptureSetResponse(
      id          = this[CaptureSets.id].toString(),
      name        = this[CaptureSets.name],
      description = this[CaptureSets.description],
      createdAt   = this[CaptureSets.createdAt].toString()
   )
}
