package com.innovation.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.stream.Collectors;
import jakarta.annotation.PostConstruct;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class VehicleEstimationService {

    private static final Logger logger = LoggerFactory.getLogger(VehicleEstimationService.class);
    private static final Map<String, String> vehicleAgeCache = new ConcurrentHashMap<>();
    private final WebClient webClient;
    private final String apiKey;
    private static final String GEMINI_MODEL = "gemini-pro-latest"; // Using a model confirmed to be available

    public VehicleEstimationService(WebClient.Builder webClientBuilder,
            @Value("${gemini.api.key}") String apiKey) {
        this.apiKey = apiKey;
        // Point to the Google Gemini API endpoint
        this.webClient = webClientBuilder
                .baseUrl("https://generativelanguage.googleapis.com")
                .build();
    }

    // --- DTOs for Gemini API ---
    private record GeminiRequest(List<Content> contents) {
    }

    private record Content(List<Part> parts) {
    }

    private record Part(String text) {
    }

    private record GeminiResponse(List<Candidate> candidates) {
    }

    private record Candidate(Content content) {
    }

    // --- DTOs for Listing Models ---
    private record ModelListResponse(List<ModelInfo> models) {
    }

    private record ModelInfo(String name, String displayName) {
    }

    @PostConstruct
    public void listAvailableModels() {
        logger.info("Fetching available Gemini models on startup...");
        try {
            Mono<ModelListResponse> responseMono = this.webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/v1beta/models")
                            .queryParam("key", this.apiKey)
                            .build())
                    .retrieve()
                    .bodyToMono(ModelListResponse.class);

            ModelListResponse response = responseMono.block(Duration.ofSeconds(20));
            logger.warn("Listing available Gemini models..");
            if (response != null && response.models() != null && !response.models().isEmpty()) {
                String availableModels = response.models().stream()
                        .map(model -> model.name().replace("models/", ""))
                        .collect(Collectors.joining(", "));
                logger.info("Successfully fetched available models: {}", availableModels);
            } else {
                logger.warn("Could not fetch or no available models found.");
            }
        } catch (Exception e) {
            logger.error(
                    "Failed to fetch available Gemini models. This may indicate an API key or permission issue. Error: {}",
                    e.getMessage());
        }
    }

    /**
     * Estimates the age of a vehicle by calling an external AI service.
     * This is a blocking call for simplicity in this context.
     *
     * @param vehicleNumber The vehicle registration number.
     * @return A string describing the estimated age, or null if not calculable.
     */
    public String estimateVehicleAge(String vehicleNumber) {
        if (vehicleNumber == null || vehicleNumber.isBlank()) {
            logger.warn("Vehicle number is null or blank. Cannot estimate age.");
            return null;
        }

        // Check cache first
        if (vehicleAgeCache.containsKey(vehicleNumber)) {
            logger.info("Returning cached age for vehicle number: {}", vehicleNumber);
            return vehicleAgeCache.get(vehicleNumber);
        }

        // If not in cache, call the API
        logger.info("Calling Gemini to estimate age for vehicle number: {}", vehicleNumber);

        String prompt = String.format(
                "Based on the Indian vehicle registration number '%s', what is the estimated age of the vehicle? " +
                        "Please provide only a concise string like '5 year(s) old' or 'less than a year old'. " +
                        "If the age cannot be determined from the number, just return 'unknown'.",
                vehicleNumber);

        GeminiRequest request = new GeminiRequest(List.of(new Content(List.of(new Part(prompt)))));

        try {
            Mono<GeminiResponse> responseMono = this.webClient.post() // Use the base webClient
                    .uri(uriBuilder -> uriBuilder
                            .path("/v1beta/models/{model}:generateContent")
                            .queryParam("key", this.apiKey)
                            .build(GEMINI_MODEL))
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(GeminiResponse.class);

            // We block here to get the result synchronously.
            GeminiResponse response = responseMono.block(Duration.ofSeconds(20));

            if (response != null && response.candidates() != null && !response.candidates().isEmpty()) {
                String estimatedAge = response.candidates().get(0).content().parts().get(0).text().trim();
                logger.info("Successfully received age estimation from Gemini for {}: {}", vehicleNumber, estimatedAge);
                // Store the result in the cache before returning
                vehicleAgeCache.put(vehicleNumber, estimatedAge);
                return estimatedAge;
            } else {
                logger.warn("Received an empty or invalid response from Gemini for vehicle: {}", vehicleNumber);
                return null;
            }
        } catch (Exception e) {
            logger.error("Failed to call Gemini API for vehicle number: {}. Error: {}",
                    vehicleNumber, e.getMessage());
            return null; // Return null on any error (e.g., timeout, network issue, 4xx/5xx)
        }
    }
}