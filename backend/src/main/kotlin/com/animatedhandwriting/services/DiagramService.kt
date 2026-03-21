package com.animatedhandwriting.services

import com.animatedhandwriting.db.Diagrams
import com.animatedhandwriting.models.*
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction
import java.time.Instant
import java.util.UUID

private fun round4(v: Double): Double = Math.round(v * 10000) / 10000.0

object DiagramService {

   private val json = Json { ignoreUnknownKeys = true }

   fun listDiagrams(): List<DiagramSummary> = transaction {
      Diagrams.selectAll()
         .orderBy(Diagrams.createdAt, SortOrder.DESC)
         .map { row ->
            DiagramSummary(
               id          = row[Diagrams.id].toString(),
               name        = row[Diagrams.name],
               aspectRatio = row[Diagrams.aspectRatio],
               createdAt   = row[Diagrams.createdAt].toString(),
               updatedAt   = row[Diagrams.updatedAt].toString()
            )
         }
   }

   fun getDiagram(id: UUID): DiagramDetail? = transaction {
      Diagrams.selectAll().where { Diagrams.id eq id }
         .singleOrNull()
         ?.let { row ->
            DiagramDetail(
               id          = row[Diagrams.id].toString(),
               name        = row[Diagrams.name],
               aspectRatio = row[Diagrams.aspectRatio],
               strokes     = json.parseToJsonElement(row[Diagrams.strokes]),
               createdAt   = row[Diagrams.createdAt].toString(),
               updatedAt   = row[Diagrams.updatedAt].toString()
            )
         }
   }

   fun createDiagram(name: String, aspectRatio: Double): DiagramDetail = transaction {
      val now = Instant.now()
      val newId = Diagrams.insert {
         it[Diagrams.name]        = name
         it[Diagrams.aspectRatio] = aspectRatio
         it[Diagrams.strokes]     = "[]"
         it[Diagrams.createdAt]   = now
         it[Diagrams.updatedAt]   = now
      } get Diagrams.id

      DiagramDetail(
         id          = newId.toString(),
         name        = name,
         aspectRatio = aspectRatio,
         strokes     = json.parseToJsonElement("[]"),
         createdAt   = now.toString(),
         updatedAt   = now.toString()
      )
   }

   fun updateDiagram(id: UUID, name: String?, strokes: JsonElement?): DiagramDetail? = transaction {
      val existing = Diagrams.selectAll().where { Diagrams.id eq id }.singleOrNull()
         ?: return@transaction null

      val now = Instant.now()
      Diagrams.update({ Diagrams.id eq id }) { row ->
         name?.let    { row[Diagrams.name]    = it }
         strokes?.let { row[Diagrams.strokes] = it.toString() }
         row[Diagrams.updatedAt] = now
      }

      Diagrams.selectAll().where { Diagrams.id eq id }
         .single()
         .let { row ->
            DiagramDetail(
               id          = row[Diagrams.id].toString(),
               name        = row[Diagrams.name],
               aspectRatio = row[Diagrams.aspectRatio],
               strokes     = json.parseToJsonElement(row[Diagrams.strokes]),
               createdAt   = row[Diagrams.createdAt].toString(),
               updatedAt   = row[Diagrams.updatedAt].toString()
            )
         }
   }

   fun deleteDiagram(id: UUID): Boolean = transaction {
      Diagrams.deleteWhere { Diagrams.id eq id } > 0
   }

   fun exportDiagram(id: UUID): DiagramExport? = transaction {
      Diagrams.selectAll().where { Diagrams.id eq id }
         .singleOrNull()
         ?.let { row ->
            val rawStrokes = json.decodeFromString<List<List<DiagramExportPoint>>>(row[Diagrams.strokes])
            DiagramExport(
               version     = 1,
               name        = row[Diagrams.name],
               aspectRatio = row[Diagrams.aspectRatio],
               strokes     = rawStrokes.map { stroke ->
                  stroke.map { pt ->
                     DiagramExportPoint(x = round4(pt.x), y = round4(pt.y), t = pt.t, p = round4(pt.p))
                  }
               }
            )
         }
   }
}
