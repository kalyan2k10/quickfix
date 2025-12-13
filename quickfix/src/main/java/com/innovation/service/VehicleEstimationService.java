package com.innovation.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Year;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class VehicleEstimationService {

    private static final Logger logger = LoggerFactory.getLogger(VehicleEstimationService.class);

    // Regex for Indian number plates, e.g., KA-01-XX-1823 -> '18'
    private static final Pattern VEHICLE_YEAR_PATTERN = Pattern
            .compile("(?:[A-Z]{2}-\\d{2}-[A-Z]{1,2}-)(\\d{2})\\d{2}");

    /**
     * Estimates the age of a vehicle based on its registration number.
     * 
     * @param vehicleNumber The vehicle registration number.
     * @return A string describing the estimated age, or null if not calculable.
     */
    public String estimateVehicleAge(String vehicleNumber) {
        logger.info("Attempting to estimate age for vehicle number: {}", vehicleNumber);

        if (vehicleNumber == null || vehicleNumber.isBlank()) {
            logger.warn("Vehicle number is null or blank. Cannot estimate age.");
            return null;
        }

        Matcher matcher = VEHICLE_YEAR_PATTERN.matcher(vehicleNumber.toUpperCase());

        if (matcher.find()) {
            int yearDigits = Integer.parseInt(matcher.group(1));
            int currentYear = Year.now().getValue();
            int vehicleYear = 2000 + yearDigits;

            if (vehicleYear > currentYear)
                return null; // Invalid year in the future
            int age = currentYear - vehicleYear;
            String estimatedAge = age <= 0 ? "less than a year old" : age + " year(s) old";
            logger.info("Estimated age for vehicle {} is: {}", vehicleNumber, estimatedAge);
            return estimatedAge;
        }
        logger.warn("Could not match pattern for vehicle number: {}. Unable to estimate age.", vehicleNumber);
        return null;
    }
}