
package com.example.weighbridge.repository;

import com.example.weighbridge.model.WeighmentRecord;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WeighmentRecordRepository
        extends JpaRepository<WeighmentRecord, Long> {

    Optional<WeighmentRecord>
    findBySiteIdAndSourceTransactionId(
            Long siteId,
            Integer sourceTransactionId
    );

    boolean existsBySiteIdAndSourceTransactionId(
            Long siteId,
            Integer sourceTransactionId
    );

    List<WeighmentRecord> findBySiteIdOrderByTicketDateDesc(
            Long siteId
    );

    List<WeighmentRecord>
    findBySiteIdAndDeletedFalseOrderByTicketDateDesc(
            Long siteId
    );

    List<WeighmentRecord>
    findBySiteIdAndCompletedTrueAndDeletedFalseOrderByTicketDateDesc(
            Long siteId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT w
        FROM WeighmentRecord w
        WHERE w.siteId = :siteId
          AND w.sourceTransactionId = :sourceTransactionId
        """)
    Optional<WeighmentRecord>
    findForUpdate(
            @Param("siteId") Long siteId,
            @Param("sourceTransactionId")
            Integer sourceTransactionId
    );

}
