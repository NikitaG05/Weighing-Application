package com.example.weighbridge.repository;

import com.example.weighbridge.model.WeighmentImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WeighmentImageRepository
        extends JpaRepository<WeighmentImage, Long> {

    Optional<WeighmentImage> findByWeighmentIdAndImageType(
            Long weighmentId,
            String imageType
    );

    List<WeighmentImage> findByWeighmentId(
            Long weighmentId
    );
}
