
package com.example.weighbridge.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PartyMasterRequestDTO(

    Long siteId,

    @NotBlank(message = "Party code is required")
    @Size(max = 50)
    String partyCode,

    @Size(max = 100)
    String partyType,

    @NotBlank(message = "Party name is required")
    @Size(max = 200)
    String partyName,

    @Size(max = 255)
    String addressLine1,

    @Size(max = 255)
    String addressLine2,

    @Size(max = 100)
    String city,

    @Pattern(
        regexp = "^$|^[0-9]{6}$",
        message = "PIN Code must contain exactly 6 digits"
    )
    String pincode,

    @Size(max = 20)
    String mobileNo,

    @Email(message = "Enter a valid email address")
    @Size(max = 150)
    String emailId,

    @Size(max = 20)
    String gstNo,

    @DecimalMin(
        value = "0.00",
        message = "Charges cannot be negative"
    )
    BigDecimal charges

) {}
