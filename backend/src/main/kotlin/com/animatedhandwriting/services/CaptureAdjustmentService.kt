package com.animatedhandwriting.services

import com.animatedhandwriting.db.CaptureAdjustments
import com.animatedhandwriting.models.CaptureAdjustment
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction
import java.util.UUID

object CaptureAdjustmentService {

   fun get(captureId: UUID): CaptureAdjustment = transaction {
      CaptureAdjustments.selectAll()
         .where { CaptureAdjustments.glyphCaptureId eq captureId }
         .singleOrNull()
         ?.let { CaptureAdjustment(it[CaptureAdjustments.scale], it[CaptureAdjustments.yOffset]) }
         ?: CaptureAdjustment()
   }

   fun upsert(captureId: UUID, scale: Double, yOffset: Double): CaptureAdjustment {
      require(scale in 0.1..3.0) { "scale must be between 0.1 and 3.0" }
      require(yOffset in -1.0..1.0) { "yOffset must be between -1.0 and 1.0" }
      return transaction {
         CaptureAdjustments.deleteWhere { glyphCaptureId eq captureId }
         CaptureAdjustments.insert {
            it[glyphCaptureId] = captureId
            it[this.scale]     = scale
            it[this.yOffset]   = yOffset
         }
         CaptureAdjustment(scale, yOffset)
      }
   }

   fun getAll(captureIds: List<UUID>): Map<UUID, CaptureAdjustment> = transaction {
      if(captureIds.isEmpty()) return@transaction emptyMap()
      CaptureAdjustments.selectAll()
         .where { CaptureAdjustments.glyphCaptureId inList captureIds }
         .associate {
            it[CaptureAdjustments.glyphCaptureId] to
               CaptureAdjustment(it[CaptureAdjustments.scale], it[CaptureAdjustments.yOffset])
         }
   }
}
