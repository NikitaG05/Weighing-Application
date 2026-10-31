
package com.example.weighbridge.service;

import com.example.weighbridge.dto.WeighmentSyncRequestDTO;
import com.example.weighbridge.dto.WeighmentSyncResponseDTO;
import com.example.weighbridge.model.WeighmentRecord;
import com.example.weighbridge.repository.WeighmentRecordRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
public class WeighmentSyncService {

    private final WeighmentRecordRepository repository;

    public WeighmentSyncService(
            WeighmentRecordRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public WeighmentSyncResponseDTO sync(
            WeighmentSyncRequestDTO request,
            Long authorizedSiteId) {

        if (request == null) {
            throw badRequest("Sync request is required");
        }

        if (authorizedSiteId == null
                || authorizedSiteId <= 0
                || !authorizedSiteId.equals(request.siteId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Not authorized to synchronize this site"
            );
        }

        if (request.sourceTransactionId() == null
                || request.sourceTransactionId() <= 0) {
            throw badRequest("Invalid source transaction ID");
        }

        if (request.ticketNo() == null
                || request.ticketNo().isBlank()
                || request.ticketNo().length() > 50) {
            throw badRequest(
                    "Ticket number is required (maximum 50 characters)"
            );
        }

        validateLengths(request);
        validateWeights(request);
   
        WeighmentRecord record = repository
                .findForUpdate(
                        authorizedSiteId,
                        request.sourceTransactionId()
                )
                .orElseGet(WeighmentRecord::new);

        Long incomingRevision = request.sourceRevision();
        Long storedRevision = record.getSourceRevision();

        if (incomingRevision != null && incomingRevision <= 0) {
        throw badRequest("Source revision must be greater than zero");
        }

        if (record.getId() != null) {

        if (storedRevision != null) {

                if (incomingRevision == null) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Source revision is required for an existing versioned transaction"
                );
                }

                if (incomingRevision < storedRevision) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Outdated weighment revision. Stored revision: "
                                + storedRevision
                );
                }

                if (incomingRevision.equals(storedRevision)) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Revision already exists. A newer revision is required"
                );
                }
        }
        }

        record.setSourceRevision(incomingRevision);


        record.setSiteId(authorizedSiteId);
        record.setSourceTransactionId(
                request.sourceTransactionId()
        );
        record.setTicketNo(request.ticketNo().trim());
        record.setWbName(request.wbName());
        record.setVehicleNo(request.vehicleNo());
        record.setPartyName(request.partyName());
        record.setProductName(request.productName());
        record.setGrossWeight(request.grossWeight());
        record.setTareWeight(request.tareWeight());
        record.setNetWeight(request.netWeight());
        record.setTicketDate(request.ticketDate());
        record.setGrossDate(request.grossDate());
        record.setTareDate(request.tareDate());
        record.setStatus(request.status());
        record.setCompleted(
                Boolean.TRUE.equals(request.completed())
        );
        record.setDeleted(
                Boolean.TRUE.equals(request.deleted())
        );
        record.setOperatorName(request.operatorName());
        record.setShiftName(request.shiftName());

        return toResponse(repository.saveAndFlush(record));
    }

    @Transactional(readOnly = true)
    public List<WeighmentSyncResponseDTO> getBySite(
            Long siteId) {

        requireValidSiteId(siteId);

        return repository
                .findBySiteIdAndDeletedFalseOrderByTicketDateDesc(
                        siteId
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<WeighmentSyncResponseDTO> getCompletedBySite(
            Long siteId) {

        requireValidSiteId(siteId);

        return repository
                .findBySiteIdAndCompletedTrueAndDeletedFalseOrderByTicketDateDesc(
                        siteId
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public WeighmentSyncResponseDTO getBySourceTransaction(
            Long siteId,
            Integer sourceTransactionId) {

        requireValidSiteId(siteId);

        if (sourceTransactionId == null
                || sourceTransactionId <= 0) {
            throw badRequest("Invalid source transaction ID");
        }

        WeighmentRecord record = repository
                .findBySiteIdAndSourceTransactionId(
                        siteId,
                        sourceTransactionId
                )
                .filter(r -> !Boolean.TRUE.equals(r.getDeleted()))
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Weighment transaction not found"
                        )
                );

        return toResponse(record);
    }

    private void requireValidSiteId(Long siteId) {
        if (siteId == null || siteId <= 0) {
            throw badRequest("Valid site ID is required");
        }
    }

    private void validateLengths(
            WeighmentSyncRequestDTO request) {

        checkLength(request.wbName(), 100, "Weighbridge name");
        checkLength(request.vehicleNo(), 100, "Vehicle number");
        checkLength(request.partyName(), 200, "Party name");
        checkLength(request.productName(), 200, "Product name");
        checkLength(request.status(), 50, "Status");
        checkLength(request.operatorName(), 100, "Operator name");
        checkLength(request.shiftName(), 100, "Shift name");
    }

    private void checkLength(
            String value,
            int maxLength,
            String fieldName) {

        if (value != null && value.length() > maxLength) {
            throw badRequest(
                    fieldName + " exceeds " + maxLength + " characters"
            );
        }
    }

    private void validateWeights(
            WeighmentSyncRequestDTO request) {

        if (request.grossWeight() == null
                || request.grossWeight().signum() < 0) {
            throw badRequest(
                    "Gross weight must be zero or greater"
            );
        }

        if (request.tareWeight() == null
                || request.tareWeight().signum() < 0) {
            throw badRequest(
                    "Tare weight must be zero or greater"
            );
        }

        if (request.netWeight() != null
                && request.netWeight().signum() < 0) {
            throw badRequest(
                    "Net weight cannot be negative"
            );
        }

        validatePrecision(request.grossWeight(), "Gross weight");
        validatePrecision(request.tareWeight(), "Tare weight");
        validatePrecision(request.netWeight(), "Net weight");

        if (Boolean.TRUE.equals(request.completed())) {

            if (request.netWeight() == null) {
                throw badRequest(
                        "Completed transactions require net weight"
                );
            }

            BigDecimal expectedNetWeight =
                    request.grossWeight()
                            .subtract(request.tareWeight())
                            .abs();

            if (request.netWeight()
                    .compareTo(expectedNetWeight) != 0) {
                throw badRequest(
                        "Net weight does not match gross/tare weights"
                );
            }
        }
    }

    private void validatePrecision(
            BigDecimal value,
            String fieldName) {

        if (value == null) {
            return;
        }

        if (value.precision() - value.scale() > 15
                || value.stripTrailingZeros().scale() > 3) {
            throw badRequest(
                    fieldName +
                    " exceeds supported precision (18,3)"
            );
        }
    }

    private ResponseStatusException badRequest(
            String message) {
        return new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                message
        );
    }

    private WeighmentSyncResponseDTO toResponse(
            WeighmentRecord record) {

        return new WeighmentSyncResponseDTO(
                record.getId(),
                record.getSiteId(),
                record.getSourceTransactionId(),
                record.getTicketNo(),
                record.getWbName(),
                record.getVehicleNo(),
                record.getPartyName(),
                record.getProductName(),
                record.getGrossWeight(),
                record.getTareWeight(),
                record.getNetWeight(),
                record.getTicketDate(),
                record.getGrossDate(),
                record.getTareDate(),
                record.getStatus(),
                record.getCompleted(),
                record.getDeleted(),
                record.getOperatorName(),
                record.getShiftName(),
                record.getSyncedAt()
        );
    }
}
