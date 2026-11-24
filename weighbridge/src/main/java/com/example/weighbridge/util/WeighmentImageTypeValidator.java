package com.example.weighbridge.util;

public final class WeighmentImageTypeValidator {

    private WeighmentImageTypeValidator() {
    }

    public static boolean isValid(String imageType) {

        if (imageType == null) {
            return false;
        }

        return imageType.matches(
            "FirstWeightImage[12]|SecondWeightImage[12]"
            + "|GrossCamera[1-9][0-9]{0,2}"
            + "|TareCamera[1-9][0-9]{0,2}"
        );
    }
}
