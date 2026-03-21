package com.animatedhandwriting.db

import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.timestamp

object CharacterDefinitions : Table("character_definition") {
   val id         = uuid("id").autoGenerate()
   val character  = varchar("character", 10)
   val glyphType  = varchar("glyph_type", 20)
   val sortOrder  = integer("sort_order")

   override val primaryKey = PrimaryKey(id)
}

object CaptureSets : Table("capture_set") {
   val id          = uuid("id").autoGenerate()
   val name        = varchar("name", 200)
   val description = text("description").nullable()
   val createdAt   = timestamp("created_at")

   override val primaryKey = PrimaryKey(id)
}

object CaptureSetOverrides : Table("capture_set_override") {
   val id            = uuid("id").autoGenerate()
   val captureSetId  = uuid("capture_set_id") references CaptureSets.id
   val character     = varchar("character", 10)
   val overrideType  = varchar("override_type", 10)

   override val primaryKey = PrimaryKey(id)
}

object Glyphs : Table("glyph") {
   val id                = uuid("id").autoGenerate()
   val captureSetId      = uuid("capture_set_id") references CaptureSets.id
   val character         = varchar("character", 10)
   val glyphType         = varchar("glyph_type", 20)
   val defaultCaptureId  = uuid("default_capture_id").nullable()

   override val primaryKey = PrimaryKey(id)
}

object GlyphCaptures : Table("glyph_capture") {
   val id          = uuid("id").autoGenerate()
   val glyphId     = uuid("glyph_id") references Glyphs.id
   val capturedAt  = timestamp("captured_at")
   val strokes     = text("strokes")
   val canvasMeta  = text("canvas_meta")
   val notes       = text("notes").nullable()

   override val primaryKey = PrimaryKey(id)
}

object Diagrams : Table("diagram") {
   val id          = uuid("id").autoGenerate()
   val name        = varchar("name", 200)
   val aspectRatio = double("aspect_ratio")
   val strokes     = text("strokes").default("[]")
   val createdAt   = timestamp("created_at")
   val updatedAt   = timestamp("updated_at")

   override val primaryKey = PrimaryKey(id)
}
