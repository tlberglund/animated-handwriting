package com.animatedhandwriting.models

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

// ── Enums ────────────────────────────────────────────────────────────────────

enum class GlyphType { LOWER, UPPER, DIGIT, PUNCT, LIGATURE }

enum class OverrideType { ADD, EXCLUDE }

// ── Capture Set ──────────────────────────────────────────────────────────────

@Serializable
data class CaptureSetResponse(
   val id: String,
   val name: String,
   val description: String?,
   val createdAt: String
)

@Serializable
data class CreateCaptureSetRequest(
   val name: String,
   val description: String? = null
)

@Serializable
data class UpdateCaptureSetRequest(
   val name: String? = null,
   val description: String? = null
)

// ── Glyph ────────────────────────────────────────────────────────────────────

@Serializable
data class GlyphSummary(
   val id: String,
   val character: String,
   val glyphType: String,
   val captureCount: Int
)

@Serializable
data class GlyphDetail(
   val id: String,
   val character: String,
   val glyphType: String,
   val captures: List<GlyphCaptureResponse>
)

// ── Glyph Capture ─────────────────────────────────────────────────────────────

@Serializable
data class GlyphCaptureResponse(
   val id: String,
   val capturedAt: String,
   val strokes: JsonElement,
   val canvasMeta: JsonElement,
   val notes: String?
)

@Serializable
data class CreateCaptureRequest(
   val strokes: JsonElement,
   val canvasMeta: JsonElement,
   val notes: String? = null
)

// ── Progress ─────────────────────────────────────────────────────────────────

@Serializable
data class ProgressByType(
   val total: Int,
   val captured: Int
)

@Serializable
data class ProgressResponse(
   val total: Int,
   val captured: Int,
   val remaining: Int,
   val nextUncaptured: String?,
   val byType: Map<String, ProgressByType>
)

// ── Export ───────────────────────────────────────────────────────────────────

@Serializable
data class ExportPoint(
   val x: Double,
   val y: Double,
   val t: Long,
   val p: Double
)

@Serializable
data class ExportCapture(
   val id: String,
   val strokes: List<List<ExportPoint>>
)

@Serializable
data class ExportGlyph(
   val character: String,
   val width: Double,
   val captures: List<ExportCapture>
)

@Serializable
data class ExportResponse(
   val version: Int = 1,
   val captureSetName: String,
   val glyphs: Map<String, ExportGlyph>
)

// ── Internal normalization types ─────────────────────────────────────────────

@Serializable
data class RawPoint(
   val x: Double,
   val y: Double,
   val t: Long,
   val p: Double
)

@Serializable
data class CanvasMeta(
   val frameWidth: Double,
   val frameHeight: Double,
   val capHeightY: Double,
   val baselineY: Double
)
